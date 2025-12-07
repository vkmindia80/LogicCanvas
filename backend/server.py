from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import os
import uuid
import json
import requests
from execution_engine import WorkflowExecutionEngine, ExpressionEvaluator
from variable_manager import VariableManager, VariableType, VariableScope
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext

# JWT / Auth configuration
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(plain_password, password_hash)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    return db["users"].find_one({"email": email})


async def get_current_user(token: str = Security(oauth2_scheme)) -> Dict[str, Any]:
    """Decode JWT and return current user document.

    For now this is used primarily for auditing and simple RBAC checks and is
    only attached to specific endpoints, so existing anonymous flows continue
    to work unchanged unless explicitly protected.
    """
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        email: Optional[str] = payload.get("email")
        if user_id is None or email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db["users"].find_one({"id": user_id, "email": email}, {"_id": 0})
    if not user:
        raise credentials_exception
    return user


def require_roles(*allowed_roles: str):
    async def dependency(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        role = current_user.get("role")
        if allowed_roles and role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user

    return dependency



app = FastAPI(title="LogicCanvas Workflow Builder API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['logiccanvas']

# Collections
workflows_collection = db['workflows']
workflow_instances_collection = db['workflow_instances']
forms_collection = db['forms']
form_submissions_collection = db['form_submissions']
tasks_collection = db['tasks']
approvals_collection = db['approvals']
notifications_collection = db['notifications']
audit_logs_collection = db['audit_logs']
api_connectors_collection = db['api_connectors']
workflow_components_collection = db['workflow_components']  # Phase 3.1: Reusable components
workflow_versions_collection = db['workflow_versions']  # Phase 3.1: Version management
integrations_collection = db['integrations']  # Phase A Sprint 4: Integration Hub

# Initialize Execution Engine
execution_engine = WorkflowExecutionEngine(db)

# Initialize Variable Manager
variable_manager = VariableManager(db)

# Initialize Scheduler
scheduler = BackgroundScheduler()
scheduler.start()

# Shutdown event handler
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    await close_http_clients()
    scheduler.shutdown()

# Webhook registry for workflow triggers
webhook_registry = {}  # workflow_id -> webhook_token

# Pydantic Models
class WorkflowNode(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    condition: Optional[str] = None
    # Optional handle IDs from React Flow for multi-connector nodes (e.g., decision yes/no)
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class Workflow(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    status: str = "draft"  # draft, published, paused, archived
    version: int = 1
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    tags: List[str] = []

class FormField(BaseModel):
    id: str
    type: str
    label: str
    required: bool = False
    placeholder: Optional[str] = None
    options: Optional[List[str]] = None
    validation: Optional[Dict[str, Any]] = None
    conditional_visibility: Optional[Dict[str, Any]] = None

class Form(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    fields: List[FormField]
    version: int = 1
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Task(BaseModel):
    id: Optional[str] = None
    workflow_instance_id: str
    node_id: str
    title: str
    description: Optional[str] = ""
    assigned_to: Optional[str] = None
    assigned_by: Optional[str] = None
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "pending"  # pending, in_progress, completed, cancelled
    due_date: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Approval(BaseModel):
    id: Optional[str] = None
    workflow_instance_id: str
    node_id: str
    title: str
    description: Optional[str] = ""
    approvers: List[str]
    approval_type: str = "single"  # single, sequential, parallel, unanimous, majority
    status: str = "pending"  # pending, approved, rejected, changes_requested
    decisions: List[Dict[str, Any]] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# Sprint 4: API Connector Models
class AuthConfig(BaseModel):
    type: str  # none, oauth2, api_key, basic, bearer, custom
    config: Dict[str, Any] = {}

class ResponseMapping(BaseModel):
    source_path: str
    target_variable: str
    type: str  # string, number, boolean, array, object, date
    transform: str = "none"  # none, uppercase, lowercase, parse_json, format_date

class ErrorHandling(BaseModel):
    retry_count: int = 3
    retry_delay: int = 1000
    timeout: int = 30000
    on_error: str = "fail"  # fail, continue, retry

class ConnectorConfig(BaseModel):
    method: str  # GET, POST, PUT, PATCH, DELETE
    url: str
    headers: Dict[str, str] = {}
    query_params: Dict[str, str] = {}
    body: Optional[Any] = None
    auth: AuthConfig

class APIConnector(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    category: str = "custom"  # payment, communication, storage, ai, custom
    is_template: bool = False
    config: ConnectorConfig
    response_mapping: List[ResponseMapping] = []
    error_handling: ErrorHandling = ErrorHandling()
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# Sprint 4: Debugging Models
class Breakpoint(BaseModel):
    node_id: str
    enabled: bool = True
    condition: Optional[str] = None

class ExecutionLog(BaseModel):
    timestamp: str
    node_id: str
    level: str  # debug, info, warning, error
    message: str
    data: Dict[str, Any] = {}

# Health Check
@app.get("/api/health")
async def health_check():
    try:
        client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# Workflow Endpoints
@app.get("/api/workflows")
async def get_workflows(status: Optional[str] = None, tag: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if tag:
        query["tags"] = tag
    
    workflows = list(workflows_collection.find(query, {"_id": 0}))
    return {"workflows": workflows, "count": len(workflows)}

@app.get("/api/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@app.post("/api/workflows")
async def create_workflow(workflow: Workflow):
    workflow_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    workflow_dict = workflow.dict()
    workflow_dict["id"] = workflow_id
    workflow_dict["created_at"] = now
    workflow_dict["updated_at"] = now
    
    workflows_collection.insert_one(workflow_dict)
    
    # Log audit
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "created",
        "timestamp": now
    })
    
    return {"message": "Workflow created successfully", "id": workflow_id}

@app.put("/api/workflows/{workflow_id}")
async def update_workflow(workflow_id: str, workflow: Workflow):
    existing = workflows_collection.find_one({"id": workflow_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    now = datetime.utcnow().isoformat()
    workflow_dict = workflow.dict()
    workflow_dict["id"] = workflow_id
    workflow_dict["created_at"] = existing.get("created_at")
    workflow_dict["updated_at"] = now
    workflow_dict["last_modified_by"] = "current_user"  # TODO: get from auth context
    
    # Auto-validate on save
    issues = _validate_workflow_document(workflow_dict)
    workflow_dict["validation_issues"] = issues
    workflow_dict["validation_status"] = "valid" if len([i for i in issues if i.get("type") == "error"]) == 0 else "invalid"
    workflow_dict["last_validated_at"] = now
    
    workflows_collection.replace_one({"id": workflow_id}, workflow_dict)
    
    # Log audit
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "updated",
        "details": {
            "validation_status": workflow_dict["validation_status"],
            "issue_count": len(issues)
        },
        "timestamp": now
    })
    
    return {
        "message": "Workflow updated successfully",
        "validation": {
            "status": workflow_dict["validation_status"],
            "issues": issues,
            "issue_count": len(issues)
        }
    }

@app.delete("/api/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str):
    result = workflows_collection.delete_one({"id": workflow_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Log audit
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "deleted",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"message": "Workflow deleted successfully"}


# ========== PHASE 8 SPRINT 3: LIFECYCLE MANAGEMENT ENDPOINTS ==========

class LifecycleTransition(BaseModel):
    comment: Optional[str] = None
    changed_by: Optional[str] = "system"

@app.post("/api/workflows/{workflow_id}/lifecycle/review")
async def request_review(workflow_id: str, data: LifecycleTransition):
    """Transition workflow from Draft to In Review"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    current_state = workflow.get("lifecycle_state", workflow.get("status", "draft"))
    if current_state != "draft":
        raise HTTPException(status_code=400, detail=f"Can only request review from draft state. Current state: {current_state}")
    
    now = datetime.utcnow().isoformat()
    
    # Initialize lifecycle_history if it doesn't exist
    lifecycle_history = workflow.get("lifecycle_history", [])
    lifecycle_history.append({
        "from_state": current_state,
        "to_state": "in_review",
        "changed_by": data.changed_by,
        "comment": data.comment,
        "timestamp": now
    })
    
    workflows_collection.update_one(
        {"id": workflow_id},
        {
            "$set": {
                "lifecycle_state": "in_review",
                "lifecycle_history": lifecycle_history,
                "updated_at": now
            }
        }
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "lifecycle_transition",
        "user": data.changed_by,
        "details": {"from": current_state, "to": "in_review", "comment": data.comment},
        "timestamp": now
    })
    
    return {"message": "Workflow moved to review", "new_state": "in_review"}

@app.post("/api/workflows/{workflow_id}/lifecycle/approve")
async def approve_workflow(workflow_id: str, data: LifecycleTransition):
    """Approve workflow and publish it"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    current_state = workflow.get("lifecycle_state", workflow.get("status", "draft"))
    if current_state not in ["in_review", "draft"]:
        raise HTTPException(status_code=400, detail=f"Can only approve from in_review or draft state. Current state: {current_state}")
    
    now = datetime.utcnow().isoformat()
    
    lifecycle_history = workflow.get("lifecycle_history", [])
    lifecycle_history.append({
        "from_state": current_state,
        "to_state": "published",
        "changed_by": data.changed_by,
        "comment": data.comment or "Workflow approved for publishing",
        "timestamp": now
    })
    
    workflows_collection.update_one(
        {"id": workflow_id},
        {
            "$set": {
                "lifecycle_state": "published",
                "status": "published",  # Keep legacy status in sync
                "lifecycle_history": lifecycle_history,
                "published_at": now,
                "published_by": data.changed_by,
                "updated_at": now
            }
        }
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "lifecycle_transition",
        "user": data.changed_by,
        "details": {"from": current_state, "to": "published", "comment": data.comment},
        "timestamp": now
    })
    
    # Create notification for workflow owner
    notifications_collection.insert_one({
        "id": str(uuid.uuid4()),
        "type": "workflow_published",
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "title": f"Workflow Published: {workflow.get('name')}",
        "message": "Your workflow has been approved and published",
        "read": False,
        "created_at": now
    })
    
    return {"message": "Workflow approved and published", "new_state": "published"}

@app.post("/api/workflows/{workflow_id}/lifecycle/reject")
async def reject_workflow(workflow_id: str, data: LifecycleTransition):
    """Reject workflow and return to draft"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    current_state = workflow.get("lifecycle_state", workflow.get("status", "draft"))
    if current_state != "in_review":
        raise HTTPException(status_code=400, detail=f"Can only reject from in_review state. Current state: {current_state}")
    
    now = datetime.utcnow().isoformat()
    
    lifecycle_history = workflow.get("lifecycle_history", [])
    lifecycle_history.append({
        "from_state": current_state,
        "to_state": "draft",
        "changed_by": data.changed_by,
        "comment": data.comment or "Changes requested",
        "timestamp": now
    })
    
    workflows_collection.update_one(
        {"id": workflow_id},
        {
            "$set": {
                "lifecycle_state": "draft",
                "status": "draft",  # Keep legacy status in sync
                "lifecycle_history": lifecycle_history,
                "updated_at": now
            }
        }
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "lifecycle_transition",
        "user": data.changed_by,
        "details": {"from": current_state, "to": "draft", "comment": data.comment},
        "timestamp": now
    })
    
    return {"message": "Workflow rejected, returned to draft", "new_state": "draft"}

@app.post("/api/workflows/{workflow_id}/lifecycle/pause")
async def pause_workflow(workflow_id: str, data: LifecycleTransition):
    """Pause a published workflow"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    current_state = workflow.get("lifecycle_state", workflow.get("status", "draft"))
    if current_state != "published":
        raise HTTPException(status_code=400, detail=f"Can only pause published workflows. Current state: {current_state}")
    
    now = datetime.utcnow().isoformat()
    
    lifecycle_history = workflow.get("lifecycle_history", [])
    lifecycle_history.append({
        "from_state": current_state,
        "to_state": "paused",
        "changed_by": data.changed_by,
        "comment": data.comment or "Workflow paused",
        "timestamp": now
    })
    
    workflows_collection.update_one(
        {"id": workflow_id},
        {
            "$set": {
                "lifecycle_state": "paused",
                "status": "paused",  # Keep legacy status in sync
                "lifecycle_history": lifecycle_history,
                "paused_at": now,
                "updated_at": now
            }
        }
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "lifecycle_transition",
        "user": data.changed_by,
        "details": {"from": current_state, "to": "paused", "comment": data.comment},
        "timestamp": now
    })
    
    return {"message": "Workflow paused", "new_state": "paused"}

@app.post("/api/workflows/{workflow_id}/lifecycle/resume")
async def resume_workflow(workflow_id: str, data: LifecycleTransition):
    """Resume a paused workflow"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    current_state = workflow.get("lifecycle_state", workflow.get("status", "draft"))
    if current_state != "paused":
        raise HTTPException(status_code=400, detail=f"Can only resume paused workflows. Current state: {current_state}")
    
    now = datetime.utcnow().isoformat()
    
    lifecycle_history = workflow.get("lifecycle_history", [])
    lifecycle_history.append({
        "from_state": current_state,
        "to_state": "published",
        "changed_by": data.changed_by,
        "comment": data.comment or "Workflow resumed",
        "timestamp": now
    })
    
    workflows_collection.update_one(
        {"id": workflow_id},
        {
            "$set": {
                "lifecycle_state": "published",
                "status": "published",  # Keep legacy status in sync
                "lifecycle_history": lifecycle_history,
                "resumed_at": now,
                "updated_at": now
            }
        }
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "lifecycle_transition",
        "user": data.changed_by,
        "details": {"from": current_state, "to": "published", "comment": data.comment},
        "timestamp": now
    })
    
    return {"message": "Workflow resumed", "new_state": "published"}

@app.post("/api/workflows/{workflow_id}/lifecycle/archive")
async def archive_workflow(workflow_id: str, data: LifecycleTransition):
    """Archive a workflow"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    current_state = workflow.get("lifecycle_state", workflow.get("status", "draft"))
    
    now = datetime.utcnow().isoformat()
    
    lifecycle_history = workflow.get("lifecycle_history", [])
    lifecycle_history.append({
        "from_state": current_state,
        "to_state": "archived",
        "changed_by": data.changed_by,
        "comment": data.comment or "Workflow archived",
        "timestamp": now
    })
    
    workflows_collection.update_one(
        {"id": workflow_id},
        {
            "$set": {
                "lifecycle_state": "archived",
                "status": "archived",  # Keep legacy status in sync
                "lifecycle_history": lifecycle_history,
                "archived_at": now,
                "archived_by": data.changed_by,
                "updated_at": now
            }
        }
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "lifecycle_transition",
        "user": data.changed_by,
        "details": {"from": current_state, "to": "archived", "comment": data.comment},
        "timestamp": now
    })
    
    return {"message": "Workflow archived", "new_state": "archived"}

@app.get("/api/workflows/{workflow_id}/lifecycle/history")
async def get_lifecycle_history(workflow_id: str):
    """Get lifecycle history for a workflow"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    lifecycle_history = workflow.get("lifecycle_history", [])
    current_state = workflow.get("lifecycle_state", workflow.get("status", "draft"))
    
    return {
        "workflow_id": workflow_id,
        "current_state": current_state,
        "history": lifecycle_history,
        "history_count": len(lifecycle_history)
    }

# ========== VERSION MANAGEMENT & COMPARISON ENDPOINTS ==========

@app.get("/api/workflows/{workflow_id}/versions")
async def get_workflow_versions(workflow_id: str):
    """Get all versions of a workflow"""
    # Find all workflows with the same base ID or name pattern
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Get all versions (stored as version_history in the workflow document)
    version_history = workflow.get("version_history", [])
    
    # If no version_history, create one from current state
    if not version_history:
        version_history = [{
            "version": workflow.get("version", 1),
            "created_at": workflow.get("updated_at", workflow.get("created_at")),
            "created_by": workflow.get("updated_by", "system"),
            "change_notes": "Initial version",
            "snapshot": {
                "nodes": workflow.get("nodes", []),
                "edges": workflow.get("edges", []),
                "name": workflow.get("name"),
                "description": workflow.get("description"),
                "tags": workflow.get("tags", [])
            }
        }]
    
    return {
        "workflow_id": workflow_id,
        "current_version": workflow.get("version", 1),
        "versions": version_history,
        "version_count": len(version_history)
    }

@app.get("/api/workflows/{workflow_id}/versions/{version}")
async def get_workflow_version(workflow_id: str, version: int):
    """Get a specific version of a workflow"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    version_history = workflow.get("version_history", [])
    
    # Find the requested version
    version_data = next((v for v in version_history if v.get("version") == version), None)
    
    if not version_data:
        raise HTTPException(status_code=404, detail=f"Version {version} not found")
    
    return {
        "workflow_id": workflow_id,
        "version": version,
        "version_data": version_data
    }

@app.post("/api/workflows/{workflow_id}/versions/compare")
async def compare_workflow_versions(workflow_id: str, data: Dict[str, Any]):
    """Compare two versions of a workflow"""
    version_a = data.get("version_a", 1)
    version_b = data.get("version_b", 2)
    
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    version_history = workflow.get("version_history", [])
    
    # Get version snapshots
    v_a_data = next((v for v in version_history if v.get("version") == version_a), None)
    v_b_data = next((v for v in version_history if v.get("version") == version_b), None)
    
    if not v_a_data or not v_b_data:
        raise HTTPException(status_code=404, detail="One or both versions not found")
    
    snapshot_a = v_a_data.get("snapshot", {})
    snapshot_b = v_b_data.get("snapshot", {})
    
    # Calculate diff
    diff = _calculate_workflow_diff(snapshot_a, snapshot_b)
    
    return {
        "workflow_id": workflow_id,
        "version_a": version_a,
        "version_b": version_b,
        "diff": diff,
        "version_a_data": v_a_data,
        "version_b_data": v_b_data
    }

def _calculate_workflow_diff(snapshot_a: Dict[str, Any], snapshot_b: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate differences between two workflow snapshots"""
    diff = {
        "metadata_changes": {},
        "nodes_added": [],
        "nodes_removed": [],
        "nodes_modified": [],
        "edges_added": [],
        "edges_removed": []
    }
    
    # Metadata changes
    for key in ["name", "description", "tags"]:
        val_a = snapshot_a.get(key)
        val_b = snapshot_b.get(key)
        if val_a != val_b:
            diff["metadata_changes"][key] = {"from": val_a, "to": val_b}
    
    # Node changes
    nodes_a = {n.get("id"): n for n in snapshot_a.get("nodes", [])}
    nodes_b = {n.get("id"): n for n in snapshot_b.get("nodes", [])}
    
    # Nodes added
    for node_id, node in nodes_b.items():
        if node_id not in nodes_a:
            diff["nodes_added"].append(node)
    
    # Nodes removed
    for node_id, node in nodes_a.items():
        if node_id not in nodes_b:
            diff["nodes_removed"].append(node)
    
    # Nodes modified
    for node_id in set(nodes_a.keys()) & set(nodes_b.keys()):
        node_a = nodes_a[node_id]
        node_b = nodes_b[node_id]
        if node_a != node_b:
            diff["nodes_modified"].append({
                "id": node_id,
                "before": node_a,
                "after": node_b
            })
    
    # Edge changes
    edges_a = {e.get("id"): e for e in snapshot_a.get("edges", [])}
    edges_b = {e.get("id"): e for e in snapshot_b.get("edges", [])}
    
    # Edges added
    for edge_id, edge in edges_b.items():
        if edge_id not in edges_a:
            diff["edges_added"].append(edge)
    
    # Edges removed
    for edge_id, edge in edges_a.items():
        if edge_id not in edges_b:
            diff["edges_removed"].append(edge)
    
    return diff

@app.post("/api/workflows/{workflow_id}/versions/{version}/rollback")
async def rollback_to_version(workflow_id: str, version: int, data: LifecycleTransition):
    """Rollback workflow to a previous version"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check if workflow is published - if so, need to create new version
    current_state = workflow.get("lifecycle_state", workflow.get("status", "draft"))
    if current_state == "published":
        raise HTTPException(
            status_code=400,
            detail="Cannot rollback published workflow directly. Please pause it first or create a new version."
        )
    
    version_history = workflow.get("version_history", [])
    target_version = next((v for v in version_history if v.get("version") == version), None)
    
    if not target_version:
        raise HTTPException(status_code=404, detail=f"Version {version} not found")
    
    snapshot = target_version.get("snapshot", {})
    now = datetime.utcnow().isoformat()
    current_version = workflow.get("version", 1)
    
    # Create new version entry for the rollback
    new_version = current_version + 1
    version_history.append({
        "version": new_version,
        "created_at": now,
        "created_by": data.changed_by,
        "change_notes": data.comment or f"Rolled back to version {version}",
        "is_rollback": True,
        "rolled_back_from_version": current_version,
        "rolled_back_to_version": version,
        "snapshot": {
            "nodes": workflow.get("nodes", []),
            "edges": workflow.get("edges", []),
            "name": workflow.get("name"),
            "description": workflow.get("description"),
            "tags": workflow.get("tags", [])
        }
    })
    
    # Apply the snapshot
    workflows_collection.update_one(
        {"id": workflow_id},
        {
            "$set": {
                "nodes": snapshot.get("nodes", []),
                "edges": snapshot.get("edges", []),
                "name": snapshot.get("name", workflow.get("name")),
                "description": snapshot.get("description", workflow.get("description")),
                "tags": snapshot.get("tags", []),
                "version": new_version,
                "version_history": version_history,
                "updated_at": now,
                "updated_by": data.changed_by
            }
        }
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "version_rollback",
        "user": data.changed_by,
        "details": {
            "from_version": current_version,
            "to_version": version,
            "new_version": new_version,
            "comment": data.comment
        },
        "timestamp": now
    })
    
    return {
        "message": f"Workflow rolled back to version {version}",
        "previous_version": current_version,
        "rolled_back_to": version,
        "new_version": new_version
    }

# ========== EDIT PROTECTION & GUARDRAILS ==========

@app.post("/api/workflows/{workflow_id}/create-draft-version")
async def create_draft_version(workflow_id: str, data: LifecycleTransition):
    """Create a new draft version from a published workflow for editing"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    current_state = workflow.get("lifecycle_state", workflow.get("status", "draft"))
    if current_state != "published":
        raise HTTPException(status_code=400, detail="Can only create draft versions from published workflows")
    
    now = datetime.utcnow().isoformat()
    current_version = workflow.get("version", 1)
    new_version = current_version + 1
    
    # Save current state to version history
    version_history = workflow.get("version_history", [])
    version_history.append({
        "version": current_version,
        "created_at": workflow.get("updated_at", now),
        "created_by": workflow.get("updated_by", "system"),
        "change_notes": f"Published version {current_version}",
        "snapshot": {
            "nodes": workflow.get("nodes", []),
            "edges": workflow.get("edges", []),
            "name": workflow.get("name"),
            "description": workflow.get("description"),
            "tags": workflow.get("tags", [])
        }
    })
    
    # Update to draft state with new version
    workflows_collection.update_one(
        {"id": workflow_id},
        {
            "$set": {
                "lifecycle_state": "draft",
                "status": "draft",
                "version": new_version,
                "version_history": version_history,
                "draft_from_published": True,
                "previous_published_version": current_version,
                "updated_at": now,
                "updated_by": data.changed_by
            }
        }
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "create_draft_version",
        "user": data.changed_by,
        "details": {
            "from_version": current_version,
            "new_version": new_version,
            "comment": data.comment
        },
        "timestamp": now
    })
    
    return {
        "message": "Draft version created for editing",
        "previous_version": current_version,
        "new_version": new_version,
        "lifecycle_state": "draft"
    }

@app.get("/api/workflows/{workflow_id}/can-edit")
async def check_can_edit(workflow_id: str):
    """Check if workflow can be edited directly or needs new version"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    current_state = workflow.get("lifecycle_state", workflow.get("status", "draft"))
    can_edit_directly = current_state in ["draft", "in_review"]
    needs_new_version = current_state in ["published", "paused"]
    
    # Check for active instances
    active_instances = workflow_instances_collection.count_documents({
        "workflow_id": workflow_id,
        "status": {"$in": ["running", "waiting", "paused"]}
    })
    
    return {
        "workflow_id": workflow_id,
        "current_state": current_state,
        "can_edit_directly": can_edit_directly,
        "needs_new_version": needs_new_version,
        "active_instances": active_instances,
        "warning": "Editing this workflow will create a new draft version. Active instances will continue on the current version." if needs_new_version else None
    }



# ========== WORKFLOW VALIDATION ENDPOINT ==========

def _validate_workflow_document(workflow: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Server-side validation for a workflow definition.

    Returns a list of issues with shape:
    {"type": "error"|"warning", "message": str, "nodeId": Optional[str]}
    """
    issues: List[Dict[str, Any]] = []

    nodes: List[Dict[str, Any]] = workflow.get("nodes") or []
    edges: List[Dict[str, Any]] = workflow.get("edges") or []

    if not nodes:
        issues.append({
            "type": "error",
            "message": "Workflow has no nodes configured.",
        })
        return issues

    # Basic node/index maps
    node_by_id: Dict[str, Dict[str, Any]] = {}
    for node in nodes:
        node_id = node.get("id")
        if not node_id:
            issues.append({
                "type": "error",
                "message": "A node is missing an 'id' property.",
            })
            continue
        if node_id in node_by_id:
            issues.append({
                "type": "error",
                "message": f"Duplicate node id detected: '{node_id}'. Node IDs must be unique.",
                "nodeId": node_id,
            })
        else:
            node_by_id[node_id] = node

    # Build edge adjacency maps and validate references
    edges_by_source: Dict[str, List[Dict[str, Any]]] = {}
    edges_by_target: Dict[str, List[Dict[str, Any]]] = {}

    for idx, edge in enumerate(edges):
        src = edge.get("source")
        tgt = edge.get("target")

        if not src or src not in node_by_id:
            issues.append({
                "type": "error",
                "message": f"Edge #{idx + 1} references a missing source node '{src}'.",
                "nodeId": src,
            })
        if not tgt or tgt not in node_by_id:
            issues.append({
                "type": "error",
                "message": f"Edge #{idx + 1} references a missing target node '{tgt}'.",
                "nodeId": tgt,
            })

        if src:
            edges_by_source.setdefault(src, []).append(edge)
        if tgt:
            edges_by_target.setdefault(tgt, []).append(edge)

    # High-level structural checks (mirrors + extends frontend checks)
    start_nodes = [n for n in nodes if n.get("type") == "start"]
    end_nodes = [n for n in nodes if n.get("type") == "end"]

    if not start_nodes:
        issues.append({
            "type": "error",
            "message": "No Start node found. Add a Start node to begin the workflow.",
        })
    if len(start_nodes) > 1:
        issues.append({
            "type": "warning",
            "message": f"Multiple Start nodes detected ({len(start_nodes)}). Ensure this is intentional.",
        })
    if not end_nodes:
        issues.append({
            "type": "warning",
            "message": "No End node found. Add at least one End node to properly terminate the workflow.",
        })

    # Nodes with no outgoing edges (excluding End nodes)
    for node in nodes:
        node_id = node.get("id")
        if not node_id:
            continue
        if node.get("type") == "end":
            continue
        outgoing = edges_by_source.get(node_id, [])
        if not outgoing:
            issues.append({
                "type": "warning",
                "message": f"Node '{node.get('data', {}).get('label') or node_id}' has no outgoing connections.",
                "nodeId": node_id,
            })

    # Reachability from first Start node
    if start_nodes:
        from collections import deque

        visited = set()
        queue: deque[str] = deque()

        start_id = start_nodes[0].get("id")
        if start_id:
            visited.add(start_id)
            queue.append(start_id)

        while queue:
            current = queue.popleft()
            for edge in edges_by_source.get(current, []):
                target_id = edge.get("target")
                if target_id and target_id not in visited:
                    visited.add(target_id)
                    queue.append(target_id)

        for node in nodes:
            node_id = node.get("id")
            if node_id and node_id not in visited:
                issues.append({
                    "type": "warning",
                    "message": f"Node '{node.get('data', {}).get('label') or node_id}' is unreachable from the Start node.",
                    "nodeId": node_id,
                })

        # Ensure at least one End node is reachable from Start
        reachable_end_ids = {n.get("id") for n in end_nodes if n.get("id") in visited}
        if end_nodes and not reachable_end_ids:
            issues.append({
                "type": "error",
                "message": "No End node is reachable from the Start node. Check your connections.",
            })

    # Node-type specific validations
    def _add_issue(node: Dict[str, Any], level: str, message: str) -> None:
        issues.append({
            "type": level,
            "message": message,
            "nodeId": node.get("id"),
        })

    for node in nodes:
        node_id = node.get("id")
        node_type = node.get("type")
        data = node.get("data", {})
        label = data.get("label") or node_id

        if node_type == "decision":
            condition = data.get("condition")
            if not condition or not str(condition).strip():
                _add_issue(node, "warning", f"Decision node '{label}' has no condition configured.")

            outgoing = edges_by_source.get(node_id or "", [])
            if not outgoing:
                _add_issue(node, "error", f"Decision node '{label}' has no outgoing branches.")
            else:
                # Check for both positive and negative branches
                positive_keywords = ["yes", "true", "approve", "approved", "shortlist", "accept"]
                negative_keywords = ["no", "false", "reject", "rejected", "decline", "fail"]

                has_positive = False
                has_negative = False

                for edge in outgoing:
                    handle = edge.get("sourceHandle") or edge.get("source_handle") or ""
                    label_text = (edge.get("label") or "").lower()

                    if handle.lower() in ["yes", "true"] or any(k in label_text for k in positive_keywords):
                        has_positive = True
                    if handle.lower() in ["no", "false"] or any(k in label_text for k in negative_keywords):
                        has_negative = True

                if not has_positive or not has_negative:
                    _add_issue(
                        node,
                        "warning",
                        f"Decision node '{label}' does not appear to have both Yes/No branches configured.",
                    )

        elif node_type == "form":
            form_id = data.get("formId")
            if not form_id:
                _add_issue(node, "error", f"Form node '{label}' is missing a linked form.")
            else:
                # Cross-check with forms collection to avoid broken links
                if not forms_collection.find_one({"id": form_id}):
                    _add_issue(
                        node,
                        "error",
                        f"Form node '{label}' references a form that does not exist (id='{form_id}').",
                    )

        elif node_type == "approval":
            approvers = data.get("approvers") or []
            if not approvers:
                _add_issue(node, "warning", f"Approval node '{label}' has no approvers configured.")

        elif node_type == "task":
            if not label:
                _add_issue(node, "warning", "Task node is missing a title/label.")
            sla_hours = data.get("dueInHours")
            try:
                if sla_hours is not None and float(sla_hours) <= 0:
                    _add_issue(node, "warning", f"Task node '{label}' has a non-positive SLA/dueInHours value.")
            except (TypeError, ValueError):
                _add_issue(node, "warning", f"Task node '{label}' has an invalid SLA/dueInHours value.")

        elif node_type == "action":
            action_type = data.get("actionType", "http")
            if action_type in {"http", "webhook"}:
                url = data.get("url")
                if not url or not str(url).strip():
                    _add_issue(node, "warning", f"Action node '{label}' has no URL configured.")
            elif action_type == "script":
                script = data.get("script")
                if not script:
                    _add_issue(node, "warning", f"Action node '{label}' has no script configured.")

        elif node_type == "parallel":
            outgoing = edges_by_source.get(node_id or "", [])
            if len(outgoing) < 2:
                _add_issue(
                    node,
                    "warning",
                    f"Parallel node '{label}' should typically have 2 or more outgoing branches.",
                )

        elif node_type == "merge":
            incoming = edges_by_target.get(node_id or "", [])
            if len(incoming) < 2:
                _add_issue(
                    node,
                    "warning",
                    f"Merge node '{label}' should typically have 2 or more incoming branches.",
                )

    return issues


@app.get("/api/workflows/{workflow_id}/validate")
async def validate_workflow(workflow_id: str):
    """Validate a stored workflow definition on the backend.

    This complements the client-side validation by checking:
    - Graph integrity (missing nodes, unreachable nodes, missing Start/End)
    - Node wiring (no outgoing edges, decision branches)
    - Cross-collection references (e.g., Form nodes referencing existing forms)
    """
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    issues = _validate_workflow_document(workflow)
    return {"workflow_id": workflow_id, "issues": issues, "issue_count": len(issues)}


@app.get("/api/workflows/{workflow_id}/health")
async def get_workflow_health(workflow_id: str):
    """Get comprehensive health score and metrics for a workflow"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Run validation
    issues = _validate_workflow_document(workflow)
    error_count = len([i for i in issues if i.get("type") == "error"])
    warning_count = len([i for i in issues if i.get("type") == "warning"])
    
    # Get execution statistics
    total_instances = workflow_instances_collection.count_documents({"workflow_id": workflow_id})
    completed_instances = workflow_instances_collection.count_documents({
        "workflow_id": workflow_id,
        "status": "completed"
    })
    failed_instances = workflow_instances_collection.count_documents({
        "workflow_id": workflow_id,
        "status": "failed"
    })
    
    # Calculate success rate
    success_rate = (completed_instances / total_instances * 100) if total_instances > 0 else 0
    
    # Calculate health score (0-100)
    health_score = 100
    
    # Deduct points for validation issues
    health_score -= (error_count * 15)  # Each error: -15 points
    health_score -= (warning_count * 5)  # Each warning: -5 points
    
    # Deduct points for low success rate
    if total_instances >= 5:  # Only consider if enough executions
        if success_rate < 50:
            health_score -= 30
        elif success_rate < 70:
            health_score -= 20
        elif success_rate < 90:
            health_score -= 10
    
    # Ensure score is between 0-100
    health_score = max(0, min(100, health_score))
    
    # Determine health status
    if health_score >= 90:
        health_status = "excellent"
        health_color = "green"
    elif health_score >= 70:
        health_status = "good"
        health_color = "blue"
    elif health_score >= 50:
        health_status = "fair"
        health_color = "yellow"
    elif health_score >= 30:
        health_status = "poor"
        health_color = "orange"
    else:
        health_status = "critical"
        health_color = "red"
    
    # Generate recommendations
    recommendations = []
    if error_count > 0:
        recommendations.append({
            "priority": "high",
            "message": f"Fix {error_count} critical error(s) in workflow configuration",
            "action": "validate"
        })
    if warning_count > 3:
        recommendations.append({
            "priority": "medium",
            "message": f"Address {warning_count} warning(s) to improve workflow quality",
            "action": "validate"
        })
    if total_instances >= 5 and success_rate < 70:
        recommendations.append({
            "priority": "high",
            "message": f"Success rate is low ({success_rate:.1f}%). Review failed executions",
            "action": "review_logs"
        })
    if total_instances == 0:
        recommendations.append({
            "priority": "low",
            "message": "Workflow has not been executed yet. Test it to ensure it works correctly",
            "action": "test"
        })
    
    return {
        "workflow_id": workflow_id,
        "workflow_name": workflow.get("name", "Untitled"),
        "health_score": round(health_score, 1),
        "health_status": health_status,
        "health_color": health_color,
        "metrics": {
            "validation_errors": error_count,
            "validation_warnings": warning_count,
            "total_executions": total_instances,
            "completed_executions": completed_instances,
            "failed_executions": failed_instances,
            "success_rate": round(success_rate, 1)
        },
        "recommendations": recommendations,
        "last_updated": workflow.get("updated_at")
    }


# ========== WORKFLOW TEMPLATES ENDPOINTS ==========

@app.get("/api/templates")
async def get_workflow_templates():
    """Get all available workflow templates"""
    import glob
    template_files = glob.glob("/app/templates/*.json")
    
    templates = []
    for template_file in template_files:
        if "index.json" in template_file:
            # Load index file
            try:
                with open(template_file, 'r') as f:
                    index_data = json.load(f)
                    templates = index_data.get("templates", [])
            except Exception as e:
                print(f"Error loading template index: {e}")
        
    # If no index, scan files directly
    if not templates:
        for template_file in template_files:
            if "index.json" in template_file:
                continue
            try:
                with open(template_file, 'r') as f:
                    template_data = json.load(f)
                    templates.append({
                        "id": template_data.get("id", os.path.basename(template_file).replace(".json", "")),
                        "name": template_data.get("name", "Untitled Template"),
                        "description": template_data.get("description", ""),
                        "category": template_data.get("category", "general"),
                        "icon": template_data.get("icon", "Workflow"),
                        "difficulty": template_data.get("difficulty", "intermediate"),
                        "estimated_time": template_data.get("estimated_time", "10-15 mins")
                    })
            except Exception as e:
                print(f"Error loading template {template_file}: {e}")
    
    return {"templates": templates, "count": len(templates)}


@app.get("/api/templates/{template_id}")
async def get_workflow_template(template_id: str):
    """Get a specific workflow template"""
    template_file = f"/app/templates/{template_id}.json"
    
    if not os.path.exists(template_file):
        raise HTTPException(status_code=404, detail="Template not found")
    
    try:
        with open(template_file, 'r') as f:
            template_data = json.load(f)
            return template_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading template: {str(e)}")


@app.post("/api/templates/{template_id}/create-workflow")
async def create_workflow_from_template(template_id: str, data: Dict[str, Any]):
    """Create a new workflow from a template"""
    # Load template
    template_file = f"/app/templates/{template_id}.json"
    
    if not os.path.exists(template_file):
        raise HTTPException(status_code=404, detail="Template not found")
    
    try:
        with open(template_file, 'r') as f:
            template_data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading template: {str(e)}")
    
    # Create new workflow from template
    workflow_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    # Allow user to override name
    workflow_name = data.get("name", template_data.get("name", "Untitled Workflow"))
    
    workflow_dict = {
        "id": workflow_id,
        "name": workflow_name,
        "description": template_data.get("description", ""),
        "nodes": template_data.get("nodes", []),
        "edges": template_data.get("edges", []),
        "status": "draft",
        "version": 1,
        "created_at": now,
        "updated_at": now,
        "tags": template_data.get("tags", []) + ["from-template"],
        "template_id": template_id,
        "template_name": template_data.get("name")
    }
    
    workflows_collection.insert_one(workflow_dict)
    
    # Log audit
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "created_from_template",
        "details": {"template_id": template_id, "template_name": template_data.get("name")},
        "timestamp": now
    })
    
    return {
        "message": "Workflow created successfully from template",
        "id": workflow_id,
        "workflow": workflow_dict
    }


# Form Endpoints
@app.get("/api/forms")
async def get_forms():
    forms = list(forms_collection.find({}, {"_id": 0}))
    return {"forms": forms, "count": len(forms)}

@app.get("/api/forms/{form_id}")
async def get_form(form_id: str):
    form = forms_collection.find_one({"id": form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

# Ensure indexes for auth & RBAC related collections and seed demo users
users_collection = db['users']
roles_collection = db['roles']
users_collection.create_index("email", unique=True)
roles_collection.create_index("name", unique=True)

AUTO_USERS = [
    {
        "email": "admin@example.com",
        "name": "Admin User",
        "role": "admin",
        "password": "admin123",
    },
    {
        "email": "builder@example.com",
        "name": "Builder User",
        "role": "builder",
        "password": "builder123",
    },
    {
        "email": "approver@example.com",
        "name": "Approver User",
        "role": "approver",
        "password": "approver123",
    },
]

for u in AUTO_USERS:
    existing = users_collection.find_one({"email": u["email"]})
    if not existing:
        users_collection.insert_one(
            {
                "id": str(uuid.uuid4()),
                "email": u["email"],
                "name": u["name"],
                "role": u["role"],
                "password_hash": get_password_hash(u["password"]),
                "workload": 0,
                "created_at": datetime.utcnow().isoformat(),
            }
        )

@app.post("/api/forms")
async def create_form(form: Form):
    form_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    form_dict = form.dict()
    form_dict["id"] = form_id
    form_dict["created_at"] = now
    form_dict["updated_at"] = now
    
    forms_collection.insert_one(form_dict)
    return {"message": "Form created successfully", "id": form_id}

@app.put("/api/forms/{form_id}")
async def update_form(form_id: str, form: Form):
    existing = forms_collection.find_one({"id": form_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Form not found")
    
    now = datetime.utcnow().isoformat()
    form_dict = form.dict()
    form_dict["id"] = form_id
    form_dict["created_at"] = existing.get("created_at")
    form_dict["updated_at"] = now
    
    forms_collection.replace_one({"id": form_id}, form_dict)
    return {"message": "Form updated successfully"}

@app.delete("/api/forms/{form_id}")
async def delete_form(form_id: str):
    result = forms_collection.delete_one({"id": form_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Form not found")
    
    return {"message": "Form deleted successfully"}

# Task Endpoints
@app.get("/api/tasks")
async def get_tasks(assigned_to: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if assigned_to:
        query["assigned_to"] = assigned_to
    if status:
        query["status"] = status
    
    tasks = list(tasks_collection.find(query, {"_id": 0}))
    return {"tasks": tasks, "count": len(tasks)}

@app.post("/api/tasks")
async def create_task(task: Task):
    task_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    task_dict = task.dict()
    task_dict["id"] = task_id
    task_dict["created_at"] = now
    task_dict["updated_at"] = now
    
    tasks_collection.insert_one(task_dict)
    return {"message": "Task created successfully", "id": task_id}

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, task: Task):
    existing = tasks_collection.find_one({"id": task_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    
    now = datetime.utcnow().isoformat()
    task_dict = task.dict()
    task_dict["id"] = task_id
    task_dict["created_at"] = existing.get("created_at")
    task_dict["updated_at"] = now
    
    tasks_collection.replace_one({"id": task_id}, task_dict)
    return {"message": "Task updated successfully"}

# ========== PHASE 5: TASK MANAGEMENT ENDPOINTS ==========

# User/role registry for assignment strategies
users_collection = db['users']
roles_collection = db['roles']

# Initialize sample users and roles if empty
def init_sample_data():
    # Sample users for assignment
    if users_collection.count_documents({}) == 0:
        sample_users = [
            {"id": str(uuid.uuid4()), "email": "alice@example.com", "name": "Alice Smith", "role": "manager", "workload": 2},
            {"id": str(uuid.uuid4()), "email": "bob@example.com", "name": "Bob Johnson", "role": "developer", "workload": 5},
            {"id": str(uuid.uuid4()), "email": "carol@example.com", "name": "Carol Williams", "role": "developer", "workload": 3},
            {"id": str(uuid.uuid4()), "email": "david@example.com", "name": "David Brown", "role": "reviewer", "workload": 1},
            {"id": str(uuid.uuid4()), "email": "eve@example.com", "name": "Eve Davis", "role": "manager", "workload": 4},
        ]
        users_collection.insert_many(sample_users)
    
    if roles_collection.count_documents({}) == 0:
        sample_roles = [
            {"id": str(uuid.uuid4()), "name": "manager", "members": ["alice@example.com", "eve@example.com"]},
            {"id": str(uuid.uuid4()), "name": "developer", "members": ["bob@example.com", "carol@example.com"]},
            {"id": str(uuid.uuid4()), "name": "reviewer", "members": ["david@example.com"]},
        ]
        roles_collection.insert_many(sample_roles)

init_sample_data()

# Round-robin counter for task assignment
round_robin_counter = {}

@app.get("/api/users")
async def get_users(role: Optional[str] = None):
    """Get all users, optionally filtered by role"""
    query = {}
    if role:
        query["role"] = role
    users = list(users_collection.find(query, {"_id": 0}))
    return {"users": users, "count": len(users)}

@app.get("/api/roles")
async def get_roles():
    """Get all roles"""
    roles = list(roles_collection.find({}, {"_id": 0}))
    return {"roles": roles, "count": len(roles)}

@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str):
    """Get single task by ID"""
    task = tasks_collection.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/api/tasks/assign")
async def assign_task_with_strategy(data: Dict[str, Any]):
    """Assign task using a specific assignment strategy"""
    task_id = data.get("task_id")
    strategy = data.get("strategy", "direct")  # direct, role, round_robin, load_balanced
    target = data.get("target")  # email for direct, role name for role-based
    
    task = tasks_collection.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    assignee = None
    
    if strategy == "direct":
        # Direct assignment to specific user
        assignee = target
    
    elif strategy == "role":
        # Get first available user in role
        role = roles_collection.find_one({"name": target})
        if role and role.get("members"):
            assignee = role["members"][0]
    
    elif strategy == "round_robin":
        # Round-robin within role
        role = roles_collection.find_one({"name": target})
        if role and role.get("members"):
            members = role["members"]
            counter_key = f"rr_{target}"
            current_idx = round_robin_counter.get(counter_key, 0)
            assignee = members[current_idx % len(members)]
            round_robin_counter[counter_key] = current_idx + 1
    
    elif strategy == "load_balanced":
        # Assign to user with least workload in role
        role = roles_collection.find_one({"name": target})
        if role and role.get("members"):
            users = list(users_collection.find({"email": {"$in": role["members"]}}).sort("workload", 1))
            if users:
                assignee = users[0]["email"]
                # Increment workload
                users_collection.update_one({"email": assignee}, {"$inc": {"workload": 1}})
    
    if not assignee:
        raise HTTPException(status_code=400, detail="Could not determine assignee")
    
    now = datetime.utcnow().isoformat()
    tasks_collection.update_one(
        {"id": task_id},
        {"$set": {
            "assigned_to": assignee,
            "assignment_strategy": strategy,
            "assigned_at": now,
            "updated_at": now
        }}
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "task",
        "entity_id": task_id,
        "action": "assigned",
        "user": "system",
        "details": {"strategy": strategy, "assignee": assignee},
        "timestamp": now
    })
    
    return {"message": "Task assigned successfully", "assignee": assignee, "strategy": strategy}

@app.post("/api/tasks/{task_id}/reassign")
async def reassign_task(task_id: str, data: Dict[str, Any] = None):
    """Reassign task to a different user"""
    if data is None:
        data = {}
    new_assignee = data.get("new_assignee", "")
    if not new_assignee:
        raise HTTPException(status_code=400, detail="new_assignee is required")
    
    task = tasks_collection.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    old_assignee = task.get("assigned_to")
    now = datetime.utcnow().isoformat()
    
    tasks_collection.update_one(
        {"id": task_id},
        {"$set": {
            "assigned_to": new_assignee,
            "updated_at": now,
            "reassignment_history": task.get("reassignment_history", []) + [{
                "from": old_assignee,
                "to": new_assignee,
                "timestamp": now
            }]
        }}
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "task",
        "entity_id": task_id,
        "action": "reassigned",
        "user": "current_user",
        "details": {"from": old_assignee, "to": new_assignee},
        "timestamp": now
    })
    
    return {"message": "Task reassigned successfully"}

@app.post("/api/tasks/{task_id}/delegate")
async def delegate_task(task_id: str, data: Dict[str, Any] = None):
    """Delegate task to another user"""
    if data is None:
        data = {}
    delegate_to = data.get("delegate_to", "")
    if not delegate_to:
        raise HTTPException(status_code=400, detail="delegate_to is required")
    
    task = tasks_collection.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    original_assignee = task.get("assigned_to")
    now = datetime.utcnow().isoformat()
    
    tasks_collection.update_one(
        {"id": task_id},
        {"$set": {
            "delegated_to": delegate_to,
            "delegated_by": original_assignee,
            "delegation_date": now,
            "updated_at": now
        }}
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "task",
        "entity_id": task_id,
        "action": "delegated",
        "user": original_assignee,
        "details": {"delegated_to": delegate_to},
        "timestamp": now
    })
    
    return {"message": "Task delegated successfully"}

@app.post("/api/tasks/{task_id}/escalate")
async def escalate_task(task_id: str, data: Dict[str, Any] = None):
    """Escalate task to higher priority/manager"""
    if data is None:
        data = {}
    reason = data.get("reason", "")
    
    task = tasks_collection.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    now = datetime.utcnow().isoformat()
    new_priority = "urgent" if task.get("priority") == "high" else "high"
    
    tasks_collection.update_one(
        {"id": task_id},
        {"$set": {
            "priority": new_priority,
            "escalated": True,
            "escalation_reason": reason,
            "escalated_at": now,
            "updated_at": now
        }}
    )
    
    # Create notification for escalation
    notifications_collection.insert_one({
        "id": str(uuid.uuid4()),
        "type": "escalation",
        "entity_type": "task",
        "entity_id": task_id,
        "title": f"Task Escalated: {task.get('title')}",
        "message": reason or "Task has been escalated",
        "priority": "high",
        "read": False,
        "created_at": now
    })
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "task",
        "entity_id": task_id,
        "action": "escalated",
        "user": "current_user",
        "details": {"reason": reason, "new_priority": new_priority},
        "timestamp": now
    })
    
    return {"message": "Task escalated successfully"}

# Task Comments
@app.get("/api/tasks/{task_id}/comments")
async def get_task_comments(task_id: str):
    """Get comments for a task"""
    task = tasks_collection.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    comments = task.get("comments", [])
    return {"comments": comments}

@app.post("/api/tasks/{task_id}/comments")
async def add_task_comment(task_id: str, data: Dict[str, Any] = None):
    """Add a comment to a task"""
    if data is None:
        data = {}
    content = data.get("content", "")
    author = data.get("author", "current_user")
    
    if not content:
        raise HTTPException(status_code=400, detail="content is required")
    
    task = tasks_collection.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    now = datetime.utcnow().isoformat()
    comment = {
        "id": str(uuid.uuid4()),
        "content": content,
        "author": author,
        "created_at": now,
        "mentions": _extract_mentions(content)
    }
    
    tasks_collection.update_one(
        {"id": task_id},
        {"$push": {"comments": comment}}
    )
    
    # Create notifications for mentioned users
    for mention in comment["mentions"]:
        notifications_collection.insert_one({
            "id": str(uuid.uuid4()),
            "type": "mention",
            "entity_type": "task",
            "entity_id": task_id,
            "recipient": mention,
            "title": "You were mentioned in a comment",
            "message": f"{author} mentioned you in task: {task.get('title')}",
            "read": False,
            "created_at": now
        })
    
    return {"message": "Comment added successfully", "comment": comment}

def _extract_mentions(text: str) -> List[str]:
    """Extract @mentions from text"""
    import re
    mentions = re.findall(r'@(\w+)', text)
    return list(set(mentions))

# ==================== AUTH & RBAC ENDPOINTS ====================

@app.post("/api/auth/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Issue JWT access token for valid username/password.

    We treat `username` as the email field. This endpoint is used by the
    frontend login page and by the auto-login shortcuts.
    """
    user = get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    access_token = create_access_token(
        {
            "sub": user["id"],
            "email": user["email"],
            "role": user.get("role", "viewer"),
            "name": user.get("name"),
        }
    )

    user_payload = {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
        "role": user.get("role", "viewer"),
    }

    return {"access_token": access_token, "token_type": "bearer", "user": user_payload}


@app.get("/api/auth/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return {"user": current_user}

# SLA Tracking
@app.get("/api/tasks/sla/overdue")
async def get_overdue_tasks():
    """Get tasks that are past their due date"""
    now_iso = datetime.utcnow().isoformat()
    overdue_tasks = list(tasks_collection.find(
        {
            "due_date": {"$lt": now_iso},
            "status": {"$nin": ["completed", "cancelled"]}
        },
        {"_id": 0}
    ))
    return {"tasks": overdue_tasks, "count": len(overdue_tasks)}

@app.get("/api/tasks/sla/at-risk")
async def get_at_risk_tasks():
    """Get tasks due within 24 hours"""
    now = datetime.utcnow()
    tomorrow = (now + timedelta(hours=24)).isoformat()


# ==================== SAMPLE DATA GENERATOR ====================

@app.post("/api/admin/generate-sample-data")
async def generate_sample_data():
    """Generate comprehensive sample data across ALL modules for demo purposes.
    
    Generates sample data for:
    - Users & Roles
    - Forms (multiple types)
    - Workflows (with diverse node types)
    - Workflow Instances
    - Tasks & Approvals
    - Form Submissions
    - Notifications
    - Audit Logs
    - API Connectors
    """
    now = datetime.utcnow()
    now_iso = now.isoformat()

    # ============ USERS & ROLES ============
    extra_users = [
        {"email": "requester@example.com", "name": "Requester User", "role": "builder"},
        {"email": "analyst@example.com", "name": "Analytics User", "role": "approver"},
        {"email": "developer@example.com", "name": "Developer User", "role": "builder"},
        {"email": "manager@example.com", "name": "Manager User", "role": "approver"},
    ]
    for u in extra_users:
        if not users_collection.find_one({"email": u["email"]}):
            users_collection.insert_one({
                "id": str(uuid.uuid4()),
                "email": u["email"],
                "name": u["name"],
                "role": u["role"],
                "password_hash": get_password_hash("password123"),
                "workload": 0,
                "created_at": now_iso,
            })

    # Roles with comprehensive member lists
    base_roles = [
        {"name": "admin", "members": ["admin@example.com"]},
        {"name": "builder", "members": ["builder@example.com", "requester@example.com", "developer@example.com"]},
        {"name": "approver", "members": ["approver@example.com", "analyst@example.com", "manager@example.com"]},
        {"name": "finance", "members": ["analyst@example.com", "manager@example.com"]},
        {"name": "hr", "members": ["approver@example.com", "manager@example.com"]},
    ]
    for r in base_roles:
        existing = roles_collection.find_one({"name": r["name"]})
        if existing:
            merged = sorted(list(set(existing.get("members", []) + r["members"])))
            roles_collection.update_one({"name": r["name"]}, {"$set": {"members": merged}})
        else:
            roles_collection.insert_one({
                "id": str(uuid.uuid4()),
                "name": r["name"],
                "members": r["members"],
            })

    # ============ FORMS ============
    forms_to_create = []
    
    # Job Application Form
    hiring_form_id = str(uuid.uuid4())
    forms_to_create.append({
        "id": hiring_form_id,
        "name": "Job Application Form",
        "description": "Capture candidate details for recruiting workflow",
        "fields": [
            {"id": "full_name", "label": "Full Name", "type": "text", "required": True},
            {"id": "email", "label": "Email", "type": "email", "required": True},
            {"id": "phone", "label": "Phone Number", "type": "text", "required": False},
            {"id": "role", "label": "Role Applied For", "type": "text", "required": True},
            {"id": "experience", "label": "Years of Experience", "type": "number", "required": True},
            {"id": "resume", "label": "Resume URL", "type": "text", "required": False},
        ],
        "tags": ["recruiting", "hr", "demo"],
        "version": 1,
        "created_at": now_iso,
        "updated_at": now_iso,
    })

    # Expense Reimbursement Form
    expense_form_id = str(uuid.uuid4())
    forms_to_create.append({
        "id": expense_form_id,
        "name": "Expense Reimbursement Form",
        "description": "Submit expenses for approval",
        "fields": [
            {"id": "employee", "label": "Employee Name", "type": "text", "required": True},
            {"id": "amount", "label": "Amount ($)", "type": "number", "required": True},
            {"id": "category", "label": "Category", "type": "dropdown", "options": ["Travel", "Meals", "Office Supplies", "Software"], "required": True},
            {"id": "receipt", "label": "Receipt URL", "type": "text", "required": False},
            {"id": "description", "label": "Description", "type": "textarea", "required": True},
        ],
        "tags": ["finance", "expense", "demo"],
        "version": 1,
        "created_at": now_iso,
        "updated_at": now_iso,
    })

    # Purchase Request Form
    purchase_form_id = str(uuid.uuid4())
    forms_to_create.append({
        "id": purchase_form_id,
        "name": "Purchase Request Form",
        "description": "Request approval for purchases",
        "fields": [
            {"id": "requester", "label": "Requester Name", "type": "text", "required": True},
            {"id": "item", "label": "Item Description", "type": "text", "required": True},
            {"id": "vendor", "label": "Vendor", "type": "text", "required": True},
            {"id": "amount", "label": "Amount ($)", "type": "number", "required": True},
            {"id": "justification", "label": "Business Justification", "type": "textarea", "required": True},
        ],
        "tags": ["procurement", "finance", "demo"],
        "version": 1,
        "created_at": now_iso,
        "updated_at": now_iso,
    })

    # Feedback Form
    feedback_form_id = str(uuid.uuid4())
    forms_to_create.append({
        "id": feedback_form_id,
        "name": "Employee Feedback Form",
        "description": "Collect employee feedback",
        "fields": [
            {"id": "employee_name", "label": "Employee Name", "type": "text", "required": True},
            {"id": "department", "label": "Department", "type": "dropdown", "options": ["Engineering", "Sales", "Marketing", "HR", "Finance"], "required": True},
            {"id": "rating", "label": "Overall Satisfaction (1-5)", "type": "number", "required": True},
            {"id": "comments", "label": "Comments", "type": "textarea", "required": False},
        ],
        "tags": ["hr", "feedback", "demo"],
        "version": 1,
        "created_at": now_iso,
        "updated_at": now_iso,
    })

    # Only insert forms if they don't exist
    for form in forms_to_create:
        if not forms_collection.find_one({"name": form["name"]}):
            forms_collection.insert_one(form)

    # ============ WORKFLOWS ============
    workflows_to_create = []

    # Workflow 1: Recruiting Workflow (with Decision node)
    recruiting_wf_id = str(uuid.uuid4())
    workflows_to_create.append({
        "id": recruiting_wf_id,
        "name": "Employee Recruiting Workflow",
        "description": "Complete hiring process with screening, interview, and approval",
        "nodes": [
            {"id": "start-1", "type": "start", "position": {"x": 100, "y": 150}, "data": {"label": "Start", "type": "start"}},
            {"id": "form-1", "type": "form", "position": {"x": 250, "y": 150}, "data": {"label": "Job Application", "type": "form", "formId": hiring_form_id}},
            {"id": "task-1", "type": "task", "position": {"x": 400, "y": 150}, "data": {"label": "Resume Screening", "type": "task", "description": "HR screens application", "assignmentStrategy": "role", "assignmentRole": "hr", "priority": "high", "dueInHours": 48}},
            {"id": "decision-1", "type": "decision", "position": {"x": 550, "y": 150}, "data": {"label": "Qualified?", "type": "decision", "condition": "experience >= 2"}},
            {"id": "task-2", "type": "task", "position": {"x": 700, "y": 100}, "data": {"label": "Schedule Interview", "type": "task", "description": "Coordinate interview", "assignmentStrategy": "role", "assignmentRole": "hr", "priority": "medium", "dueInHours": 24}},
            {"id": "approval-1", "type": "approval", "position": {"x": 850, "y": 100}, "data": {"label": "Hiring Manager Approval", "type": "approval", "approvers": ["manager@example.com"], "approvalType": "single"}},
            {"id": "email-1", "type": "email", "position": {"x": 700, "y": 200}, "data": {"label": "Rejection Email", "type": "email", "description": "Send rejection notification"}},
            {"id": "end-1", "type": "end", "position": {"x": 1000, "y": 100}, "data": {"label": "Hired", "type": "end"}},
            {"id": "end-2", "type": "end", "position": {"x": 850, "y": 200}, "data": {"label": "Rejected", "type": "end"}},
        ],
        "edges": [
            {"id": "e1", "source": "start-1", "target": "form-1"},
            {"id": "e2", "source": "form-1", "target": "task-1"},
            {"id": "e3", "source": "task-1", "target": "decision-1"},
            {"id": "e4", "source": "decision-1", "target": "task-2", "sourceHandle": "yes", "label": "Yes"},
            {"id": "e5", "source": "decision-1", "target": "email-1", "sourceHandle": "no", "label": "No"},
            {"id": "e6", "source": "task-2", "target": "approval-1"},
            {"id": "e7", "source": "approval-1", "target": "end-1"},
            {"id": "e8", "source": "email-1", "target": "end-2"},
        ],
        "status": "published",
        "version": 1,
        "tags": ["recruiting", "hr", "demo"],
        "created_at": now_iso,
        "updated_at": now_iso,
    })

    # Workflow 2: Expense Approval Workflow (with parallel approvals)
    expense_wf_id = str(uuid.uuid4())
    workflows_to_create.append({
        "id": expense_wf_id,
        "name": "Expense Approval Workflow",
        "description": "Multi-level expense approval process",
        "nodes": [
            {"id": "start-2", "type": "start", "position": {"x": 100, "y": 200}, "data": {"label": "Start", "type": "start"}},
            {"id": "form-2", "type": "form", "position": {"x": 250, "y": 200}, "data": {"label": "Expense Form", "type": "form", "formId": expense_form_id}},
            {"id": "decision-2", "type": "decision", "position": {"x": 400, "y": 200}, "data": {"label": "Amount > $1000?", "type": "decision", "condition": "amount > 1000"}},
            {"id": "approval-2", "type": "approval", "position": {"x": 550, "y": 150}, "data": {"label": "Manager Approval", "type": "approval", "approvers": ["manager@example.com"], "approvalType": "single"}},
            {"id": "approval-3", "type": "approval", "position": {"x": 700, "y": 150}, "data": {"label": "Finance Approval", "type": "approval", "approvers": ["analyst@example.com"], "approvalType": "single"}},
            {"id": "task-3", "type": "task", "position": {"x": 550, "y": 250}, "data": {"label": "Auto Approve", "type": "task", "description": "Automatic approval for small amounts", "assignmentStrategy": "direct", "assignedTo": "analyst@example.com", "priority": "low", "dueInHours": 12}},
            {"id": "end-3", "type": "end", "position": {"x": 850, "y": 200}, "data": {"label": "Processed", "type": "end"}},
        ],
        "edges": [
            {"id": "e9", "source": "start-2", "target": "form-2"},
            {"id": "e10", "source": "form-2", "target": "decision-2"},
            {"id": "e11", "source": "decision-2", "target": "approval-2", "sourceHandle": "yes", "label": "Yes"},
            {"id": "e12", "source": "decision-2", "target": "task-3", "sourceHandle": "no", "label": "No"},
            {"id": "e13", "source": "approval-2", "target": "approval-3"},
            {"id": "e14", "source": "approval-3", "target": "end-3"},
            {"id": "e15", "source": "task-3", "target": "end-3"},
        ],
        "status": "published",
        "version": 1,
        "tags": ["finance", "expense", "demo"],
        "created_at": now_iso,
        "updated_at": now_iso,
    })

    # Workflow 3: Purchase Request Workflow (with timer and API call)
    purchase_wf_id = str(uuid.uuid4())
    workflows_to_create.append({
        "id": purchase_wf_id,
        "name": "Purchase Request Workflow",
        "description": "Purchase approval with timeout and notification",
        "nodes": [
            {"id": "start-3", "type": "start", "position": {"x": 100, "y": 180}, "data": {"label": "Start", "type": "start"}},
            {"id": "form-3", "type": "form", "position": {"x": 250, "y": 180}, "data": {"label": "Purchase Request", "type": "form", "formId": purchase_form_id}},
            {"id": "timer-1", "type": "timer", "position": {"x": 400, "y": 180}, "data": {"label": "Wait 1 Hour", "type": "timer", "timerType": "delay", "delayHours": 1}},
            {"id": "approval-4", "type": "approval", "position": {"x": 550, "y": 180}, "data": {"label": "Procurement Approval", "type": "approval", "approvers": ["manager@example.com"], "approvalType": "single"}},
            {"id": "api-1", "type": "api_call", "position": {"x": 700, "y": 180}, "data": {"label": "Update Inventory", "type": "api_call", "description": "Call inventory API"}},
            {"id": "email-2", "type": "email", "position": {"x": 850, "y": 180}, "data": {"label": "Send Confirmation", "type": "email", "description": "Notify requester"}},
            {"id": "end-4", "type": "end", "position": {"x": 1000, "y": 180}, "data": {"label": "Complete", "type": "end"}},
        ],
        "edges": [
            {"id": "e16", "source": "start-3", "target": "form-3"},
            {"id": "e17", "source": "form-3", "target": "timer-1"},
            {"id": "e18", "source": "timer-1", "target": "approval-4"},
            {"id": "e19", "source": "approval-4", "target": "api-1"},
            {"id": "e20", "source": "api-1", "target": "email-2"},
            {"id": "e21", "source": "email-2", "target": "end-4"},
        ],
        "status": "published",
        "version": 1,
        "tags": ["procurement", "demo"],
        "created_at": now_iso,
        "updated_at": now_iso,
    })

    # Insert workflows if they don't exist
    for wf in workflows_to_create:
        if not workflows_collection.find_one({"name": wf["name"]}):
            workflows_collection.insert_one(wf)

    # ============ WORKFLOW INSTANCES, TASKS, APPROVALS ============
    # Create instances for each workflow in various states
    all_workflows = [recruiting_wf_id, expense_wf_id, purchase_wf_id]
    statuses = ["completed", "running", "waiting", "running", "completed"]
    
    for wf_id in all_workflows:
        for i, status in enumerate(statuses):
            instance_id = str(uuid.uuid4())
            started_at = now - timedelta(hours=72 - i * 15)
            completed_at = started_at + timedelta(hours=6) if status == "completed" else None

            workflow_instances_collection.insert_one({
                "id": instance_id,
                "workflow_id": wf_id,
                "status": status,
                "triggered_by": "sample_data",
                "started_at": started_at.isoformat(),
                "updated_at": (completed_at or now).isoformat(),
                "completed_at": completed_at.isoformat() if completed_at else None,
                "current_node_id": f"task-{i+1}",
                "variables": {"sample": True, "iteration": i},
                "execution_history": [],
                "execution_log": [{"message": "Sample workflow instance", "timestamp": now_iso}],
                "node_states": {},
            })

            # Create tasks
            task_id = str(uuid.uuid4())
            tasks_collection.insert_one({
                "id": task_id,
                "workflow_instance_id": instance_id,
                "node_id": f"task-{i+1}",
                "title": f"Sample Task {i+1}",
                "description": f"Sample task for demo purposes - Iteration {i+1}",
                "assigned_to": "builder@example.com",
                "assignment_strategy": "role",
                "assignment_role": "builder",
                "priority": ["low", "medium", "high", "urgent"][i % 4],
                "status": "completed" if status == "completed" else "pending",
                "due_date": (started_at + timedelta(hours=24)).isoformat(),
                "sla_hours": 24,
                "created_at": started_at.isoformat(),
                "updated_at": (completed_at or now).isoformat(),
            })

            # Create approvals
            approval_id = str(uuid.uuid4())
            approvals_collection.insert_one({
                "id": approval_id,
                "workflow_instance_id": instance_id,
                "node_id": f"approval-{i+1}",
                "title": f"Approval Request {i+1}",
                "description": "Sample approval for demo",
                "approvers": ["approver@example.com", "manager@example.com"],
                "approval_type": ["single", "unanimous", "majority"][i % 3],
                "status": "approved" if status == "completed" else "pending",
                "decisions": [],
                "created_at": started_at.isoformat(),
                "updated_at": (completed_at or now).isoformat(),
            })

            # Create form submissions
            form_submission_id = str(uuid.uuid4())
            form_submissions_collection.insert_one({
                "id": form_submission_id,
                "form_id": hiring_form_id,
                "workflow_instance_id": instance_id,
                "submitted_by": "requester@example.com",
                "data": {
                    "full_name": f"Candidate {i+1}",
                    "email": f"candidate{i+1}@example.com",
                    "role": "Software Engineer",
                    "experience": i + 2,
                },
                "submitted_at": started_at.isoformat(),
            })

            # Create notifications
            notifications_collection.insert_one({
                "id": str(uuid.uuid4()),
                "user": "approver@example.com",
                "type": "approval_required",
                "message": f"New approval request for workflow instance {instance_id[:8]}",
                "created_at": now_iso,
                "read": status == "completed",
            })

    # ============ AUDIT LOGS ============
    audit_events = [
        {"action": "workflow_created", "entity_type": "workflow", "entity_id": recruiting_wf_id, "user": "admin@example.com", "details": {"name": "Employee Recruiting Workflow"}},
        {"action": "workflow_published", "entity_type": "workflow", "entity_id": expense_wf_id, "user": "builder@example.com", "details": {"version": 1}},
        {"action": "form_created", "entity_type": "form", "entity_id": hiring_form_id, "user": "builder@example.com", "details": {"name": "Job Application Form"}},
        {"action": "task_completed", "entity_type": "task", "entity_id": str(uuid.uuid4()), "user": "builder@example.com", "details": {"status": "completed"}},
        {"action": "approval_granted", "entity_type": "approval", "entity_id": str(uuid.uuid4()), "user": "approver@example.com", "details": {"decision": "approved"}},
    ]
    
    for event in audit_events:
        audit_logs_collection.insert_one({
            "id": str(uuid.uuid4()),
            "timestamp": (now - timedelta(hours=24)).isoformat(),
            "action": event["action"],
            "entity_type": event["entity_type"],
            "entity_id": event["entity_id"],
            "user": event["user"],
            "details": event["details"],
        })

    # ============ API CONNECTORS ============
    connectors = [
        {"name": "Slack Webhook", "type": "webhook", "description": "Send notifications to Slack", "config": {"url": "https://hooks.slack.com/services/example"}},
        {"name": "GitHub API", "type": "rest", "description": "Integrate with GitHub", "config": {"base_url": "https://api.github.com", "auth_type": "bearer"}},
        {"name": "Salesforce CRM", "type": "rest", "description": "Connect to Salesforce", "config": {"base_url": "https://api.salesforce.com", "auth_type": "oauth2"}},
    ]
    
    for conn in connectors:
        if not api_connectors_collection.find_one({"name": conn["name"]}):
            api_connectors_collection.insert_one({
                "id": str(uuid.uuid4()),
                "name": conn["name"],
                "type": conn["type"],
                "description": conn["description"],
                "config": conn["config"],
                "enabled": True,
                "created_at": now_iso,
                "updated_at": now_iso,
            })

    return {
        "message": "Comprehensive sample data generated successfully across all modules!",
        "summary": {
            "users": len(extra_users),
            "roles": len(base_roles),
            "forms": len(forms_to_create),
            "workflows": len(workflows_to_create),
            "workflow_instances": len(all_workflows) * len(statuses),
            "tasks": len(all_workflows) * len(statuses),
            "approvals": len(all_workflows) * len(statuses),
            "audit_logs": len(audit_events),
            "api_connectors": len(connectors),
        }
    }

    now_iso = now.isoformat()
    
    at_risk_tasks = list(tasks_collection.find(
        {
            "due_date": {"$gte": now_iso, "$lte": tomorrow},
            "status": {"$nin": ["completed", "cancelled"]}
        },
        {"_id": 0}
    ))
    return {"tasks": at_risk_tasks, "count": len(at_risk_tasks)}

# Background SLA Escalation Job
def check_sla_and_escalate():
    """Background job to check SLA violations and auto-escalate"""
    now = datetime.utcnow()
    now_iso = now.isoformat()
    
    # Find overdue tasks that haven't been escalated yet
    overdue_tasks = tasks_collection.find({
        "due_date": {"$lt": now_iso},
        "status": {"$nin": ["completed", "cancelled"]},
        "auto_escalated": {"$ne": True}
    })
    
    for task in overdue_tasks:
        # Auto-escalate
        new_priority = "urgent" if task.get("priority") == "high" else "high"
        tasks_collection.update_one(
            {"id": task["id"]},
            {"$set": {
                "priority": new_priority,
                "auto_escalated": True,
                "escalated": True,
                "escalation_reason": "Auto-escalated due to SLA breach",
                "escalated_at": now_iso,
                "updated_at": now_iso
            }}
        )
        
        # Create notification
        notifications_collection.insert_one({
            "id": str(uuid.uuid4()),
            "type": "sla_breach",
            "entity_type": "task",
            "entity_id": task["id"],
            "recipient": task.get("assigned_to"),
            "title": f"SLA Breach: {task.get('title')}",
            "message": f"Task is overdue and has been auto-escalated to {new_priority} priority",
            "priority": "urgent",
            "read": False,
            "created_at": now_iso
        })
        
        # Audit log
        audit_logs_collection.insert_one({
            "id": str(uuid.uuid4()),
            "entity_type": "task",
            "entity_id": task["id"],
            "action": "auto_escalated",
            "user": "system",
            "details": {"reason": "SLA breach", "new_priority": new_priority},
            "timestamp": now_iso
        })

# Schedule SLA check every 5 minutes
scheduler.add_job(
    check_sla_and_escalate,
    'interval',
    minutes=5,
    id='sla_checker',
    name='SLA Breach Checker'
)

# Notifications Endpoint
@app.get("/api/notifications")
async def get_notifications(recipient: Optional[str] = None, unread_only: bool = False):
    """Get notifications"""
    query = {}
    if recipient:
        query["recipient"] = recipient
    if unread_only:
        query["read"] = False
    
    notifications = list(notifications_collection.find(query, {"_id": 0}).sort("created_at", -1).limit(50))
    return {"notifications": notifications, "count": len(notifications)}

@app.post("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    result = notifications_collection.update_one(
        {"id": notification_id},
        {"$set": {"read": True, "read_at": datetime.utcnow().isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@app.post("/api/notifications/mark-all-read")
async def mark_all_notifications_read(recipient: Optional[str] = None):
    """Mark all notifications as read"""
    query = {"read": False}
    if recipient:
        query["recipient"] = recipient
    
    result = notifications_collection.update_many(
        query,
        {"$set": {"read": True, "read_at": datetime.utcnow().isoformat()}}
    )
    return {"message": f"Marked {result.modified_count} notifications as read"}

# Approval Endpoints
@app.get("/api/approvals")
async def get_approvals(status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    
    approvals = list(approvals_collection.find(query, {"_id": 0}))
    return {"approvals": approvals, "count": len(approvals)}

@app.post("/api/approvals")
async def create_approval(approval: Approval):
    approval_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    approval_dict = approval.dict()
    approval_dict["id"] = approval_id
    approval_dict["created_at"] = now
    approval_dict["updated_at"] = now
    
    approvals_collection.insert_one(approval_dict)
    return {"message": "Approval created successfully", "id": approval_id}

@app.put("/api/approvals/{approval_id}")
async def update_approval(approval_id: str, approval: Approval):
    existing = approvals_collection.find_one({"id": approval_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    now = datetime.utcnow().isoformat()
    approval_dict = approval.dict()
    approval_dict["id"] = approval_id
    approval_dict["created_at"] = existing.get("created_at")
    approval_dict["updated_at"] = now
    
    approvals_collection.replace_one({"id": approval_id}, approval_dict)
    return {"message": "Approval updated successfully"}

# Form Submission Endpoints
@app.post("/api/forms/{form_id}/submit")
async def submit_form(form_id: str, submission: Dict[str, Any]):
    form = forms_collection.find_one({"id": form_id})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    submission_id = str(uuid.uuid4())
    submission_data = {
        "id": submission_id,
        "form_id": form_id,
        "data": submission,
        "submitted_at": datetime.utcnow().isoformat()
    }
    
    form_submissions_collection.insert_one(submission_data)
    return {"message": "Form submitted successfully", "id": submission_id}

# Audit Logs
@app.get("/api/audit-logs")
async def get_audit_logs(entity_type: Optional[str] = None, entity_id: Optional[str] = None):
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    
    logs = list(audit_logs_collection.find(query, {"_id": 0}).sort("timestamp", -1).limit(100))
    return {"logs": logs, "count": len(logs)}

# ========== PHASE 4: EXECUTION ENGINE ENDPOINTS ==========

# Workflow Instance Endpoints
@app.get("/api/workflow-instances")
async def get_workflow_instances(workflow_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if workflow_id:
        query["workflow_id"] = workflow_id
    if status:
        query["status"] = status
    
    instances = list(workflow_instances_collection.find(query, {"_id": 0}).sort("started_at", -1).limit(50))
    return {"instances": instances, "count": len(instances)}

@app.get("/api/workflow-instances/{instance_id}")
async def get_workflow_instance(instance_id: str):
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    return instance

# Execution Control Endpoints
@app.post("/api/workflows/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, input_data: Optional[Dict[str, Any]] = None):
    """Start workflow execution manually"""
    try:
        instance_id = execution_engine.start_execution(workflow_id, triggered_by="manual", input_data=input_data or {})
        return {"message": "Workflow execution started", "instance_id": instance_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/workflow-instances/{instance_id}/pause")
async def pause_execution(instance_id: str):
    """Pause workflow execution"""
    execution_engine.pause_execution(instance_id)
    return {"message": "Workflow execution paused"}

@app.post("/api/workflow-instances/{instance_id}/resume")
async def resume_execution_endpoint(instance_id: str):
    """Resume paused workflow execution"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    if instance.get("status") == "paused":
        workflow_instances_collection.update_one(
            {"id": instance_id},
            {"$set": {"status": "running", "updated_at": datetime.utcnow().isoformat()}}
        )
        return {"message": "Workflow execution resumed"}
    else:
        raise HTTPException(status_code=400, detail="Workflow is not paused")

@app.post("/api/workflow-instances/{instance_id}/cancel")
async def cancel_execution_endpoint(instance_id: str):
    """Cancel workflow execution"""
    execution_engine.cancel_execution(instance_id)
    return {"message": "Workflow execution cancelled"}


# ========== PHASE 3: ENHANCED SUB-WORKFLOW & LOOPING ENDPOINTS ==========

@app.get("/api/workflow-instances/{instance_id}/children")
async def get_child_instances(instance_id: str):
    """Get all child subprocess instances for a parent workflow instance"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    # Find all child instances
    child_instances = list(workflow_instances_collection.find(
        {"parent_instance_id": instance_id},
        {"_id": 0}
    ).sort("started_at", 1))
    
    return {
        "instance_id": instance_id,
        "child_count": len(child_instances),
        "children": child_instances
    }

@app.get("/api/workflow-instances/{instance_id}/hierarchy")
async def get_instance_hierarchy(instance_id: str):
    """Get complete parent-child hierarchy for a workflow instance"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    # Build hierarchy tree
    def build_hierarchy(inst_id: str, depth: int = 0) -> Dict[str, Any]:
        inst = workflow_instances_collection.find_one({"id": inst_id}, {"_id": 0})
        if not inst:
            return None
        
        children = list(workflow_instances_collection.find(
            {"parent_instance_id": inst_id},
            {"_id": 0}
        ))
        
        return {
            "instance_id": inst_id,
            "workflow_id": inst.get("workflow_id"),
            "workflow_name": db["workflows"].find_one({"id": inst.get("workflow_id")}, {"_id": 0, "name": 1}).get("name") if inst.get("workflow_id") else "Unknown",
            "status": inst.get("status"),
            "nesting_level": inst.get("nesting_level", 0),
            "depth": depth,
            "started_at": inst.get("started_at"),
            "completed_at": inst.get("completed_at"),
            "children": [build_hierarchy(child["id"], depth + 1) for child in children]
        }
    
    # Find root instance (top-most parent)
    root_id = instance_id
    current = instance
    while current.get("parent_instance_id"):
        root_id = current["parent_instance_id"]
        current = workflow_instances_collection.find_one({"id": root_id}, {"_id": 0})
        if not current:
            break
    
    hierarchy = build_hierarchy(root_id)
    
    return {
        "root_instance_id": root_id,
        "hierarchy": hierarchy
    }

@app.post("/api/workflow-instances/{instance_id}/complete-subprocess")
async def complete_subprocess(instance_id: str, data: Dict[str, Any] = None):
    """Complete a subprocess execution and return output to parent - Enhanced Phase 3.1"""
    if data is None:
        data = {}
    
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    parent_id = instance.get("parent_instance_id")
    if not parent_id:
        raise HTTPException(status_code=400, detail="Instance is not a subprocess")
    
    # Get output data from subprocess
    output_data = data.get("output", instance.get("variables", {}))
    subprocess_status = instance.get("status", "completed")
    subprocess_error = instance.get("error")
    
    # Update subprocess status
    now = datetime.utcnow().isoformat()
    workflow_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {
            "status": subprocess_status,
            "completed_at": now,
            "output_data": output_data
        }}
    )
    
    # Update parent instance - map subprocess output to parent variables and resume execution
    parent_instance = workflow_instances_collection.find_one({"id": parent_id}, {"_id": 0})
    if parent_instance:
        subprocess_node_id = None
        
        # Find the subprocess node in parent's execution history
        for history_entry in reversed(parent_instance.get("execution_history", [])):
            result = history_entry.get("result", {})
            if (result.get("subprocess_instance_id") == instance_id and 
                result.get("status") == "waiting"):
                
                subprocess_node_id = history_entry.get("node_id")
                
                # Get output mapping from subprocess node
                output_mapping = result.get("output_mapping", {})
                parent_variables = parent_instance.get("variables", {})
                
                # Map subprocess output to parent variables
                for parent_var, subprocess_var in output_mapping.items():
                    if subprocess_var in output_data:
                        parent_variables[parent_var] = output_data[subprocess_var]
                    elif isinstance(subprocess_var, str) and subprocess_var.startswith("${"):
                        # Evaluate expression from subprocess context
                        evaluator = ExpressionEvaluator()
                        value = evaluator.evaluate(subprocess_var, output_data)
                        parent_variables[parent_var] = value
                
                # Store entire subprocess output under a special key
                parent_variables[f"subprocess_{instance_id}"] = output_data
                
                # Update parent variables
                workflow_instances_collection.update_one(
                    {"id": parent_id},
                    {"$set": {"variables": parent_variables}}
                )
                
                # Resume parent execution from subprocess node
                if subprocess_node_id:
                    try:
                        # Create result data to pass to parent
                        result_data = {
                            "subprocess_completed": True,
                            "subprocess_status": subprocess_status,
                            "subprocess_output": output_data,
                            "subprocess_error": subprocess_error
                        }
                        
                        # Resume parent workflow execution
                        execution_engine.resume_execution(parent_id, subprocess_node_id, result_data)
                    except Exception as e:
                        print(f"Error resuming parent execution: {str(e)}")
                        # Update parent status to indicate error
                        workflow_instances_collection.update_one(
                            {"id": parent_id},
                            {"$set": {
                                "status": "failed",
                                "error": f"Failed to resume after subprocess: {str(e)}"
                            }}
                        )
                
                break
    
    return {
        "message": "Subprocess completed and parent resumed",
        "instance_id": instance_id,
        "parent_instance_id": parent_id,
        "output_data": output_data,
        "status": subprocess_status
    }



# ========== PHASE 3.1: WORKFLOW COMPONENTS & COMPOSITION PATTERNS ==========

class WorkflowComponent(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    category: str = "custom"  # approval, data_processing, integration, notification, custom
    tags: List[str] = []
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    input_variables: List[str] = []  # Expected input variables
    output_variables: List[str] = []  # Output variables produced
    is_public: bool = False
    created_by: Optional[str] = "system"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    usage_count: int = 0

class CompositionPattern(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    category: str  # approval_chain, data_pipeline, notification_flow, error_handling, etc.
    tags: List[str] = []
    template_nodes: List[WorkflowNode]
    template_edges: List[WorkflowEdge]
    configuration_schema: Dict[str, Any] = {}  # JSON schema for pattern customization
    preview_image: Optional[str] = None
    is_featured: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# Workflow Components Endpoints
@app.get("/api/workflow-components")
async def get_workflow_components(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all reusable workflow components with optional filters"""
    query = {}
    
    if category:
        query["category"] = category
    if tag:
        query["tags"] = tag
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    components = list(workflow_components_collection.find(query, {"_id": 0}).sort("usage_count", -1))
    
    return {
        "components": components,
        "count": len(components),
        "categories": ["approval", "data_processing", "integration", "notification", "custom"]
    }

@app.get("/api/workflow-components/{component_id}")
async def get_workflow_component(component_id: str):
    """Get a specific workflow component by ID"""
    component = workflow_components_collection.find_one({"id": component_id}, {"_id": 0})
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    return component

@app.post("/api/workflow-components")
async def create_workflow_component(component: WorkflowComponent):
    """Create a new reusable workflow component"""
    component_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    component_dict = component.dict()
    component_dict["id"] = component_id
    component_dict["created_at"] = now
    component_dict["updated_at"] = now
    component_dict["usage_count"] = 0
    
    # Validate that component has at least one node
    if not component_dict.get("nodes") or len(component_dict["nodes"]) == 0:
        raise HTTPException(status_code=400, detail="Component must have at least one node")
    
    workflow_components_collection.insert_one(component_dict)
    
    # Log audit
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow_component",
        "entity_id": component_id,
        "action": "created",
        "timestamp": now
    })
    
    return {
        "message": "Workflow component created successfully",
        "id": component_id,
        "component": component_dict
    }

@app.put("/api/workflow-components/{component_id}")
async def update_workflow_component(component_id: str, component: WorkflowComponent):
    """Update an existing workflow component"""
    existing = workflow_components_collection.find_one({"id": component_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Component not found")
    
    now = datetime.utcnow().isoformat()
    component_dict = component.dict()
    component_dict["id"] = component_id
    component_dict["created_at"] = existing.get("created_at")
    component_dict["created_by"] = existing.get("created_by")
    component_dict["usage_count"] = existing.get("usage_count", 0)
    component_dict["updated_at"] = now
    
    workflow_components_collection.replace_one({"id": component_id}, component_dict)
    
    # Log audit
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow_component",
        "entity_id": component_id,
        "action": "updated",
        "timestamp": now
    })
    
    return {"message": "Component updated successfully", "component": component_dict}

@app.delete("/api/workflow-components/{component_id}")
async def delete_workflow_component(component_id: str):
    """Delete a workflow component"""
    result = workflow_components_collection.delete_one({"id": component_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Component not found")
    
    # Log audit
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow_component",
        "entity_id": component_id,
        "action": "deleted",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"message": "Component deleted successfully"}

@app.post("/api/workflow-components/{component_id}/increment-usage")
async def increment_component_usage(component_id: str):
    """Increment usage count when component is used"""
    result = workflow_components_collection.update_one(
        {"id": component_id},
        {"$inc": {"usage_count": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Component not found")
    
    return {"message": "Usage count incremented"}

@app.post("/api/workflows/{workflow_id}/save-as-component")
async def save_workflow_as_component(
    workflow_id: str,
    data: Dict[str, Any]
):
    """Save entire workflow or selected nodes as a reusable component"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Extract component data
    component_name = data.get("name", f"{workflow.get('name')} Component")
    component_description = data.get("description", "")
    component_category = data.get("category", "custom")
    component_tags = data.get("tags", [])
    selected_node_ids = data.get("selected_node_ids", [])
    
    # Get nodes and edges
    if selected_node_ids and len(selected_node_ids) > 0:
        # Save only selected nodes
        nodes = [n for n in workflow.get("nodes", []) if n.get("id") in selected_node_ids]
        # Get edges that connect selected nodes
        edges = [e for e in workflow.get("edges", []) 
                if e.get("source") in selected_node_ids and e.get("target") in selected_node_ids]
    else:
        # Save entire workflow
        nodes = workflow.get("nodes", [])
        edges = workflow.get("edges", [])
    
    if not nodes:
        raise HTTPException(status_code=400, detail="No nodes to save as component")
    
    # Create component
    component = WorkflowComponent(
        name=component_name,
        description=component_description,
        category=component_category,
        tags=component_tags,
        nodes=nodes,
        edges=edges,
        input_variables=data.get("input_variables", []),
        output_variables=data.get("output_variables", []),
        is_public=data.get("is_public", False),
        created_by=data.get("created_by", "system")
    )
    
    # Save component
    result = await create_workflow_component(component)
    
    return result

# Composition Patterns Endpoints
@app.get("/api/composition-patterns")
async def get_composition_patterns(
    category: Optional[str] = None,
    featured: Optional[bool] = None
):
    """Get all composition patterns with optional filters"""
    query = {}
    
    if category:
        query["category"] = category
    if featured is not None:
        query["is_featured"] = featured
    
    patterns = list(db["composition_patterns"].find(query, {"_id": 0}))
    
    return {
        "patterns": patterns,
        "count": len(patterns),
        "categories": [
            "approval_chain",
            "data_pipeline", 
            "notification_flow",
            "error_handling",
            "parallel_processing",
            "sequential_approval",
            "conditional_routing"
        ]
    }

@app.get("/api/composition-patterns/{pattern_id}")
async def get_composition_pattern(pattern_id: str):
    """Get a specific composition pattern"""
    pattern = db["composition_patterns"].find_one({"id": pattern_id}, {"_id": 0})
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    return pattern

@app.post("/api/composition-patterns")
async def create_composition_pattern(pattern: CompositionPattern):
    """Create a new composition pattern"""
    pattern_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    pattern_dict = pattern.dict()
    pattern_dict["id"] = pattern_id
    pattern_dict["created_at"] = now
    pattern_dict["updated_at"] = now
    
    db["composition_patterns"].insert_one(pattern_dict)
    
    return {
        "message": "Composition pattern created successfully",
        "id": pattern_id,
        "pattern": pattern_dict
    }

@app.post("/api/composition-patterns/{pattern_id}/instantiate")
async def instantiate_pattern(pattern_id: str, config: Dict[str, Any]):
    """Instantiate a composition pattern with custom configuration"""
    pattern = db["composition_patterns"].find_one({"id": pattern_id}, {"_id": 0})
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    
    # Clone template nodes and edges
    nodes = []
    edges = []
    node_id_map = {}  # Map old IDs to new IDs
    
    # Generate new node IDs
    for template_node in pattern.get("template_nodes", []):
        old_id = template_node.get("id")
        new_id = str(uuid.uuid4())
        node_id_map[old_id] = new_id
        
        # Clone node with new ID
        new_node = {**template_node}
        new_node["id"] = new_id
        
        # Apply configuration overrides
        if "node_configs" in config and old_id in config["node_configs"]:
            node_config = config["node_configs"][old_id]
            new_node["data"] = {**new_node.get("data", {}), **node_config}
        
        nodes.append(new_node)
    
    # Update edge IDs
    for template_edge in pattern.get("template_edges", []):
        new_edge = {**template_edge}
        new_edge["id"] = str(uuid.uuid4())
        new_edge["source"] = node_id_map.get(new_edge["source"], new_edge["source"])
        new_edge["target"] = node_id_map.get(new_edge["target"], new_edge["target"])
        edges.append(new_edge)
    
    return {
        "message": "Pattern instantiated successfully",
        "nodes": nodes,
        "edges": edges,
        "node_id_map": node_id_map
    }

# Initialize default composition patterns
@app.post("/api/composition-patterns/initialize-defaults")
async def initialize_default_patterns():
    """Initialize default composition patterns if they don't exist"""
    
    default_patterns = [
        {
            "name": "Sequential Approval Chain",
            "description": "Multi-level sequential approval workflow with escalation",
            "category": "approval_chain",
            "tags": ["approval", "sequential", "escalation"],
            "is_featured": True,
            "template_nodes": [
                {
                    "id": "start_1",
                    "type": "start",
                    "data": {"label": "Start"},
                    "position": {"x": 100, "y": 100}
                },
                {
                    "id": "approval_1",
                    "type": "approval",
                    "data": {
                        "label": "Level 1 Approval",
                        "approvalType": "single",
                        "approvers": []
                    },
                    "position": {"x": 100, "y": 200}
                },
                {
                    "id": "decision_1",
                    "type": "decision",
                    "data": {
                        "label": "Approved?",
                        "condition": "${approval_1_result.decision} == 'approved'"
                    },
                    "position": {"x": 100, "y": 300}
                },
                {
                    "id": "approval_2",
                    "type": "approval",
                    "data": {
                        "label": "Level 2 Approval",
                        "approvalType": "single",
                        "approvers": []
                    },
                    "position": {"x": 100, "y": 400}
                },
                {
                    "id": "end_approved",
                    "type": "end",
                    "data": {"label": "Approved"},
                    "position": {"x": 100, "y": 500}
                },
                {
                    "id": "end_rejected",
                    "type": "end",
                    "data": {"label": "Rejected"},
                    "position": {"x": 300, "y": 350}
                }
            ],
            "template_edges": [
                {"id": "e1", "source": "start_1", "target": "approval_1"},
                {"id": "e2", "source": "approval_1", "target": "decision_1"},
                {"id": "e3", "source": "decision_1", "target": "approval_2", "label": "Yes", "sourceHandle": "yes"},
                {"id": "e4", "source": "decision_1", "target": "end_rejected", "label": "No", "sourceHandle": "no"},
                {"id": "e5", "source": "approval_2", "target": "end_approved"}
            ],
            "configuration_schema": {
                "type": "object",
                "properties": {
                    "level_1_approvers": {"type": "array", "items": {"type": "string"}},
                    "level_2_approvers": {"type": "array", "items": {"type": "string"}}
                }
            }
        },
        {
            "name": "Parallel Data Processing Pipeline",
            "description": "Process data in parallel branches and merge results",
            "category": "data_pipeline",
            "tags": ["parallel", "data", "processing"],
            "is_featured": True,
            "template_nodes": [
                {
                    "id": "start_1",
                    "type": "start",
                    "data": {"label": "Start"},
                    "position": {"x": 250, "y": 50}
                },
                {
                    "id": "parallel_1",
                    "type": "parallel",
                    "data": {"label": "Split Processing"},
                    "position": {"x": 250, "y": 150}
                },
                {
                    "id": "transform_1",
                    "type": "transform",
                    "data": {"label": "Transform A"},
                    "position": {"x": 100, "y": 250}
                },
                {
                    "id": "transform_2",
                    "type": "transform",
                    "data": {"label": "Transform B"},
                    "position": {"x": 400, "y": 250}
                },
                {
                    "id": "merge_1",
                    "type": "merge",
                    "data": {"label": "Merge Results"},
                    "position": {"x": 250, "y": 350}
                },
                {
                    "id": "end_1",
                    "type": "end",
                    "data": {"label": "Complete"},
                    "position": {"x": 250, "y": 450}
                }
            ],
            "template_edges": [
                {"id": "e1", "source": "start_1", "target": "parallel_1"},
                {"id": "e2", "source": "parallel_1", "target": "transform_1"},
                {"id": "e3", "source": "parallel_1", "target": "transform_2"},
                {"id": "e4", "source": "transform_1", "target": "merge_1"},
                {"id": "e5", "source": "transform_2", "target": "merge_1"},
                {"id": "e6", "source": "merge_1", "target": "end_1"}
            ],
            "configuration_schema": {
                "type": "object",
                "properties": {
                    "transform_a_logic": {"type": "string"},
                    "transform_b_logic": {"type": "string"}
                }
            }
        },
        {
            "name": "Error Handling with Retry",
            "description": "Robust error handling with automatic retry and fallback",
            "category": "error_handling",
            "tags": ["error", "retry", "fallback"],
            "is_featured": True,
            "template_nodes": [
                {
                    "id": "start_1",
                    "type": "start",
                    "data": {"label": "Start"},
                    "position": {"x": 200, "y": 50}
                },
                {
                    "id": "action_1",
                    "type": "action",
                    "data": {
                        "label": "Main Action",
                        "actionType": "http_request"
                    },
                    "position": {"x": 200, "y": 150}
                },
                {
                    "id": "decision_error",
                    "type": "decision",
                    "data": {
                        "label": "Success?",
                        "condition": "${action_1.status} == 'completed'"
                    },
                    "position": {"x": 200, "y": 250}
                },
                {
                    "id": "action_fallback",
                    "type": "action",
                    "data": {
                        "label": "Fallback Action",
                        "actionType": "webhook"
                    },
                    "position": {"x": 400, "y": 250}
                },
                {
                    "id": "end_success",
                    "type": "end",
                    "data": {"label": "Success"},
                    "position": {"x": 200, "y": 350}
                },
                {
                    "id": "end_fallback",
                    "type": "end",
                    "data": {"label": "Completed via Fallback"},
                    "position": {"x": 400, "y": 350}
                }
            ],
            "template_edges": [
                {"id": "e1", "source": "start_1", "target": "action_1"},
                {"id": "e2", "source": "action_1", "target": "decision_error"},
                {"id": "e3", "source": "decision_error", "target": "end_success", "label": "Yes", "sourceHandle": "yes"},
                {"id": "e4", "source": "decision_error", "target": "action_fallback", "label": "No", "sourceHandle": "no"},
                {"id": "e5", "source": "action_fallback", "target": "end_fallback"}
            ],
            "configuration_schema": {
                "type": "object",
                "properties": {
                    "main_action_url": {"type": "string"},
                    "fallback_action_url": {"type": "string"},
                    "retry_count": {"type": "number", "default": 3}
                }
            }
        }
    ]
    
    created_count = 0
    for pattern_data in default_patterns:
        # Check if pattern already exists
        existing = db["composition_patterns"].find_one({"name": pattern_data["name"]})
        if not existing:
            pattern_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            pattern_data["id"] = pattern_id
            pattern_data["created_at"] = now
            pattern_data["updated_at"] = now
            db["composition_patterns"].insert_one(pattern_data)
            created_count += 1
    
    return {
        "message": f"Initialized {created_count} default patterns",
        "created_count": created_count
    }


# ========== PHASE 3.2: ADVANCED LOOPING & BRANCHING ENDPOINTS ==========

@app.get("/api/workflow-instances/{instance_id}/loop-status")
async def get_loop_status(instance_id: str):
    """Get current loop status and progress for a workflow instance"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    # Get loop context from instance variables
    variables = instance.get("variables", {})
    loop_contexts = []
    
    # Extract loop information from execution history
    execution_history = instance.get("execution_history", [])
    active_loops = {}
    
    for entry in execution_history:
        node_type = entry.get("node_type", "")
        if node_type in ["loop_for_each", "loop_while", "loop_do_while", "loop_repeat"]:
            result = entry.get("result", {})
            output = result.get("output", {})
            loop_id = entry.get("node_id")
            
            if output:
                active_loops[loop_id] = {
                    "loop_id": loop_id,
                    "loop_type": output.get("loop_type", node_type.replace("loop_", "")),
                    "status": "active" if instance.get("status") == "running" else "completed",
                    "current_iteration": variables.get(output.get("counter_variable", "loop_counter"), 0),
                    "max_iterations": output.get("max_iterations", output.get("count", "unknown")),
                    "total_items": output.get("total_iterations", output.get("count", 0)),
                    "started_at": entry.get("timestamp")
                }
    
    # Calculate progress percentage
    for loop_id, loop_info in active_loops.items():
        current = loop_info.get("current_iteration", 0)
        total = loop_info.get("total_items", 0)
        if total and total > 0:
            loop_info["progress_percentage"] = min(100, (current / total) * 100)
            loop_info["items_remaining"] = max(0, total - current)
        else:
            loop_info["progress_percentage"] = 0
            loop_info["items_remaining"] = 0
    
    return {
        "instance_id": instance_id,
        "status": instance.get("status"),
        "active_loops": list(active_loops.values()),
        "loop_count": len(active_loops)
    }

@app.post("/api/workflow-instances/{instance_id}/loop/break")
async def break_loop(instance_id: str, data: Dict[str, Any]):
    """Manually break out of the current loop"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    if instance.get("status") != "running":
        raise HTTPException(status_code=400, detail="Instance is not running")
    
    loop_id = data.get("loop_id")
    reason = data.get("reason", "Manual break requested")
    
    # Add a break flag to the instance
    workflow_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {
            "loop_break_requested": True,
            "loop_break_id": loop_id,
            "loop_break_reason": reason,
            "loop_break_timestamp": datetime.utcnow().isoformat()
        }}
    )
    
    return {
        "message": "Loop break requested",
        "instance_id": instance_id,
        "loop_id": loop_id,
        "reason": reason
    }

@app.get("/api/workflow-instances/{instance_id}/loop/statistics")
async def get_loop_statistics(instance_id: str):
    """Get detailed statistics for all loops in the workflow instance"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    execution_history = instance.get("execution_history", [])
    loop_stats = {}
    
    for entry in execution_history:
        node_type = entry.get("node_type", "")
        if node_type in ["loop_for_each", "loop_while", "loop_do_while", "loop_repeat"]:
            node_id = entry.get("node_id")
            result = entry.get("result", {})
            output = result.get("output", {})
            
            if node_id not in loop_stats:
                loop_stats[node_id] = {
                    "loop_id": node_id,
                    "loop_type": node_type.replace("loop_", ""),
                    "total_iterations": 0,
                    "successful_iterations": 0,
                    "failed_iterations": 0,
                    "breaks": 0,
                    "continues": 0,
                    "total_execution_time_ms": 0,
                    "avg_iteration_time_ms": 0,
                    "started_at": entry.get("timestamp")
                }
        
        # Track break and continue
        if node_type == "loop_break":
            result = entry.get("result", {})
            if result.get("break_loop"):
                # Find the parent loop
                for loop_id in loop_stats:
                    loop_stats[loop_id]["breaks"] += 1
                    break
        
        if node_type == "loop_continue":
            result = entry.get("result", {})
            if result.get("continue_loop"):
                for loop_id in loop_stats:
                    loop_stats[loop_id]["continues"] += 1
                    break
    
    return {
        "instance_id": instance_id,
        "loop_statistics": list(loop_stats.values()),
        "total_loops": len(loop_stats)
    }


# ========== PHASE 8 SPRINT 3: VARIABLE MANAGEMENT ENDPOINTS ==========

@app.get("/api/instances/{instance_id}/variables")
async def get_instance_variables(
    instance_id: str,
    scope: Optional[str] = None,
    variable_type: Optional[str] = None
):
    """Get all variables for a workflow instance with optional filters"""
    from variable_manager import VariableType, VariableScope
    
    # Validate filters
    scope_filter = None
    if scope:
        try:
            scope_filter = VariableScope(scope)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid scope: {scope}")
    
    type_filter = None
    if variable_type:
        try:
            type_filter = VariableType(variable_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid type: {variable_type}")
    
    variables = variable_manager.get_instance_variables(
        instance_id=instance_id,
        scope=scope_filter,
        variable_type=type_filter
    )
    
    return {
        "instance_id": instance_id,
        "variables": variables,
        "count": len(variables),
        "filters": {
            "scope": scope,
            "type": variable_type
        }
    }


@app.get("/api/instances/{instance_id}/variables/{variable_name}/history")
async def get_variable_history(instance_id: str, variable_name: str):
    """Get change history for a specific variable"""
    history = variable_manager.get_variable_history(
        instance_id=instance_id,
        variable_name=variable_name
    )
    
    return {
        "instance_id": instance_id,
        "variable_name": variable_name,
        "history": history,
        "change_count": len(history)
    }


@app.post("/api/instances/{instance_id}/variables/watch")
async def add_to_watch_list(instance_id: str, data: Dict[str, Any]):
    """Add a variable to the watch list for debugging"""
    variable_name = data.get("variable_name")
    if not variable_name:
        raise HTTPException(status_code=400, detail="variable_name is required")
    
    # Verify instance exists
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    variable_manager.add_to_watch_list(instance_id, variable_name)
    
    return {
        "message": f"Variable '{variable_name}' added to watch list",
        "instance_id": instance_id,
        "variable_name": variable_name
    }


@app.delete("/api/instances/{instance_id}/variables/watch/{variable_name}")
async def remove_from_watch_list(instance_id: str, variable_name: str):
    """Remove a variable from the watch list"""
    variable_manager.remove_from_watch_list(instance_id, variable_name)
    
    return {
        "message": f"Variable '{variable_name}' removed from watch list",
        "instance_id": instance_id,
        "variable_name": variable_name
    }


@app.get("/api/instances/{instance_id}/variables/watch")
async def get_watch_list(instance_id: str):
    """Get the watch list for an instance"""
    watch_list = variable_manager.get_variable_watch_list(instance_id)
    
    # Get current values for watched variables
    watched_variables = []
    if watch_list:
        all_variables = variable_manager.get_instance_variables(instance_id)
        watched_variables = [v for v in all_variables if v["name"] in watch_list]
    
    return {
        "instance_id": instance_id,
        "watch_list": watch_list,
        "watched_variables": watched_variables,
        "count": len(watch_list)
    }


@app.get("/api/global-variables")
async def get_global_variables():
    """Get all global variables shared across workflows"""
    global_vars = variable_manager.get_global_variables()
    
    return {
        "global_variables": global_vars,
        "count": len(global_vars)
    }


@app.post("/api/global-variables")
async def set_global_variable(data: Dict[str, Any]):
    """Set or update a global variable"""
    variable_name = data.get("name")
    value = data.get("value")
    description = data.get("description")
    
    if not variable_name:
        raise HTTPException(status_code=400, detail="name is required")
    if value is None:
        raise HTTPException(status_code=400, detail="value is required")
    
    variable_manager.set_global_variable(
        variable_name=variable_name,
        value=value,
        description=description
    )
    
    return {
        "message": f"Global variable '{variable_name}' set successfully",
        "name": variable_name,
        "value": value
    }


@app.delete("/api/global-variables/{variable_name}")
async def delete_global_variable(variable_name: str):
    """Delete a global variable"""
    result = db["global_variables"].delete_one({"name": variable_name})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Global variable not found")
    
    return {
        "message": f"Global variable '{variable_name}' deleted successfully",
        "name": variable_name
    }


# Task Completion (resumes workflow)
@app.post("/api/tasks/{task_id}/complete")
async def complete_task(task_id: str, result_data: Optional[Dict[str, Any]] = None):
    """Complete a task and resume workflow"""
    task = tasks_collection.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task status
    tasks_collection.update_one(
        {"id": task_id},
        {"$set": {"status": "completed", "updated_at": datetime.utcnow().isoformat()}}
    )
    
    # Resume workflow execution
    execution_engine.resume_execution(
        task["workflow_instance_id"],
        task["node_id"],
        result_data or {}
    )
    
    return {"message": "Task completed and workflow resumed"}

# Approval Actions (resumes workflow)
@app.post("/api/approvals/{approval_id}/decide")
async def decide_approval(approval_id: str, decision: str, comment: Optional[str] = None, decided_by: Optional[str] = None):
    """Make approval decision and resume workflow based on approval type"""
    approval = approvals_collection.find_one({"id": approval_id}, {"_id": 0})
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    if decision not in ["approved", "rejected", "changes_requested"]:
        raise HTTPException(status_code=400, detail="Invalid decision")
    
    now = datetime.utcnow().isoformat()
    
    # Record decision
    decision_entry = {
        "decided_by": decided_by or "user",
        "decision": decision,
        "comment": comment,
        "timestamp": now
    }
    
    # Get current decisions
    current_decisions = approval.get("decisions", [])
    current_decisions.append(decision_entry)
    
    approval_type = approval.get("approval_type", "single")
    approvers = approval.get("approvers", [])
    total_approvers = max(len(approvers), 1)
    
    # Evaluate approval status based on type
    final_status = None
    should_resume = False
    
    if approval_type == "single":
        # Single approver - first decision is final
        final_status = decision
        should_resume = True
    
    elif approval_type == "sequential":
        # Sequential - each approver must approve in order
        if decision == "rejected":
            final_status = "rejected"
            should_resume = True
        elif decision == "approved":
            # Check if all approvers have approved
            approved_count = sum(1 for d in current_decisions if d["decision"] == "approved")
            if approved_count >= total_approvers:
                final_status = "approved"
                should_resume = True
            else:
                final_status = "pending"  # Wait for next approver
                # Create notification for next approver
                if approved_count < len(approvers):
                    next_approver = approvers[approved_count]
                    notifications_collection.insert_one({
                        "id": str(uuid.uuid4()),
                        "type": "approval_required",
                        "entity_type": "approval",
                        "entity_id": approval_id,
                        "recipient": next_approver,
                        "title": f"Approval Required: {approval.get('title')}",
                        "message": "You are the next approver in the sequential approval flow",
                        "read": False,
                        "created_at": now
                    })
    
    elif approval_type == "parallel":
        # Parallel - all approvers can vote simultaneously, first rejection fails
        if decision == "rejected":
            final_status = "rejected"
            should_resume = True
        else:
            approved_count = sum(1 for d in current_decisions if d["decision"] == "approved")
            if approved_count >= total_approvers:
                final_status = "approved"
                should_resume = True
            else:
                final_status = "pending"
    
    elif approval_type == "unanimous":
        # Unanimous - all must approve
        if decision == "rejected":
            final_status = "rejected"
            should_resume = True
        else:
            approved_count = sum(1 for d in current_decisions if d["decision"] == "approved")
            unique_approvers = len(set(d["decided_by"] for d in current_decisions if d["decision"] == "approved"))
            if unique_approvers >= total_approvers:
                final_status = "approved"
                should_resume = True
            else:
                final_status = "pending"
    
    elif approval_type == "majority":
        # Majority - more than 50% must approve
        approved_count = sum(1 for d in current_decisions if d["decision"] == "approved")
        rejected_count = sum(1 for d in current_decisions if d["decision"] == "rejected")
        votes_cast = approved_count + rejected_count
        majority_threshold = total_approvers // 2 + 1
        
        if approved_count >= majority_threshold:
            final_status = "approved"
            should_resume = True
        elif rejected_count >= majority_threshold:
            final_status = "rejected"
            should_resume = True
        elif votes_cast >= total_approvers:
            # All votes cast, majority wins
            final_status = "approved" if approved_count > rejected_count else "rejected"
            should_resume = True
        else:
            final_status = "pending"
    
    else:
        # Default single approver behavior
        final_status = decision
        should_resume = True
    
    # Update approval
    approvals_collection.update_one(
        {"id": approval_id},
        {
            "$set": {
                "decisions": current_decisions,
                "status": final_status,
                "updated_at": now
            }
        }
    )
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "approval",
        "entity_id": approval_id,
        "action": f"decision_{decision}",
        "user": decided_by or "user",
        "details": {
            "decision": decision,
            "approval_type": approval_type,
            "final_status": final_status,
            "comment": comment
        },
        "timestamp": now
    })
    
    # Resume workflow execution if approval is finalized
    if should_resume and approval.get("workflow_instance_id") and approval.get("node_id"):
        execution_engine.resume_execution(
            approval["workflow_instance_id"],
            approval["node_id"],
            {"approval_decision": final_status, "comment": comment, "decisions": current_decisions}
        )
    
    return {
        "message": "Approval decision recorded",
        "final_status": final_status,
        "should_resume": should_resume,
        "approval_type": approval_type,
        "votes": {
            "approved": sum(1 for d in current_decisions if d["decision"] == "approved"),
            "rejected": sum(1 for d in current_decisions if d["decision"] == "rejected"),
            "total_required": total_approvers
        }
    }

# Form Submission with Workflow Resume
@app.post("/api/forms/{form_id}/submit-workflow")
async def submit_form_workflow(form_id: str, instance_id: str, node_id: str, submission: Dict[str, Any]):
    """Submit form as part of workflow and resume execution"""
    form = forms_collection.find_one({"id": form_id})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    submission_id = str(uuid.uuid4())
    submission_data = {
        "id": submission_id,
        "form_id": form_id,
        "workflow_instance_id": instance_id,
        "node_id": node_id,
        "data": submission,
        "submitted_at": datetime.utcnow().isoformat()
    }
    
    form_submissions_collection.insert_one(submission_data)
    
    # Resume workflow execution
    execution_engine.resume_execution(instance_id, node_id, {"form_data": submission})
    
    return {"message": "Form submitted and workflow resumed", "submission_id": submission_id}

# Trigger Configuration
class TriggerConfig(BaseModel):
    workflow_id: str
    trigger_type: str  # manual, scheduled, webhook
    config: Dict[str, Any] = {}

@app.post("/api/triggers")
async def create_trigger(trigger: TriggerConfig):
    """Create a workflow trigger"""
    trigger_id = str(uuid.uuid4())
    
    if trigger.trigger_type == "scheduled":
        # Setup cron schedule
        cron_expression = trigger.config.get("cron", "0 0 * * *")  # Default: daily at midnight
        
        def scheduled_execution():
            execution_engine.start_execution(trigger.workflow_id, triggered_by="scheduled")
        
        try:
            scheduler.add_job(
                scheduled_execution,
                CronTrigger.from_crontab(cron_expression),
                id=trigger_id,
                name=f"trigger_{trigger.workflow_id}"
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid cron expression: {str(e)}")
    
    elif trigger.trigger_type == "webhook":
        # Generate webhook token
        webhook_token = str(uuid.uuid4())
        webhook_registry[webhook_token] = trigger.workflow_id
        trigger.config["webhook_token"] = webhook_token
        trigger.config["webhook_url"] = f"/api/webhooks/{webhook_token}"
    
    # Store trigger configuration
    trigger_data = {
        "id": trigger_id,
        "workflow_id": trigger.workflow_id,
        "trigger_type": trigger.trigger_type,
        "config": trigger.config,
        "active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    db['triggers'].insert_one(trigger_data)
    
    return {"message": "Trigger created", "trigger_id": trigger_id, "config": trigger.config}

@app.get("/api/triggers")
async def get_triggers(workflow_id: Optional[str] = None):
    """Get all triggers"""
    query = {}
    if workflow_id:
        query["workflow_id"] = workflow_id
    
    triggers = list(db['triggers'].find(query, {"_id": 0}))
    return {"triggers": triggers, "count": len(triggers)}

@app.delete("/api/triggers/{trigger_id}")
async def delete_trigger(trigger_id: str):
    """Delete a trigger"""
    trigger = db['triggers'].find_one({"id": trigger_id}, {"_id": 0})
    if not trigger:
        raise HTTPException(status_code=404, detail="Trigger not found")
    
    # Remove scheduled job if exists
    if trigger["trigger_type"] == "scheduled":
        try:
            scheduler.remove_job(trigger_id)
        except:
            pass
    
    # Remove webhook if exists
    if trigger["trigger_type"] == "webhook":
        webhook_token = trigger["config"].get("webhook_token")
        if webhook_token and webhook_token in webhook_registry:
            del webhook_registry[webhook_token]
    
    db['triggers'].delete_one({"id": trigger_id})
    return {"message": "Trigger deleted"}

# Webhook Endpoint
@app.post("/api/webhooks/{webhook_token}")
async def webhook_trigger(webhook_token: str, payload: Dict[str, Any] = None):
    """Receive webhook and trigger workflow"""
    workflow_id = webhook_registry.get(webhook_token)
    if not workflow_id:
        raise HTTPException(status_code=404, detail="Invalid webhook token")
    
    try:
        instance_id = execution_engine.start_execution(
            workflow_id,
            triggered_by="webhook",
            input_data={"webhook_payload": payload or {}}
        )
        return {"message": "Workflow triggered", "instance_id": instance_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Expression Evaluator Test Endpoint
@app.post("/api/expressions/evaluate")
async def evaluate_expression(expression: str, variables: Dict[str, Any] = None):
    """Test expression evaluation"""
    evaluator = ExpressionEvaluator()
    result = evaluator.evaluate(expression, variables or {})
    return {"expression": expression, "result": result}

# Auto-layout Algorithm Endpoint
@app.post("/api/workflows/{workflow_id}/auto-layout")
async def auto_layout_workflow(workflow_id: str):
    """Apply auto-layout algorithm to workflow"""
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    nodes = workflow.get("nodes", [])
    edges = workflow.get("edges", [])
    
    # Simple hierarchical layout
    positioned_nodes = _apply_hierarchical_layout(nodes, edges)
    
    # Update workflow
    workflows_collection.update_one(
        {"id": workflow_id},
        {"$set": {"nodes": positioned_nodes, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    return {"message": "Auto-layout applied", "nodes": positioned_nodes}

def _apply_hierarchical_layout(nodes: List[Dict], edges: List[Dict]) -> List[Dict]:
    """Apply simple hierarchical layout"""
    # Build graph structure
    graph = {node["id"]: [] for node in nodes}
    in_degree = {node["id"]: 0 for node in nodes}
    
    for edge in edges:
        graph[edge["source"]].append(edge["target"])
        in_degree[edge["target"]] = in_degree.get(edge["target"], 0) + 1
    
    # Find start nodes (in_degree == 0)
    levels = []
    current_level = [node_id for node_id, degree in in_degree.items() if degree == 0]
    visited = set()
    
    while current_level:
        levels.append(current_level)
        next_level = []
        for node_id in current_level:
            visited.add(node_id)
            for child in graph.get(node_id, []):
                if child not in visited and child not in next_level:
                    # Check if all parents are visited
                    parents_visited = all(
                        edge["source"] in visited
                        for edge in edges
                        if edge["target"] == child
                    )
                    if parents_visited:
                        next_level.append(child)
        current_level = next_level
    
    # Position nodes
    positioned = []
    y_offset = 100
    y_spacing = 150
    
    for level_idx, level in enumerate(levels):
        x_spacing = 200
        x_offset = 100
        
        for node_idx, node_id in enumerate(level):
            node = next((n for n in nodes if n["id"] == node_id), None)
            if node:
                node["position"] = {
                    "x": x_offset + (node_idx * x_spacing),
                    "y": y_offset + (level_idx * y_spacing)
                }
                positioned.append(node)
    
    return positioned


# ==================== PHASE 6: ANALYTICS ENDPOINTS ====================

@app.get("/api/analytics/overview")
async def get_analytics_overview():
    """Get dashboard overview statistics"""
    try:
        # Workflow metrics
        total_workflows = workflows_collection.count_documents({})
        total_instances = workflow_instances_collection.count_documents({})
        completed_instances = workflow_instances_collection.count_documents({"status": "completed"})
        failed_instances = workflow_instances_collection.count_documents({"status": "failed"})
        success_rate = (completed_instances / total_instances * 100) if total_instances > 0 else 0
        
        # Get recent activity (last 7 days)
        week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        recent_instances = workflow_instances_collection.count_documents({
            "started_at": {"$gte": week_ago}
        })
        
        # Task metrics
        total_tasks = tasks_collection.count_documents({})
        pending_tasks = tasks_collection.count_documents({"status": "pending"})
        completed_tasks = tasks_collection.count_documents({"status": "completed"})
        overdue_tasks = tasks_collection.count_documents({
            "due_date": {"$lt": datetime.utcnow().isoformat()},
            "status": {"$nin": ["completed", "cancelled"]}
        })
        
        # SLA compliance
        sla_compliance = ((total_tasks - overdue_tasks) / total_tasks * 100) if total_tasks > 0 else 100
        
        # Approval metrics
        total_approvals = approvals_collection.count_documents({})
        pending_approvals = approvals_collection.count_documents({"status": "pending"})
        
        return {
            "workflows": {
                "total": total_workflows,
                "total_executions": total_instances,
                "completed": completed_instances,
                "failed": failed_instances,
                "success_rate": round(success_rate, 2)
            },
            "recent_activity": {
                "last_7_days": recent_instances
            },
            "tasks": {
                "total": total_tasks,
                "pending": pending_tasks,
                "completed": completed_tasks,
                "overdue": overdue_tasks
            },
            "sla": {
                "compliance_rate": round(sla_compliance, 2)
            },
            "approvals": {
                "total": total_approvals,
                "pending": pending_approvals
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/workflows/throughput")
async def get_workflow_throughput(days: int = 30):
    """Get workflow execution throughput over time"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get all instances in date range
        instances = list(workflow_instances_collection.find({
            "started_at": {"$gte": start_date.isoformat()}
        }, {"_id": 0, "started_at": 1, "status": 1}))
        
        # Group by date
        date_map = {}
        for instance in instances:
            if instance.get("started_at"):
                date_str = instance["started_at"][:10]  # Get YYYY-MM-DD
                if date_str not in date_map:
                    date_map[date_str] = {"date": date_str, "total": 0, "completed": 0, "failed": 0}
                date_map[date_str]["total"] += 1
                if instance.get("status") == "completed":
                    date_map[date_str]["completed"] += 1
                elif instance.get("status") == "failed":
                    date_map[date_str]["failed"] += 1
        
        # Convert to sorted list
        data = sorted(date_map.values(), key=lambda x: x["date"])
        
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/workflows/execution-time")
async def get_workflow_execution_time():
    """Get average execution time per workflow"""
    try:
        # Get completed instances with execution time
        instances = list(workflow_instances_collection.find({
            "status": "completed",
            "started_at": {"$exists": True},
            "completed_at": {"$exists": True}
        }, {"_id": 0, "workflow_id": 1, "started_at": 1, "completed_at": 1}))
        
        # Calculate execution time per workflow
        workflow_times = {}
        for instance in instances:
            workflow_id = instance.get("workflow_id")
            if not workflow_id:
                continue
                
            try:
                start = datetime.fromisoformat(instance["started_at"])
                end = datetime.fromisoformat(instance["completed_at"])
                duration = (end - start).total_seconds()
                
                if workflow_id not in workflow_times:
                    workflow_times[workflow_id] = {"times": [], "workflow_id": workflow_id}
                workflow_times[workflow_id]["times"].append(duration)
            except:
                continue
        
        # Calculate averages and get workflow names
        data = []
        for workflow_id, info in workflow_times.items():
            workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0, "name": 1})
            avg_time = sum(info["times"]) / len(info["times"]) if info["times"] else 0
            data.append({
                "workflow_id": workflow_id,
                "workflow_name": workflow.get("name", "Unknown") if workflow else "Unknown",
                "avg_execution_time": round(avg_time, 2),
                "executions": len(info["times"]),
                "min_time": round(min(info["times"]), 2) if info["times"] else 0,
                "max_time": round(max(info["times"]), 2) if info["times"] else 0
            })
        
        # Sort by average execution time descending
        data.sort(key=lambda x: x["avg_execution_time"], reverse=True)
        
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/workflows/success-rate")
async def get_workflow_success_rate():
    """Get success vs failure rate"""
    try:
        total = workflow_instances_collection.count_documents({})
        completed = workflow_instances_collection.count_documents({"status": "completed"})
        failed = workflow_instances_collection.count_documents({"status": "failed"})
        running = workflow_instances_collection.count_documents({"status": "running"})
        paused = workflow_instances_collection.count_documents({"status": "paused"})
        
        return {
            "data": [
                {"name": "Completed", "value": completed, "percentage": round((completed/total*100) if total > 0 else 0, 2)},
                {"name": "Failed", "value": failed, "percentage": round((failed/total*100) if total > 0 else 0, 2)},
                {"name": "Running", "value": running, "percentage": round((running/total*100) if total > 0 else 0, 2)},
                {"name": "Paused", "value": paused, "percentage": round((paused/total*100) if total > 0 else 0, 2)}
            ],
            "total": total
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/workflows/popularity")
async def get_workflow_popularity():
    """Get most executed workflows"""
    try:
        # Count executions per workflow
        instances = list(workflow_instances_collection.find({}, {"_id": 0, "workflow_id": 1}))
        
        workflow_counts = {}
        for instance in instances:
            wf_id = instance.get("workflow_id")
            if wf_id:
                workflow_counts[wf_id] = workflow_counts.get(wf_id, 0) + 1
        
        # Get workflow names and build data
        data = []
        for workflow_id, count in workflow_counts.items():
            workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0, "name": 1})
            data.append({
                "workflow_id": workflow_id,
                "workflow_name": workflow.get("name", "Unknown") if workflow else "Unknown",
                "executions": count
            })
        
        # Sort by executions descending
        data.sort(key=lambda x: x["executions"], reverse=True)
        
        return {"data": data[:10]}  # Top 10
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/sla/compliance")
async def get_sla_compliance():
    """Get SLA compliance metrics"""
    try:
        total_tasks = tasks_collection.count_documents({})
        
        # Tasks with SLA
        tasks_with_sla = tasks_collection.count_documents({"sla_hours": {"$exists": True, "$ne": None}})
        
        # Overdue tasks
        overdue = tasks_collection.count_documents({
            "due_date": {"$lt": datetime.utcnow().isoformat()},
            "status": {"$nin": ["completed", "cancelled"]}
        })
        
        # At risk (due within 24h)
        at_risk_date = (datetime.utcnow() + timedelta(hours=24)).isoformat()
        at_risk = tasks_collection.count_documents({
            "due_date": {"$lt": at_risk_date, "$gte": datetime.utcnow().isoformat()},
            "status": {"$nin": ["completed", "cancelled"]}
        })
        
        # Completed on time
        completed_on_time = 0
        completed_late = 0
        completed_tasks = list(tasks_collection.find({
            "status": "completed",
            "due_date": {"$exists": True}
        }, {"_id": 0, "due_date": 1, "updated_at": 1}))
        
        for task in completed_tasks:
            try:
                due = datetime.fromisoformat(task["due_date"])
                completed = datetime.fromisoformat(task["updated_at"])
                if completed <= due:
                    completed_on_time += 1
                else:
                    completed_late += 1
            except:
                continue
        
        compliance_rate = ((completed_on_time) / (completed_on_time + completed_late) * 100) if (completed_on_time + completed_late) > 0 else 100
        
        return {
            "total_tasks": total_tasks,
            "tasks_with_sla": tasks_with_sla,
            "overdue": overdue,
            "at_risk": at_risk,
            "completed_on_time": completed_on_time,
            "completed_late": completed_late,
            "compliance_rate": round(compliance_rate, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/sla/trends")
async def get_sla_trends(days: int = 30):
    """Get SLA compliance trends over time"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get completed tasks in date range
        tasks = list(tasks_collection.find({
            "status": "completed",
            "updated_at": {"$gte": start_date.isoformat()},
            "due_date": {"$exists": True}
        }, {"_id": 0, "updated_at": 1, "due_date": 1}))
        
        # Group by date
        date_map = {}
        for task in tasks:
            try:
                date_str = task["updated_at"][:10]
                due = datetime.fromisoformat(task["due_date"])
                completed = datetime.fromisoformat(task["updated_at"])
                
                if date_str not in date_map:
                    date_map[date_str] = {"date": date_str, "on_time": 0, "late": 0}
                
                if completed <= due:
                    date_map[date_str]["on_time"] += 1
                else:
                    date_map[date_str]["late"] += 1
            except:
                continue
        
        # Calculate compliance percentage per day
        data = []
        for date_str, counts in date_map.items():
            total = counts["on_time"] + counts["late"]
            compliance = (counts["on_time"] / total * 100) if total > 0 else 100
            data.append({
                "date": date_str,
                "compliance": round(compliance, 2),
                "on_time": counts["on_time"],
                "late": counts["late"]
            })
        
        data.sort(key=lambda x: x["date"])
        
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/nodes/performance")
async def get_node_performance():
    """Get node-level performance statistics"""
    try:
        # Get all workflow instances with execution data
        instances = list(workflow_instances_collection.find({
            "execution_log": {"$exists": True}
        }, {"_id": 0, "execution_log": 1, "workflow_id": 1}))
        
        node_stats = {}
        
        for instance in instances:
            exec_log = instance.get("execution_log", [])
            for entry in exec_log:
                node_id = entry.get("node_id")
                node_type = entry.get("node_type")
                status = entry.get("status")
                
                if not node_id:
                    continue
                
                if node_id not in node_stats:
                    node_stats[node_id] = {
                        "node_id": node_id,
                        "node_type": node_type or "unknown",
                        "executions": 0,
                        "successes": 0,
                        "failures": 0,
                        "total_time": 0,
                        "times": []
                    }
                
                node_stats[node_id]["executions"] += 1
                
                if status == "completed":
                    node_stats[node_id]["successes"] += 1
                elif status == "failed":
                    node_stats[node_id]["failures"] += 1
                
                # Calculate execution time if available
                if entry.get("started_at") and entry.get("completed_at"):
                    try:
                        start = datetime.fromisoformat(entry["started_at"])
                        end = datetime.fromisoformat(entry["completed_at"])
                        duration = (end - start).total_seconds()
                        node_stats[node_id]["times"].append(duration)
                        node_stats[node_id]["total_time"] += duration
                    except:
                        pass
        
        # Calculate averages
        data = []
        for node_id, stats in node_stats.items():
            avg_time = (stats["total_time"] / len(stats["times"])) if stats["times"] else 0
            failure_rate = (stats["failures"] / stats["executions"] * 100) if stats["executions"] > 0 else 0
            
            data.append({
                "node_id": node_id,
                "node_type": stats["node_type"],
                "executions": stats["executions"],
                "avg_execution_time": round(avg_time, 2),
                "failure_rate": round(failure_rate, 2),
                "successes": stats["successes"],
                "failures": stats["failures"]
            })
        
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/nodes/bottlenecks")
async def get_node_bottlenecks(limit: int = 10):
    """Identify bottleneck nodes (slowest/most problematic)"""
    try:
        # Get node performance data
        perf_response = await get_node_performance()
        all_nodes = perf_response["data"]
        
        # Sort by execution time (descending) - these are bottlenecks
        slowest = sorted(all_nodes, key=lambda x: x["avg_execution_time"], reverse=True)[:limit]
        
        # Sort by failure rate (descending) - these are problematic
        most_failures = sorted(all_nodes, key=lambda x: x["failure_rate"], reverse=True)[:limit]
        
        return {
            "slowest_nodes": slowest,
            "highest_failure_nodes": most_failures
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/users/productivity")
async def get_user_productivity():
    """Get user productivity statistics"""
    try:
        # Get all users
        users = list(db['users'].find({}, {"_id": 0, "email": 1, "name": 1}))
        
        user_stats = {}
        for user in users:
            email = user.get("email")
            if not email:
                continue
            
            # Count tasks
            total_tasks = tasks_collection.count_documents({"assigned_to": email})
            completed = tasks_collection.count_documents({"assigned_to": email, "status": "completed"})
            pending = tasks_collection.count_documents({"assigned_to": email, "status": "pending"})
            
            # Calculate average completion time
            completed_tasks = list(tasks_collection.find({
                "assigned_to": email,
                "status": "completed",
                "created_at": {"$exists": True},
                "updated_at": {"$exists": True}
            }, {"_id": 0, "created_at": 1, "updated_at": 1}))
            
            completion_times = []
            for task in completed_tasks:
                try:
                    created = datetime.fromisoformat(task["created_at"])
                    updated = datetime.fromisoformat(task["updated_at"])
                    duration = (updated - created).total_seconds() / 3600  # hours
                    completion_times.append(duration)
                except:
                    continue
            
            avg_completion = sum(completion_times) / len(completion_times) if completion_times else 0
            
            user_stats[email] = {
                "email": email,
                "name": user.get("name", email),
                "total_tasks": total_tasks,
                "completed": completed,
                "pending": pending,
                "avg_completion_hours": round(avg_completion, 2),
                "completion_rate": round((completed / total_tasks * 100) if total_tasks > 0 else 0, 2)
            }
        
        # Convert to list and sort by completed tasks
        data = sorted(user_stats.values(), key=lambda x: x["completed"], reverse=True)
        
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/users/workload")
async def get_user_workload():
    """Get current workload distribution"""
    try:
        # Get all users
        users = list(db['users'].find({}, {"_id": 0, "email": 1, "name": 1}))
        
        workload_data = []
        for user in users:
            email = user.get("email")
            if not email:
                continue
            
            # Count pending tasks
            pending = tasks_collection.count_documents({
                "assigned_to": email,
                "status": {"$in": ["pending", "in_progress"]}
            })
            
            workload_data.append({
                "email": email,
                "name": user.get("name", email),
                "pending_tasks": pending
            })
        
        # Sort by pending tasks
        workload_data.sort(key=lambda x: x["pending_tasks"], reverse=True)
        
        return {"data": workload_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================================================================
# PHASE 7: IMPORT/EXPORT, VERSION CONTROL, SEARCH & MANAGEMENT
# ===================================================================

# -------------------------------
# Import/Export Endpoints
# -------------------------------

@app.post("/api/workflows/export")
async def export_workflows(workflow_ids: Optional[List[str]] = None):
    """Export workflows to JSON format"""
    try:
        query = {}
        if workflow_ids:
            query = {"id": {"$in": workflow_ids}}
        
        workflows = list(workflows_collection.find(query))
        
        # Remove MongoDB _id field
        for workflow in workflows:
            if '_id' in workflow:
                del workflow['_id']
        
        return {
            "workflows": workflows,
            "exported_at": datetime.utcnow().isoformat(),
            "count": len(workflows)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflows/import")
async def import_workflows(workflows_data: Dict[str, Any]):
    """Import workflows from JSON"""
    try:
        workflows = workflows_data.get("workflows", [])
        imported = []
        errors = []
        
        for workflow in workflows:
            try:
                # Generate new ID
                workflow_id = str(uuid.uuid4())
                workflow['id'] = workflow_id
                workflow['created_at'] = datetime.utcnow().isoformat()
                workflow['updated_at'] = datetime.utcnow().isoformat()
                workflow['status'] = 'draft'  # Imported workflows start as draft
                
                # Insert to database
                workflows_collection.insert_one(workflow)
                imported.append(workflow_id)
                
                # Audit log
                audit_logs_collection.insert_one({
                    "id": str(uuid.uuid4()),
                    "entity_type": "workflow",
                    "entity_id": workflow_id,
                    "action": "imported",
                    "user": "system",
                    "timestamp": datetime.utcnow().isoformat(),
                    "details": {"name": workflow.get("name", "Untitled")}
                })
            except Exception as e:
                errors.append({
                    "workflow": workflow.get("name", "Unknown"),
                    "error": str(e)
                })
        
        return {
            "imported_count": len(imported),
            "imported_ids": imported,
            "errors": errors,
            "success": len(imported) > 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------
# Version Control Endpoints
# -------------------------------

@app.post("/api/workflows/{workflow_id}/versions")
async def create_workflow_version(workflow_id: str):
    """Create a new version of a workflow"""
    try:
        workflow = workflows_collection.find_one({"id": workflow_id})
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Create version snapshot
        version_id = str(uuid.uuid4())
        version_data = {
            "id": version_id,
            "workflow_id": workflow_id,
            "version_number": workflow.get("version", 1),
            "name": workflow.get("name"),
            "description": workflow.get("description"),
            "nodes": workflow.get("nodes", []),
            "edges": workflow.get("edges", []),
            "status": workflow.get("status"),
            "tags": workflow.get("tags", []),
            "created_at": datetime.utcnow().isoformat(),
            "created_by": "system"
        }
        
        # Store in versions collection (create if doesn't exist)
        versions_collection = db['workflow_versions']
        versions_collection.insert_one(version_data)
        
        # Increment workflow version
        workflows_collection.update_one(
            {"id": workflow_id},
            {"$inc": {"version": 1}, "$set": {"updated_at": datetime.utcnow().isoformat()}}
        )
        
        # Audit log
        audit_logs_collection.insert_one({
            "id": str(uuid.uuid4()),
            "entity_type": "workflow",
            "entity_id": workflow_id,
            "action": "version_created",
            "user": "system",
            "timestamp": datetime.utcnow().isoformat(),
            "details": {"version": version_data["version_number"]}
        })
        
        return {
            "version_id": version_id,
            "version_number": version_data["version_number"],
            "message": "Version created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workflows/{workflow_id}/versions")
async def get_workflow_versions(workflow_id: str):
    """Get all versions of a workflow"""
    try:
        versions_collection = db['workflow_versions']
        versions = list(versions_collection.find({"workflow_id": workflow_id}))
        
        # Remove MongoDB _id
        for version in versions:
            if '_id' in version:
                del version['_id']
        
        # Sort by version number descending
        versions.sort(key=lambda x: x.get("version_number", 0), reverse=True)
        
        return {"versions": versions, "count": len(versions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflows/{workflow_id}/rollback/{version_id}")
async def rollback_workflow(workflow_id: str, version_id: str):
    """Rollback workflow to a specific version"""
    try:
        versions_collection = db['workflow_versions']
        version = versions_collection.find_one({"id": version_id, "workflow_id": workflow_id})
        
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        
        # Update workflow with version data
        update_data = {
            "nodes": version.get("nodes", []),
            "edges": version.get("edges", []),
            "description": version.get("description", ""),
            "tags": version.get("tags", []),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        workflows_collection.update_one(
            {"id": workflow_id},
            {"$set": update_data}
        )
        
        # Audit log
        audit_logs_collection.insert_one({
            "id": str(uuid.uuid4()),
            "entity_type": "workflow",
            "entity_id": workflow_id,
            "action": "rolled_back",
            "user": "system",
            "timestamp": datetime.utcnow().isoformat(),
            "details": {"version": version.get("version_number")}
        })
        
        return {"message": "Workflow rolled back successfully", "version": version.get("version_number")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------
# Bulk Operations Endpoints
# -------------------------------

@app.post("/api/workflows/bulk-delete")
async def bulk_delete_workflows(workflow_ids: List[str]):
    """Delete multiple workflows at once"""
    try:
        deleted = []
        errors = []
        
        for workflow_id in workflow_ids:
            try:
                result = workflows_collection.delete_one({"id": workflow_id})
                if result.deleted_count > 0:
                    deleted.append(workflow_id)
                    
                    # Audit log
                    audit_logs_collection.insert_one({
                        "id": str(uuid.uuid4()),
                        "entity_type": "workflow",
                        "entity_id": workflow_id,
                        "action": "deleted",
                        "user": "system",
                        "timestamp": datetime.utcnow().isoformat(),
                        "details": {}
                    })
                else:
                    errors.append({"id": workflow_id, "error": "Not found"})
            except Exception as e:
                errors.append({"id": workflow_id, "error": str(e)})
        
        return {
            "deleted_count": len(deleted),
            "deleted_ids": deleted,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflows/bulk-update-status")
async def bulk_update_status(workflow_ids: List[str], status: str):
    """Update status of multiple workflows"""
    try:
        updated = []
        
        for workflow_id in workflow_ids:
            result = workflows_collection.update_one(
                {"id": workflow_id},
                {"$set": {"status": status, "updated_at": datetime.utcnow().isoformat()}}
            )
            if result.modified_count > 0:
                updated.append(workflow_id)
        
        return {
            "updated_count": len(updated),
            "updated_ids": updated,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflows/{workflow_id}/duplicate")
async def duplicate_workflow(workflow_id: str):
    """Duplicate a workflow"""
    try:
        workflow = workflows_collection.find_one({"id": workflow_id})
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Create duplicate
        new_id = str(uuid.uuid4())
        duplicate = {
            "id": new_id,
            "name": f"{workflow.get('name', 'Untitled')} (Copy)",
            "description": workflow.get("description", ""),
            "nodes": workflow.get("nodes", []),
            "edges": workflow.get("edges", []),
            "status": "draft",
            "version": 1,
            "tags": workflow.get("tags", []),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        workflows_collection.insert_one(duplicate)
        
        # Audit log
        audit_logs_collection.insert_one({
            "id": str(uuid.uuid4()),
            "entity_type": "workflow",
            "entity_id": new_id,
            "action": "duplicated",
            "user": "system",
            "timestamp": datetime.utcnow().isoformat(),
            "details": {"source_id": workflow_id}
        })
        
        return {
            "id": new_id,
            "message": "Workflow duplicated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------
# Global Search Endpoint
# -------------------------------

@app.get("/api/search")
async def global_search(query: str, entity_types: Optional[str] = "all"):
    """Global search across workflows, forms, tasks"""
    try:
        results = {
            "workflows": [],
            "forms": [],
            "tasks": [],
            "approvals": []
        }
        
        search_types = entity_types.split(",") if entity_types != "all" else ["workflows", "forms", "tasks", "approvals"]
        
        # Search workflows
        if "workflows" in search_types:
            workflows = list(workflows_collection.find({
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"tags": {"$regex": query, "$options": "i"}}
                ]
            }).limit(10))
            
            for wf in workflows:
                if '_id' in wf:
                    del wf['_id']
                results["workflows"].append(wf)
        
        # Search forms
        if "forms" in search_types:
            forms = list(forms_collection.find({
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}}
                ]
            }).limit(10))
            
            for form in forms:
                if '_id' in form:
                    del form['_id']
                results["forms"].append(form)
        
        # Search tasks
        if "tasks" in search_types:
            tasks = list(tasks_collection.find({
                "$or": [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}}
                ]
            }).limit(10))
            
            for task in tasks:
                if '_id' in task:
                    del task['_id']
                results["tasks"].append(task)
        
        # Search approvals
        if "approvals" in search_types:
            approvals = list(approvals_collection.find({
                "$or": [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}}
                ]
            }).limit(10))
            
            for approval in approvals:
                if '_id' in approval:
                    del approval['_id']
                results["approvals"].append(approval)
        
        total_results = sum(len(results[key]) for key in results)
        
        return {
            "query": query,
            "results": results,
            "total": total_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== PHASE 8 SPRINT 3: VARIABLE MANAGEMENT ENDPOINTS ==========

@app.get("/api/instances/{instance_id}/variables")
async def get_instance_variables(
    instance_id: str,
    scope: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all variables for a workflow instance with optional filters"""
    try:
        # Parse scope filter
        scope_filter = None
        if scope:
            try:
                scope_filter = VariableScope(scope)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid scope: {scope}")
        
        # Parse type filter
        type_filter = None
        if type:
            try:
                type_filter = VariableType(type)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid type: {type}")
        
        # Get variables
        variables = variable_manager.get_instance_variables(
            instance_id,
            scope=scope_filter,
            variable_type=type_filter
        )
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            variables = [
                v for v in variables
                if search_lower in v["name"].lower() or search_lower in str(v["value"]).lower()
            ]
        
        return {
            "instance_id": instance_id,
            "variables": variables,
            "count": len(variables)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/instances/{instance_id}/variables/{variable_name}/history")
async def get_variable_history(instance_id: str, variable_name: str):
    """Get change history for a specific variable"""
    try:
        history = variable_manager.get_variable_history(instance_id, variable_name)
        
        return {
            "instance_id": instance_id,
            "variable_name": variable_name,
            "history": history,
            "count": len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class WatchVariableRequest(BaseModel):
    variable_name: str


@app.post("/api/instances/{instance_id}/variables/watch")
async def add_to_watch_list(instance_id: str, data: WatchVariableRequest):
    """Add a variable to the watch list for debugging"""
    try:
        variable_manager.add_to_watch_list(instance_id, data.variable_name)
        
        return {
            "message": f"Variable '{data.variable_name}' added to watch list",
            "instance_id": instance_id,
            "variable_name": data.variable_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/instances/{instance_id}/variables/watch/{variable_name}")
async def remove_from_watch_list(instance_id: str, variable_name: str):
    """Remove a variable from the watch list"""
    try:
        variable_manager.remove_from_watch_list(instance_id, variable_name)
        
        return {
            "message": f"Variable '{variable_name}' removed from watch list",
            "instance_id": instance_id,
            "variable_name": variable_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/instances/{instance_id}/variables/watch")
async def get_watch_list(instance_id: str):
    """Get the watch list for an instance"""
    try:
        watch_list = variable_manager.get_variable_watch_list(instance_id)
        
        # Get current values for watched variables
        all_variables = variable_manager.get_instance_variables(instance_id)
        watched_variables = [
            v for v in all_variables
            if v["name"] in watch_list
        ]
        
        return {
            "instance_id": instance_id,
            "watch_list": watch_list,
            "watched_variables": watched_variables,
            "count": len(watched_variables)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/global-variables")
async def get_global_variables():
    """Get all global variables"""
    try:
        global_vars = variable_manager.get_global_variables()
        
        return {
            "global_variables": global_vars,
            "count": len(global_vars)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class GlobalVariableRequest(BaseModel):
    name: str
    value: Any
    description: Optional[str] = None


@app.post("/api/global-variables")
async def set_global_variable(data: GlobalVariableRequest):
    """Set a global variable"""
    try:
        variable_manager.set_global_variable(
            data.name,
            data.value,
            data.description
        )
        
        return {
            "message": f"Global variable '{data.name}' set successfully",
            "name": data.name,
            "value": data.value
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class VariableTypeConversionRequest(BaseModel):
    value: Any
    target_type: str


@app.post("/api/variables/convert-type")
async def convert_variable_type(data: VariableTypeConversionRequest):
    """Convert a value to a target type"""
    try:
        # Parse target type
        try:
            target_type = VariableType(data.target_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid target type: {data.target_type}")
        
        # Convert
        converted_value = variable_manager.convert_type(data.value, target_type)
        
        return {
            "original_value": data.value,
            "target_type": data.target_type,
            "converted_value": converted_value,
            "success": True
        }
    except Exception as e:
        return {
            "original_value": data.value,
            "target_type": data.target_type,
            "converted_value": data.value,
            "success": False,
            "error": str(e)
        }


# ========== PHASE 8 SPRINT 4: VISUAL API CONNECTOR BUILDER ==========

# API Connectors Collection
api_connectors_collection = db['api_connectors']

class APIConnectorConfig(BaseModel):
    """API Connector configuration model"""
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    base_url: str
    auth_type: str = "none"  # none, api_key, basic, oauth, bearer
    auth_config: Optional[Dict[str, Any]] = {}
    headers: Optional[Dict[str, str]] = {}
    endpoints: List[Dict[str, Any]] = []  # List of endpoint configurations
    tags: List[str] = []
    is_template: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class APITestRequest(BaseModel):
    """API test request model"""
    method: str = "GET"
    url: str
    headers: Optional[Dict[str, str]] = {}
    body: Optional[Dict[str, Any]] = None
    auth_type: str = "none"
    auth_config: Optional[Dict[str, Any]] = {}

@app.get("/api/connectors")
async def get_api_connectors(is_template: Optional[bool] = None):
    """Get all API connectors, optionally filter by template status"""
    query = {}
    if is_template is not None:
        query["is_template"] = is_template
    
    connectors = list(api_connectors_collection.find(query, {"_id": 0}))
    return {"connectors": connectors, "count": len(connectors)}

@app.get("/api/connectors/{connector_id}")
async def get_api_connector(connector_id: str):
    """Get a specific API connector"""
    connector = api_connectors_collection.find_one({"id": connector_id}, {"_id": 0})
    if not connector:
        raise HTTPException(status_code=404, detail="API connector not found")
    return connector

@app.post("/api/connectors")
async def create_api_connector(connector: APIConnectorConfig):
    """Create a new API connector"""
    connector_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    connector_dict = connector.dict()
    connector_dict["id"] = connector_id
    connector_dict["created_at"] = now
    connector_dict["updated_at"] = now
    
    api_connectors_collection.insert_one(connector_dict)
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "api_connector",
        "entity_id": connector_id,
        "action": "created",
        "timestamp": now
    })
    
    return {"message": "API connector created successfully", "id": connector_id}

@app.put("/api/connectors/{connector_id}")
async def update_api_connector(connector_id: str, connector: APIConnectorConfig):
    """Update an existing API connector"""
    existing = api_connectors_collection.find_one({"id": connector_id})
    if not existing:
        raise HTTPException(status_code=404, detail="API connector not found")
    
    now = datetime.utcnow().isoformat()
    connector_dict = connector.dict()
    connector_dict["id"] = connector_id
    connector_dict["created_at"] = existing.get("created_at")
    connector_dict["updated_at"] = now
    
    api_connectors_collection.replace_one({"id": connector_id}, connector_dict)
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "api_connector",
        "entity_id": connector_id,
        "action": "updated",
        "timestamp": now
    })
    
    return {"message": "API connector updated successfully"}

@app.delete("/api/connectors/{connector_id}")
async def delete_api_connector(connector_id: str):
    """Delete an API connector"""
    result = api_connectors_collection.delete_one({"id": connector_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="API connector not found")
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "api_connector",
        "entity_id": connector_id,
        "action": "deleted",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"message": "API connector deleted successfully"}

@app.post("/api/connectors/test")
async def test_api_connector(request: APITestRequest):
    """Test an API call with the provided configuration"""
    import httpx
    
    try:
        # Prepare headers
        headers = request.headers.copy() if request.headers else {}
        
        # Add authentication
        if request.auth_type == "api_key":
            key_name = request.auth_config.get("key_name", "X-API-Key")
            key_value = request.auth_config.get("key_value", "")
            headers[key_name] = key_value
        elif request.auth_type == "bearer":
            token = request.auth_config.get("token", "")
            headers["Authorization"] = f"Bearer {token}"
        elif request.auth_type == "basic":
            import base64
            username = request.auth_config.get("username", "")
            password = request.auth_config.get("password", "")
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers["Authorization"] = f"Basic {credentials}"
        
        # Make request
        async with httpx.AsyncClient(timeout=30.0) as client:
            if request.method.upper() == "GET":
                response = await client.get(request.url, headers=headers)
            elif request.method.upper() == "POST":
                response = await client.post(request.url, headers=headers, json=request.body)
            elif request.method.upper() == "PUT":
                response = await client.put(request.url, headers=headers, json=request.body)
            elif request.method.upper() == "DELETE":
                response = await client.delete(request.url, headers=headers)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported HTTP method: {request.method}")
        
        # Parse response
        try:
            response_data = response.json()
        except:
            response_data = {"text": response.text}
        
        return {
            "success": response.is_success,
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "data": response_data,
            "elapsed_ms": response.elapsed.total_seconds() * 1000
        }
    
    except httpx.TimeoutException:
        return {
            "success": False,
            "error": "Request timeout after 30 seconds",
            "status_code": 0
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "status_code": 0
        }

@app.get("/api/connectors/templates/library")
async def get_connector_templates_library():
    """Get pre-built API connector templates (legacy format)"""
    templates = [
        {
            "id": "template-rest-api",
            "name": "Generic REST API",
            "description": "Standard REST API connector with JSON support",
            "base_url": "https://api.example.com",
            "auth_type": "api_key",
            "auth_config": {"key_name": "X-API-Key", "key_value": ""},
            "headers": {"Content-Type": "application/json"},
            "endpoints": [
                {"method": "GET", "path": "/resource", "description": "Get resource"},
                {"method": "POST", "path": "/resource", "description": "Create resource"},
            ],
            "tags": ["template", "rest"]
        },
        {
            "id": "template-webhook",
            "name": "Webhook Receiver",
            "description": "Configure webhook endpoints to receive data",
            "base_url": "https://your-domain.com/webhooks",
            "auth_type": "bearer",
            "auth_config": {"token": ""},
            "headers": {"Content-Type": "application/json"},
            "endpoints": [
                {"method": "POST", "path": "/receive", "description": "Receive webhook data"},
            ],
            "tags": ["template", "webhook"]
        },
        {
            "id": "template-oauth",
            "name": "OAuth 2.0 API",
            "description": "API using OAuth 2.0 authentication",
            "base_url": "https://api.oauth-service.com",
            "auth_type": "oauth",
            "auth_config": {
                "client_id": "",
                "client_secret": "",
                "token_url": "https://api.oauth-service.com/oauth/token",
                "scope": ""
            },
            "headers": {"Content-Type": "application/json"},
            "endpoints": [
                {"method": "GET", "path": "/user/profile", "description": "Get user profile"},
            ],
            "tags": ["template", "oauth"]
        },
        {
            "id": "template-graphql",
            "name": "GraphQL API",
            "description": "GraphQL API connector",
            "base_url": "https://api.example.com/graphql",
            "auth_type": "bearer",
            "auth_config": {"token": ""},
            "headers": {"Content-Type": "application/json"},
            "endpoints": [
                {"method": "POST", "path": "", "description": "GraphQL query/mutation"},
            ],
            "tags": ["template", "graphql"]
        },
    ]
    
    return {"templates": templates, "count": len(templates)}


# ========== PHASE 8 SPRINT 4: ADVANCED DEBUGGING FEATURES ==========

class BreakpointConfig(BaseModel):
    """Breakpoint configuration"""
    node_id: str
    enabled: bool = True
    condition: Optional[str] = None  # Optional condition expression

class DebugStepRequest(BaseModel):
    """Debug step execution request"""
    mode: str = "step_over"  # step_over, step_into, continue

@app.get("/api/instances/{instance_id}/debug/breakpoints")
async def get_breakpoints(instance_id: str):
    """Get all breakpoints for a workflow instance"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    breakpoints = instance.get("debug_breakpoints", [])
    return {"instance_id": instance_id, "breakpoints": breakpoints, "count": len(breakpoints)}

@app.post("/api/instances/{instance_id}/debug/breakpoint")
async def add_breakpoint(instance_id: str, config: BreakpointConfig):
    """Add a breakpoint to a workflow instance"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    breakpoints = instance.get("debug_breakpoints", [])
    
    # Check if breakpoint already exists
    existing = next((bp for bp in breakpoints if bp.get("node_id") == config.node_id), None)
    if existing:
        # Update existing breakpoint
        existing["enabled"] = config.enabled
        existing["condition"] = config.condition
    else:
        # Add new breakpoint
        breakpoints.append({
            "node_id": config.node_id,
            "enabled": config.enabled,
            "condition": config.condition,
            "added_at": datetime.utcnow().isoformat()
        })
    
    workflow_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {"debug_breakpoints": breakpoints}}
    )
    
    return {"message": "Breakpoint added/updated successfully", "breakpoints": breakpoints}

@app.delete("/api/instances/{instance_id}/debug/breakpoint/{node_id}")
async def remove_breakpoint(instance_id: str, node_id: str):
    """Remove a breakpoint from a workflow instance"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    breakpoints = instance.get("debug_breakpoints", [])
    breakpoints = [bp for bp in breakpoints if bp.get("node_id") != node_id]
    
    workflow_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {"debug_breakpoints": breakpoints}}
    )
    
    return {"message": "Breakpoint removed successfully"}

@app.post("/api/instances/{instance_id}/debug/step")
async def debug_step_execution(instance_id: str, request: DebugStepRequest):
    """Execute workflow in step-by-step debug mode"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    current_node = instance.get("current_node_id")
    debug_mode = instance.get("debug_mode", False)
    
    if not debug_mode:
        # Enable debug mode
        workflow_instances_collection.update_one(
            {"id": instance_id},
            {"$set": {"debug_mode": True, "debug_step_mode": request.mode}}
        )
    
    # Execute single step
    try:
        # Get workflow
        workflow = workflows_collection.find_one({"id": instance["workflow_id"]}, {"_id": 0})
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Execute one node
        result = execution_engine.execute_single_node(instance_id, current_node, workflow)
        
        return {
            "message": "Step executed successfully",
            "current_node": current_node,
            "next_node": result.get("next_node"),
            "status": result.get("status"),
            "variables": result.get("variables", {})
        }
    except Exception as e:
        return {
            "message": "Step execution failed",
            "error": str(e)
        }

@app.get("/api/instances/{instance_id}/debug/logs")
async def get_debug_logs(instance_id: str, limit: int = 100):
    """Get detailed execution logs for debugging"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    # Get execution logs from audit logs
    logs = list(
        audit_logs_collection.find(
            {"entity_id": instance_id, "entity_type": "workflow_instance"},
            {"_id": 0}
        )
        .sort("timestamp", -1)
        .limit(limit)
    )
    
    # Get node execution details
    execution_history = instance.get("execution_history", [])
    
    return {
        "instance_id": instance_id,
        "logs": logs,
        "execution_history": execution_history,
        "log_count": len(logs)
    }

@app.get("/api/instances/{instance_id}/debug/performance")
async def get_performance_profile(instance_id: str):
    """Get performance profiling data for workflow execution"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    execution_history = instance.get("execution_history", [])
    
    # Calculate node performance metrics
    node_performance = {}
    total_execution_time = 0
    
    for entry in execution_history:
        node_id = entry.get("node_id")
        started_at = entry.get("started_at")
        completed_at = entry.get("completed_at")
        
        if started_at and completed_at:
            try:
                start = datetime.fromisoformat(started_at)
                end = datetime.fromisoformat(completed_at)
                duration = (end - start).total_seconds()
                total_execution_time += duration
                
                if node_id not in node_performance:
                    node_performance[node_id] = {
                        "node_id": node_id,
                        "executions": 0,
                        "total_time": 0,
                        "avg_time": 0,
                        "min_time": float('inf'),
                        "max_time": 0,
                        "errors": 0
                    }
                
                perf = node_performance[node_id]
                perf["executions"] += 1
                perf["total_time"] += duration
                perf["min_time"] = min(perf["min_time"], duration)
                perf["max_time"] = max(perf["max_time"], duration)
                
                if entry.get("status") == "failed":
                    perf["errors"] += 1
            except:
                continue
    
    # Calculate averages and percentages
    for node_id, perf in node_performance.items():
        if perf["executions"] > 0:
            perf["avg_time"] = round(perf["total_time"] / perf["executions"], 3)
        if total_execution_time > 0:
            perf["percentage"] = round((perf["total_time"] / total_execution_time) * 100, 2)
        else:
            perf["percentage"] = 0
    
    # Sort by total time descending (bottlenecks first)
    performance_list = sorted(
        node_performance.values(),
        key=lambda x: x["total_time"],
        reverse=True
    )
    
    return {
        "instance_id": instance_id,
        "total_execution_time": round(total_execution_time, 3),
        "node_performance": performance_list,
        "bottlenecks": performance_list[:5],  # Top 5 slowest nodes
        "total_nodes_executed": len(node_performance)
    }

@app.get("/api/instances/{instance_id}/debug/timeline")
async def get_execution_timeline(instance_id: str):
    """Get detailed execution timeline with node-by-node progression"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    execution_history = instance.get("execution_history", [])
    workflow = workflows_collection.find_one({"id": instance["workflow_id"]}, {"_id": 0})
    
    # Build timeline with node details
    timeline = []
    for entry in execution_history:
        node_id = entry.get("node_id")
        
        # Find node details
        node = None
        if workflow:
            nodes = workflow.get("nodes", [])
            node = next((n for n in nodes if n.get("id") == node_id), None)
        
        timeline_entry = {
            "node_id": node_id,
            "node_type": node.get("type") if node else "unknown",
            "node_label": node.get("data", {}).get("label") if node else node_id,
            "started_at": entry.get("started_at"),
            "completed_at": entry.get("completed_at"),
            "status": entry.get("status"),
            "output": entry.get("output"),
            "error": entry.get("error")
        }
        
        # Calculate duration
        if entry.get("started_at") and entry.get("completed_at"):
            try:
                start = datetime.fromisoformat(entry["started_at"])
                end = datetime.fromisoformat(entry["completed_at"])
                timeline_entry["duration_seconds"] = round((end - start).total_seconds(), 3)
            except:
                timeline_entry["duration_seconds"] = 0
        
        timeline.append(timeline_entry)
    
    return {
        "instance_id": instance_id,
        "timeline": timeline,
        "total_steps": len(timeline),
        "status": instance.get("status")
    }


# ============================================================================
# SPRINT 4: API CONNECTOR BUILDER ENDPOINTS
# ============================================================================

@app.get("/api/connectors")
async def get_connectors(category: Optional[str] = None, is_template: Optional[bool] = None):
    """Get all API connectors with optional filtering"""
    query = {}
    if category:
        query["category"] = category
    if is_template is not None:
        query["is_template"] = is_template
    
    connectors = list(api_connectors_collection.find(query, {"_id": 0}))
    return {"connectors": connectors, "count": len(connectors)}


@app.get("/api/connectors/templates")
async def get_connector_templates():
    """Get pre-built connector templates"""
    templates = [
        {
            "id": "stripe-payment",
            "name": "Stripe Payment",
            "description": "Process payments using Stripe API",
            "category": "payment",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.stripe.com/v1/charges",
                "headers": {
                    "Authorization": "Bearer ${stripe_api_key}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                "query_params": {},
                "body": "amount=${amount}&currency=${currency}&source=${token}",
                "auth": {"type": "bearer", "config": {"token_variable": "stripe_api_key"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "charge_id", "type": "string", "transform": "none"},
                {"source_path": "$.status", "target_variable": "payment_status", "type": "string", "transform": "none"},
                {"source_path": "$.amount", "target_variable": "charged_amount", "type": "number", "transform": "none"}
            ]
        },
        {
            "id": "twilio-sms",
            "name": "Twilio SMS",
            "description": "Send SMS messages via Twilio",
            "category": "communication",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                "query_params": {},
                "body": "To=${to_number}&From=${from_number}&Body=${message}",
                "auth": {"type": "basic", "config": {"username_variable": "account_sid", "password_variable": "auth_token"}}
            },
            "response_mapping": [
                {"source_path": "$.sid", "target_variable": "message_sid", "type": "string", "transform": "none"},
                {"source_path": "$.status", "target_variable": "sms_status", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "sendgrid-email",
            "name": "SendGrid Email",
            "description": "Send emails using SendGrid",
            "category": "communication",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.sendgrid.com/v3/mail/send",
                "headers": {
                    "Authorization": "Bearer ${sendgrid_api_key}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "personalizations": [{"to": [{"email": "${to_email}"}]}],
                    "from": {"email": "${from_email}"},
                    "subject": "${subject}",
                    "content": [{"type": "text/html", "value": "${html_content}"}]
                },
                "auth": {"type": "bearer", "config": {"token_variable": "sendgrid_api_key"}}
            },
            "response_mapping": []
        },
        {
            "id": "slack-message",
            "name": "Slack Message",
            "description": "Post message to Slack channel",
            "category": "communication",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://slack.com/api/chat.postMessage",
                "headers": {
                    "Authorization": "Bearer ${slack_bot_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "channel": "${channel_id}",
                    "text": "${message_text}"
                },
                "auth": {"type": "bearer", "config": {"token_variable": "slack_bot_token"}}
            },
            "response_mapping": [
                {"source_path": "$.ok", "target_variable": "success", "type": "boolean", "transform": "none"},
                {"source_path": "$.ts", "target_variable": "message_timestamp", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "github-create-issue",
            "name": "GitHub Create Issue",
            "description": "Create issue in GitHub repository",
            "category": "custom",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.github.com/repos/${owner}/${repo}/issues",
                "headers": {
                    "Authorization": "Bearer ${github_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "title": "${issue_title}",
                    "body": "${issue_body}",
                    "labels": []
                },
                "auth": {"type": "bearer", "config": {"token_variable": "github_token"}}
            },
            "response_mapping": [
                {"source_path": "$.number", "target_variable": "issue_number", "type": "number", "transform": "none"},
                {"source_path": "$.html_url", "target_variable": "issue_url", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "openai-completion",
            "name": "OpenAI Completion",
            "description": "Generate text using OpenAI API",
            "category": "ai",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.openai.com/v1/chat/completions",
                "headers": {
                    "Authorization": "Bearer ${openai_api_key}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "model": "gpt-4",
                    "messages": [{"role": "user", "content": "${prompt}"}],
                    "temperature": 0.7
                },
                "auth": {"type": "bearer", "config": {"token_variable": "openai_api_key"}}
            },
            "response_mapping": [
                {"source_path": "$.choices[0].message.content", "target_variable": "ai_response", "type": "string", "transform": "none"},
                {"source_path": "$.usage.total_tokens", "target_variable": "tokens_used", "type": "number", "transform": "none"}
            ]
        },
        {
            "id": "google-sheets-read",
            "name": "Google Sheets - Read",
            "description": "Read data from Google Sheets",
            "category": "storage",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${range}",
                "headers": {
                    "Authorization": "Bearer ${google_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": None,
                "auth": {"type": "bearer", "config": {"token_variable": "google_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.values", "target_variable": "sheet_data", "type": "array", "transform": "none"},
                {"source_path": "$.range", "target_variable": "data_range", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "google-sheets-write",
            "name": "Google Sheets - Write",
            "description": "Write data to Google Sheets",
            "category": "storage",
            "is_template": True,
            "config": {
                "method": "PUT",
                "url": "https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${range}?valueInputOption=RAW",
                "headers": {
                    "Authorization": "Bearer ${google_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "values": []
                },
                "auth": {"type": "bearer", "config": {"token_variable": "google_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.updatedCells", "target_variable": "cells_updated", "type": "number", "transform": "none"},
                {"source_path": "$.updatedRange", "target_variable": "updated_range", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "stripe-customer",
            "name": "Stripe - Create Customer",
            "description": "Create a new customer in Stripe",
            "category": "payment",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.stripe.com/v1/customers",
                "headers": {
                    "Authorization": "Bearer ${stripe_api_key}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                "query_params": {},
                "body": "email=${customer_email}&name=${customer_name}&description=${description}",
                "auth": {"type": "bearer", "config": {"token_variable": "stripe_api_key"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "customer_id", "type": "string", "transform": "none"},
                {"source_path": "$.email", "target_variable": "customer_email", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "stripe-invoice",
            "name": "Stripe - Get Invoice",
            "description": "Retrieve invoice details from Stripe",
            "category": "payment",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://api.stripe.com/v1/invoices/${invoice_id}",
                "headers": {
                    "Authorization": "Bearer ${stripe_api_key}"
                },
                "query_params": {},
                "body": None,
                "auth": {"type": "bearer", "config": {"token_variable": "stripe_api_key"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "invoice_id", "type": "string", "transform": "none"},
                {"source_path": "$.amount_due", "target_variable": "amount_due", "type": "number", "transform": "none"},
                {"source_path": "$.status", "target_variable": "invoice_status", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "twilio-call",
            "name": "Twilio - Make Call",
            "description": "Initiate voice call via Twilio",
            "category": "communication",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Calls.json",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                "query_params": {},
                "body": "To=${to_number}&From=${from_number}&Url=${twiml_url}",
                "auth": {"type": "basic", "config": {"username_variable": "account_sid", "password_variable": "auth_token"}}
            },
            "response_mapping": [
                {"source_path": "$.sid", "target_variable": "call_sid", "type": "string", "transform": "none"},
                {"source_path": "$.status", "target_variable": "call_status", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "slack-channel",
            "name": "Slack - Create Channel",
            "description": "Create new Slack channel",
            "category": "communication",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://slack.com/api/conversations.create",
                "headers": {
                    "Authorization": "Bearer ${slack_bot_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "name": "${channel_name}",
                    "is_private": False
                },
                "auth": {"type": "bearer", "config": {"token_variable": "slack_bot_token"}}
            },
            "response_mapping": [
                {"source_path": "$.ok", "target_variable": "success", "type": "boolean", "transform": "none"},
                {"source_path": "$.channel.id", "target_variable": "channel_id", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "github-get-repo",
            "name": "GitHub - Get Repository",
            "description": "Get repository information",
            "category": "custom",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://api.github.com/repos/${owner}/${repo}",
                "headers": {
                    "Authorization": "Bearer ${github_token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                "query_params": {},
                "body": None,
                "auth": {"type": "bearer", "config": {"token_variable": "github_token"}}
            },
            "response_mapping": [
                {"source_path": "$.name", "target_variable": "repo_name", "type": "string", "transform": "none"},
                {"source_path": "$.stargazers_count", "target_variable": "stars", "type": "number", "transform": "none"},
                {"source_path": "$.html_url", "target_variable": "repo_url", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "github-create-pr",
            "name": "GitHub - Create Pull Request",
            "description": "Create pull request in repository",
            "category": "custom",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.github.com/repos/${owner}/${repo}/pulls",
                "headers": {
                    "Authorization": "Bearer ${github_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "title": "${pr_title}",
                    "body": "${pr_body}",
                    "head": "${head_branch}",
                    "base": "${base_branch}"
                },
                "auth": {"type": "bearer", "config": {"token_variable": "github_token"}}
            },
            "response_mapping": [
                {"source_path": "$.number", "target_variable": "pr_number", "type": "number", "transform": "none"},
                {"source_path": "$.html_url", "target_variable": "pr_url", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "openai-embedding",
            "name": "OpenAI - Create Embedding",
            "description": "Generate embeddings using OpenAI",
            "category": "ai",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.openai.com/v1/embeddings",
                "headers": {
                    "Authorization": "Bearer ${openai_api_key}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "model": "text-embedding-ada-002",
                    "input": "${text_input}"
                },
                "auth": {"type": "bearer", "config": {"token_variable": "openai_api_key"}}
            },
            "response_mapping": [
                {"source_path": "$.data[0].embedding", "target_variable": "embedding_vector", "type": "array", "transform": "none"},
                {"source_path": "$.usage.total_tokens", "target_variable": "tokens_used", "type": "number", "transform": "none"}
            ]
        },
        # ========== PHASE 3.4: ENTERPRISE CONNECTOR TEMPLATES ==========
        {
            "id": "salesforce-create-lead",
            "name": "Salesforce - Create Lead",
            "description": "Create a new lead in Salesforce CRM",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${instance_url}/services/data/v58.0/sobjects/Lead",
                "headers": {
                    "Authorization": "Bearer ${salesforce_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "FirstName": "${first_name}",
                    "LastName": "${last_name}",
                    "Company": "${company}",
                    "Email": "${email}",
                    "Phone": "${phone}",
                    "Status": "Open - Not Contacted"
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "salesforce_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "lead_id", "type": "string", "transform": "none"},
                {"source_path": "$.success", "target_variable": "success", "type": "boolean", "transform": "none"}
            ]
        },
        {
            "id": "salesforce-get-account",
            "name": "Salesforce - Get Account",
            "description": "Retrieve account details from Salesforce",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://${instance_url}/services/data/v58.0/sobjects/Account/${account_id}",
                "headers": {
                    "Authorization": "Bearer ${salesforce_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": None,
                "auth": {"type": "oauth2", "config": {"token_variable": "salesforce_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.Id", "target_variable": "account_id", "type": "string", "transform": "none"},
                {"source_path": "$.Name", "target_variable": "account_name", "type": "string", "transform": "none"},
                {"source_path": "$.Type", "target_variable": "account_type", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "hubspot-create-contact",
            "name": "HubSpot - Create Contact",
            "description": "Create a new contact in HubSpot CRM",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.hubapi.com/crm/v3/objects/contacts",
                "headers": {
                    "Authorization": "Bearer ${hubspot_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "properties": {
                        "email": "${email}",
                        "firstname": "${first_name}",
                        "lastname": "${last_name}",
                        "phone": "${phone}",
                        "company": "${company}"
                    }
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "hubspot_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "contact_id", "type": "string", "transform": "none"},
                {"source_path": "$.properties.email", "target_variable": "contact_email", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "hubspot-create-deal",
            "name": "HubSpot - Create Deal",
            "description": "Create a new deal in HubSpot",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.hubapi.com/crm/v3/objects/deals",
                "headers": {
                    "Authorization": "Bearer ${hubspot_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "properties": {
                        "dealname": "${deal_name}",
                        "dealstage": "${deal_stage}",
                        "amount": "${amount}",
                        "pipeline": "${pipeline}"
                    }
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "hubspot_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "deal_id", "type": "string", "transform": "none"},
                {"source_path": "$.properties.dealname", "target_variable": "deal_name", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "jira-create-issue",
            "name": "Jira - Create Issue",
            "description": "Create a new issue in Jira",
            "category": "project_management",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${jira_domain}.atlassian.net/rest/api/3/issue",
                "headers": {
                    "Authorization": "Bearer ${jira_api_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "fields": {
                        "project": {"key": "${project_key}"},
                        "summary": "${summary}",
                        "description": {
                            "type": "doc",
                            "version": 1,
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [{"type": "text", "text": "${description}"}]
                                }
                            ]
                        },
                        "issuetype": {"name": "${issue_type}"}
                    }
                },
                "auth": {"type": "bearer", "config": {"token_variable": "jira_api_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "issue_id", "type": "string", "transform": "none"},
                {"source_path": "$.key", "target_variable": "issue_key", "type": "string", "transform": "none"},
                {"source_path": "$.self", "target_variable": "issue_url", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "jira-update-issue",
            "name": "Jira - Update Issue",
            "description": "Update an existing Jira issue",
            "category": "project_management",
            "is_template": True,
            "config": {
                "method": "PUT",
                "url": "https://${jira_domain}.atlassian.net/rest/api/3/issue/${issue_key}",
                "headers": {
                    "Authorization": "Bearer ${jira_api_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "fields": {
                        "summary": "${summary}",
                        "description": {
                            "type": "doc",
                            "version": 1,
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [{"type": "text", "text": "${description}"}]
                                }
                            ]
                        }
                    }
                },
                "auth": {"type": "bearer", "config": {"token_variable": "jira_api_token"}}
            },
            "response_mapping": []
        },
        {
            "id": "servicenow-create-incident",
            "name": "ServiceNow - Create Incident",
            "description": "Create a new incident in ServiceNow",
            "category": "itsm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${instance}.service-now.com/api/now/table/incident",
                "headers": {
                    "Authorization": "Bearer ${servicenow_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "short_description": "${short_description}",
                    "description": "${description}",
                    "urgency": "${urgency}",
                    "impact": "${impact}",
                    "category": "${category}",
                    "caller_id": "${caller_id}"
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "servicenow_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.result.sys_id", "target_variable": "incident_id", "type": "string", "transform": "none"},
                {"source_path": "$.result.number", "target_variable": "incident_number", "type": "string", "transform": "none"},
                {"source_path": "$.result.state", "target_variable": "incident_state", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "servicenow-update-ticket",
            "name": "ServiceNow - Update Ticket",
            "description": "Update ServiceNow ticket status",
            "category": "itsm",
            "is_template": True,
            "config": {
                "method": "PATCH",
                "url": "https://${instance}.service-now.com/api/now/table/incident/${sys_id}",
                "headers": {
                    "Authorization": "Bearer ${servicenow_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "state": "${state}",
                    "work_notes": "${work_notes}",
                    "close_code": "${close_code}",
                    "close_notes": "${close_notes}"
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "servicenow_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.result.sys_id", "target_variable": "ticket_id", "type": "string", "transform": "none"},
                {"source_path": "$.result.state", "target_variable": "ticket_state", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "sap-create-sales-order",
            "name": "SAP - Create Sales Order",
            "description": "Create sales order in SAP ERP",
            "category": "erp",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${sap_host}/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder",
                "headers": {
                    "Authorization": "Basic ${sap_credentials}",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                "query_params": {},
                "body": {
                    "SalesOrderType": "${order_type}",
                    "SalesOrganization": "${sales_org}",
                    "DistributionChannel": "${distribution_channel}",
                    "OrganizationDivision": "${division}",
                    "SoldToParty": "${customer_id}",
                    "PurchaseOrderByCustomer": "${po_number}"
                },
                "auth": {"type": "basic", "config": {"credentials_variable": "sap_credentials"}}
            },
            "response_mapping": [
                {"source_path": "$.d.SalesOrder", "target_variable": "sales_order_number", "type": "string", "transform": "none"},
                {"source_path": "$.d.TotalNetAmount", "target_variable": "total_amount", "type": "number", "transform": "none"}
            ]
        },
        {
            "id": "sap-get-material",
            "name": "SAP - Get Material Details",
            "description": "Retrieve material information from SAP",
            "category": "erp",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://${sap_host}/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MatlStkInAcctMod(Material='${material_id}')",
                "headers": {
                    "Authorization": "Basic ${sap_credentials}",
                    "Accept": "application/json"
                },
                "query_params": {},
                "body": None,
                "auth": {"type": "basic", "config": {"credentials_variable": "sap_credentials"}}
            },
            "response_mapping": [
                {"source_path": "$.d.Material", "target_variable": "material_id", "type": "string", "transform": "none"},
                {"source_path": "$.d.MatlWrhsStkQtyInMatlBaseUnit", "target_variable": "stock_quantity", "type": "number", "transform": "none"}
            ]
        },
        {
            "id": "oracle-execute-query",
            "name": "Oracle - Execute Query",
            "description": "Execute SQL query against Oracle database via REST API",
            "category": "database",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${oracle_rest_host}/ords/${schema}/_/sql",
                "headers": {
                    "Authorization": "Bearer ${oracle_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "statementText": "${sql_query}",
                    "offset": 0,
                    "limit": 100
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "oracle_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.items", "target_variable": "query_results", "type": "array", "transform": "none"},
                {"source_path": "$.count", "target_variable": "result_count", "type": "number", "transform": "none"}
            ]
        },
        {
            "id": "dynamics365-create-account",
            "name": "Microsoft Dynamics 365 - Create Account",
            "description": "Create new account in Dynamics 365 CRM",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${org_url}/api/data/v9.2/accounts",
                "headers": {
                    "Authorization": "Bearer ${dynamics_access_token}",
                    "Content-Type": "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0"
                },
                "query_params": {},
                "body": {
                    "name": "${account_name}",
                    "telephone1": "${phone}",
                    "emailaddress1": "${email}",
                    "address1_city": "${city}",
                    "address1_country": "${country}"
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "dynamics_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.accountid", "target_variable": "account_id", "type": "string", "transform": "none"},
                {"source_path": "$.name", "target_variable": "account_name", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "dynamics365-create-lead",
            "name": "Microsoft Dynamics 365 - Create Lead",
            "description": "Create new lead in Dynamics 365",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${org_url}/api/data/v9.2/leads",
                "headers": {
                    "Authorization": "Bearer ${dynamics_access_token}",
                    "Content-Type": "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0"
                },
                "query_params": {},
                "body": {
                    "subject": "${subject}",
                    "firstname": "${first_name}",
                    "lastname": "${last_name}",
                    "emailaddress1": "${email}",
                    "companyname": "${company}",
                    "mobilephone": "${phone}"
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "dynamics_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.leadid", "target_variable": "lead_id", "type": "string", "transform": "none"},
                {"source_path": "$.fullname", "target_variable": "lead_name", "type": "string", "transform": "none"}
            ]
        },
        # Additional Salesforce Operations
        {
            "id": "salesforce-update-opportunity",
            "name": "Salesforce - Update Opportunity",
            "description": "Update opportunity in Salesforce CRM",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "PATCH",
                "url": "https://${instance_url}/services/data/v58.0/sobjects/Opportunity/${opportunity_id}",
                "headers": {
                    "Authorization": "Bearer ${salesforce_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "Amount": "${amount}",
                    "StageName": "${stage}",
                    "CloseDate": "${close_date}",
                    "Probability": "${probability}"
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "salesforce_access_token"}}
            },
            "response_mapping": []
        },
        {
            "id": "salesforce-soql-query",
            "name": "Salesforce - SOQL Query",
            "description": "Execute SOQL query in Salesforce",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://${instance_url}/services/data/v58.0/query",
                "headers": {
                    "Authorization": "Bearer ${salesforce_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {
                    "q": "${soql_query}"
                },
                "body": None,
                "auth": {"type": "oauth2", "config": {"token_variable": "salesforce_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.totalSize", "target_variable": "total_records", "type": "number", "transform": "none"},
                {"source_path": "$.records", "target_variable": "query_records", "type": "array", "transform": "none"}
            ]
        },
        # Additional HubSpot Operations
        {
            "id": "hubspot-get-contact",
            "name": "HubSpot - Get Contact",
            "description": "Retrieve contact details from HubSpot",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://api.hubapi.com/crm/v3/objects/contacts/${contact_id}",
                "headers": {
                    "Authorization": "Bearer ${hubspot_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": None,
                "auth": {"type": "oauth2", "config": {"token_variable": "hubspot_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "contact_id", "type": "string", "transform": "none"},
                {"source_path": "$.properties", "target_variable": "contact_properties", "type": "object", "transform": "none"}
            ]
        },
        {
            "id": "hubspot-create-company",
            "name": "HubSpot - Create Company",
            "description": "Create new company in HubSpot",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.hubapi.com/crm/v3/objects/companies",
                "headers": {
                    "Authorization": "Bearer ${hubspot_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "properties": {
                        "name": "${company_name}",
                        "domain": "${domain}",
                        "city": "${city}",
                        "industry": "${industry}",
                        "phone": "${phone}"
                    }
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "hubspot_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "company_id", "type": "string", "transform": "none"},
                {"source_path": "$.properties.name", "target_variable": "company_name", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "hubspot-create-ticket",
            "name": "HubSpot - Create Ticket",
            "description": "Create support ticket in HubSpot",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.hubapi.com/crm/v3/objects/tickets",
                "headers": {
                    "Authorization": "Bearer ${hubspot_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "properties": {
                        "subject": "${subject}",
                        "content": "${content}",
                        "hs_pipeline_stage": "${pipeline_stage}",
                        "hs_ticket_priority": "${priority}"
                    }
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "hubspot_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "ticket_id", "type": "string", "transform": "none"},
                {"source_path": "$.properties.subject", "target_variable": "ticket_subject", "type": "string", "transform": "none"}
            ]
        },
        # Additional Jira Operations
        {
            "id": "jira-get-issue",
            "name": "Jira - Get Issue",
            "description": "Get Jira issue details",
            "category": "project_management",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://${jira_domain}.atlassian.net/rest/api/3/issue/${issue_key}",
                "headers": {
                    "Authorization": "Bearer ${jira_api_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": None,
                "auth": {"type": "bearer", "config": {"token_variable": "jira_api_token"}}
            },
            "response_mapping": [
                {"source_path": "$.key", "target_variable": "issue_key", "type": "string", "transform": "none"},
                {"source_path": "$.fields.summary", "target_variable": "summary", "type": "string", "transform": "none"},
                {"source_path": "$.fields.status.name", "target_variable": "status", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "jira-add-comment",
            "name": "Jira - Add Comment",
            "description": "Add comment to Jira issue",
            "category": "project_management",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${jira_domain}.atlassian.net/rest/api/3/issue/${issue_key}/comment",
                "headers": {
                    "Authorization": "Bearer ${jira_api_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "body": {
                        "type": "doc",
                        "version": 1,
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "${comment_text}"}]
                            }
                        ]
                    }
                },
                "auth": {"type": "bearer", "config": {"token_variable": "jira_api_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "comment_id", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "jira-transition-issue",
            "name": "Jira - Transition Issue",
            "description": "Change Jira issue status/workflow state",
            "category": "project_management",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${jira_domain}.atlassian.net/rest/api/3/issue/${issue_key}/transitions",
                "headers": {
                    "Authorization": "Bearer ${jira_api_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "transition": {
                        "id": "${transition_id}"
                    },
                    "fields": {}
                },
                "auth": {"type": "bearer", "config": {"token_variable": "jira_api_token"}}
            },
            "response_mapping": []
        },
        # Additional ServiceNow Operations
        {
            "id": "servicenow-get-incident",
            "name": "ServiceNow - Get Incident",
            "description": "Retrieve incident details from ServiceNow",
            "category": "itsm",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://${instance}.service-now.com/api/now/table/incident/${sys_id}",
                "headers": {
                    "Authorization": "Bearer ${servicenow_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": None,
                "auth": {"type": "oauth2", "config": {"token_variable": "servicenow_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.result.number", "target_variable": "incident_number", "type": "string", "transform": "none"},
                {"source_path": "$.result.short_description", "target_variable": "description", "type": "string", "transform": "none"},
                {"source_path": "$.result.state", "target_variable": "state", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "servicenow-create-change-request",
            "name": "ServiceNow - Create Change Request",
            "description": "Create change request in ServiceNow",
            "category": "itsm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${instance}.service-now.com/api/now/table/change_request",
                "headers": {
                    "Authorization": "Bearer ${servicenow_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "short_description": "${short_description}",
                    "description": "${description}",
                    "type": "${type}",
                    "risk": "${risk}",
                    "impact": "${impact}",
                    "priority": "${priority}"
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "servicenow_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.result.sys_id", "target_variable": "change_id", "type": "string", "transform": "none"},
                {"source_path": "$.result.number", "target_variable": "change_number", "type": "string", "transform": "none"}
            ]
        },
        # Additional SAP Operations
        {
            "id": "sap-get-business-partner",
            "name": "SAP - Get Business Partner",
            "description": "Retrieve business partner details from SAP",
            "category": "erp",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://${sap_host}/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner('${partner_id}')",
                "headers": {
                    "Authorization": "Basic ${sap_credentials}",
                    "Accept": "application/json"
                },
                "query_params": {},
                "body": None,
                "auth": {"type": "basic", "config": {"credentials_variable": "sap_credentials"}}
            },
            "response_mapping": [
                {"source_path": "$.d.BusinessPartner", "target_variable": "partner_id", "type": "string", "transform": "none"},
                {"source_path": "$.d.BusinessPartnerFullName", "target_variable": "partner_name", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "sap-create-purchase-order",
            "name": "SAP - Create Purchase Order",
            "description": "Create purchase order in SAP",
            "category": "erp",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${sap_host}/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder",
                "headers": {
                    "Authorization": "Basic ${sap_credentials}",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                "query_params": {},
                "body": {
                    "PurchaseOrderType": "${po_type}",
                    "CompanyCode": "${company_code}",
                    "PurchasingOrganization": "${purchasing_org}",
                    "PurchasingGroup": "${purchasing_group}",
                    "Supplier": "${supplier_id}"
                },
                "auth": {"type": "basic", "config": {"credentials_variable": "sap_credentials"}}
            },
            "response_mapping": [
                {"source_path": "$.d.PurchaseOrder", "target_variable": "po_number", "type": "string", "transform": "none"}
            ]
        },
        # Additional Oracle Operations
        {
            "id": "oracle-cloud-create-customer",
            "name": "Oracle Cloud - Create Customer",
            "description": "Create customer in Oracle Cloud ERP",
            "category": "erp",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${oracle_cloud_host}/fscmRestApi/resources/11.13.18.05/customerAccounts",
                "headers": {
                    "Authorization": "Bearer ${oracle_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "PartyName": "${customer_name}",
                    "CustomerAccountNumber": "${account_number}",
                    "CustomerType": "${customer_type}"
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "oracle_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.PartyId", "target_variable": "customer_id", "type": "number", "transform": "none"},
                {"source_path": "$.PartyNumber", "target_variable": "customer_number", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "oracle-cloud-get-invoice",
            "name": "Oracle Cloud - Get Invoice",
            "description": "Retrieve invoice from Oracle Cloud",
            "category": "erp",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://${oracle_cloud_host}/fscmRestApi/resources/11.13.18.05/receivablesInvoices/${invoice_id}",
                "headers": {
                    "Authorization": "Bearer ${oracle_access_token}",
                    "Accept": "application/json"
                },
                "query_params": {},
                "body": None,
                "auth": {"type": "oauth2", "config": {"token_variable": "oracle_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.CustomerTrxId", "target_variable": "invoice_id", "type": "number", "transform": "none"},
                {"source_path": "$.TrxNumber", "target_variable": "invoice_number", "type": "string", "transform": "none"},
                {"source_path": "$.TransactionAmount", "target_variable": "amount", "type": "number", "transform": "none"}
            ]
        },
        # Additional Microsoft Dynamics 365 Operations
        {
            "id": "dynamics365-get-account",
            "name": "Microsoft Dynamics 365 - Get Account",
            "description": "Retrieve account details from Dynamics 365",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "GET",
                "url": "https://${org_url}/api/data/v9.2/accounts(${account_id})",
                "headers": {
                    "Authorization": "Bearer ${dynamics_access_token}",
                    "Accept": "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0"
                },
                "query_params": {},
                "body": None,
                "auth": {"type": "oauth2", "config": {"token_variable": "dynamics_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.accountid", "target_variable": "account_id", "type": "string", "transform": "none"},
                {"source_path": "$.name", "target_variable": "account_name", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "dynamics365-create-opportunity",
            "name": "Microsoft Dynamics 365 - Create Opportunity",
            "description": "Create sales opportunity in Dynamics 365",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${org_url}/api/data/v9.2/opportunities",
                "headers": {
                    "Authorization": "Bearer ${dynamics_access_token}",
                    "Content-Type": "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0"
                },
                "query_params": {},
                "body": {
                    "name": "${opportunity_name}",
                    "description": "${description}",
                    "estimatedvalue": "${estimated_value}",
                    "estimatedclosedate": "${close_date}"
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "dynamics_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.opportunityid", "target_variable": "opportunity_id", "type": "string", "transform": "none"},
                {"source_path": "$.name", "target_variable": "opportunity_name", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "dynamics365-create-case",
            "name": "Microsoft Dynamics 365 - Create Case",
            "description": "Create support case in Dynamics 365",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${org_url}/api/data/v9.2/incidents",
                "headers": {
                    "Authorization": "Bearer ${dynamics_access_token}",
                    "Content-Type": "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0"
                },
                "query_params": {},
                "body": {
                    "title": "${title}",
                    "description": "${description}",
                    "prioritycode": "${priority}",
                    "caseorigincode": "${origin}"
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "dynamics_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.incidentid", "target_variable": "case_id", "type": "string", "transform": "none"},
                {"source_path": "$.ticketnumber", "target_variable": "case_number", "type": "string", "transform": "none"}
            ]
        },
        # ========== PHASE 3.4 EXPANSION: MODERN COLLABORATION & CLOUD SERVICES ==========
        {
            "id": "teams-message",
            "name": "Microsoft Teams - Send Message",
            "description": "Send message to Microsoft Teams channel",
            "category": "communication",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://graph.microsoft.com/v1.0/teams/${team_id}/channels/${channel_id}/messages",
                "headers": {
                    "Authorization": "Bearer ${microsoft_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "body": {
                        "contentType": "html",
                        "content": "${message_content}"
                    }
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "microsoft_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "message_id", "type": "string", "transform": "none"},
                {"source_path": "$.createdDateTime", "target_variable": "created_at", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "discord-webhook",
            "name": "Discord - Send Webhook Message",
            "description": "Send message to Discord via webhook",
            "category": "communication",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "${webhook_url}",
                "headers": {
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "content": "${message}",
                    "username": "${bot_name}",
                    "embeds": []
                },
                "auth": {"type": "none", "config": {}}
            },
            "response_mapping": []
        },
        {
            "id": "zoom-create-meeting",
            "name": "Zoom - Create Meeting",
            "description": "Schedule a new Zoom meeting",
            "category": "communication",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.zoom.us/v2/users/${user_id}/meetings",
                "headers": {
                    "Authorization": "Bearer ${zoom_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "topic": "${meeting_topic}",
                    "type": 2,
                    "start_time": "${start_time}",
                    "duration": "${duration}",
                    "timezone": "${timezone}",
                    "settings": {
                        "join_before_host": True,
                        "mute_upon_entry": False
                    }
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "zoom_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "meeting_id", "type": "number", "transform": "none"},
                {"source_path": "$.join_url", "target_variable": "join_url", "type": "string", "transform": "none"},
                {"source_path": "$.start_url", "target_variable": "start_url", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "aws-s3-upload",
            "name": "AWS S3 - Upload Object",
            "description": "Upload file to Amazon S3 bucket",
            "category": "storage",
            "is_template": True,
            "config": {
                "method": "PUT",
                "url": "https://${bucket_name}.s3.${region}.amazonaws.com/${object_key}",
                "headers": {
                    "Authorization": "AWS4-HMAC-SHA256 ${aws_signature}",
                    "Content-Type": "${content_type}",
                    "x-amz-content-sha256": "${content_hash}"
                },
                "query_params": {},
                "body": "${file_content}",
                "auth": {"type": "custom", "config": {"auth_type": "aws_sig_v4"}}
            },
            "response_mapping": [
                {"source_path": "$.ETag", "target_variable": "etag", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "dropbox-upload",
            "name": "Dropbox - Upload File",
            "description": "Upload file to Dropbox",
            "category": "storage",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://content.dropboxapi.com/2/files/upload",
                "headers": {
                    "Authorization": "Bearer ${dropbox_access_token}",
                    "Content-Type": "application/octet-stream",
                    "Dropbox-API-Arg": "{\"path\":\"${file_path}\",\"mode\":\"add\",\"autorename\":true}"
                },
                "query_params": {},
                "body": "${file_content}",
                "auth": {"type": "bearer", "config": {"token_variable": "dropbox_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "file_id", "type": "string", "transform": "none"},
                {"source_path": "$.path_display", "target_variable": "file_path", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "notion-create-page",
            "name": "Notion - Create Page",
            "description": "Create new page in Notion database",
            "category": "project_management",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.notion.com/v1/pages",
                "headers": {
                    "Authorization": "Bearer ${notion_token}",
                    "Content-Type": "application/json",
                    "Notion-Version": "2022-06-28"
                },
                "query_params": {},
                "body": {
                    "parent": {"database_id": "${database_id}"},
                    "properties": {
                        "Name": {
                            "title": [{"text": {"content": "${title}"}}]
                        }
                    }
                },
                "auth": {"type": "bearer", "config": {"token_variable": "notion_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "page_id", "type": "string", "transform": "none"},
                {"source_path": "$.url", "target_variable": "page_url", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "airtable-create-record",
            "name": "Airtable - Create Record",
            "description": "Create new record in Airtable base",
            "category": "database",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.airtable.com/v0/${base_id}/${table_name}",
                "headers": {
                    "Authorization": "Bearer ${airtable_api_key}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "fields": {}
                },
                "auth": {"type": "bearer", "config": {"token_variable": "airtable_api_key"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "record_id", "type": "string", "transform": "none"},
                {"source_path": "$.fields", "target_variable": "record_data", "type": "object", "transform": "none"}
            ]
        },
        {
            "id": "monday-create-item",
            "name": "Monday.com - Create Item",
            "description": "Create new item in Monday.com board",
            "category": "project_management",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.monday.com/v2",
                "headers": {
                    "Authorization": "${monday_api_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "query": "mutation { create_item (board_id: ${board_id}, item_name: \"${item_name}\") { id } }"
                },
                "auth": {"type": "api_key", "config": {"key_variable": "monday_api_token"}}
            },
            "response_mapping": [
                {"source_path": "$.data.create_item.id", "target_variable": "item_id", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "asana-create-task",
            "name": "Asana - Create Task",
            "description": "Create new task in Asana project",
            "category": "project_management",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://app.asana.com/api/1.0/tasks",
                "headers": {
                    "Authorization": "Bearer ${asana_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "data": {
                        "name": "${task_name}",
                        "notes": "${description}",
                        "projects": ["${project_id}"]
                    }
                },
                "auth": {"type": "bearer", "config": {"token_variable": "asana_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.data.gid", "target_variable": "task_id", "type": "string", "transform": "none"},
                {"source_path": "$.data.name", "target_variable": "task_name", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "trello-create-card",
            "name": "Trello - Create Card",
            "description": "Create new card in Trello board",
            "category": "project_management",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.trello.com/1/cards",
                "headers": {
                    "Accept": "application/json"
                },
                "query_params": {
                    "key": "${trello_api_key}",
                    "token": "${trello_token}",
                    "idList": "${list_id}",
                    "name": "${card_name}",
                    "desc": "${description}"
                },
                "body": None,
                "auth": {"type": "custom", "config": {"auth_type": "query_params"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "card_id", "type": "string", "transform": "none"},
                {"source_path": "$.shortUrl", "target_variable": "card_url", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "mailchimp-add-subscriber",
            "name": "Mailchimp - Add Subscriber",
            "description": "Add email subscriber to Mailchimp list",
            "category": "communication",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${datacenter}.api.mailchimp.com/3.0/lists/${list_id}/members",
                "headers": {
                    "Authorization": "Bearer ${mailchimp_api_key}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "email_address": "${email}",
                    "status": "subscribed",
                    "merge_fields": {
                        "FNAME": "${first_name}",
                        "LNAME": "${last_name}"
                    }
                },
                "auth": {"type": "bearer", "config": {"token_variable": "mailchimp_api_key"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "subscriber_id", "type": "string", "transform": "none"},
                {"source_path": "$.email_address", "target_variable": "email", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "zendesk-create-ticket",
            "name": "Zendesk - Create Ticket",
            "description": "Create support ticket in Zendesk",
            "category": "itsm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${subdomain}.zendesk.com/api/v2/tickets",
                "headers": {
                    "Authorization": "Bearer ${zendesk_api_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "ticket": {
                        "subject": "${subject}",
                        "comment": {
                            "body": "${description}"
                        },
                        "priority": "${priority}",
                        "type": "problem"
                    }
                },
                "auth": {"type": "bearer", "config": {"token_variable": "zendesk_api_token"}}
            },
            "response_mapping": [
                {"source_path": "$.ticket.id", "target_variable": "ticket_id", "type": "number", "transform": "none"},
                {"source_path": "$.ticket.url", "target_variable": "ticket_url", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "intercom-create-user",
            "name": "Intercom - Create User",
            "description": "Create or update user in Intercom",
            "category": "crm",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.intercom.io/users",
                "headers": {
                    "Authorization": "Bearer ${intercom_access_token}",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                "query_params": {},
                "body": {
                    "email": "${email}",
                    "name": "${name}",
                    "custom_attributes": {}
                },
                "auth": {"type": "bearer", "config": {"token_variable": "intercom_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "user_id", "type": "string", "transform": "none"},
                {"source_path": "$.email", "target_variable": "user_email", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "shopify-create-order",
            "name": "Shopify - Create Order",
            "description": "Create new order in Shopify store",
            "category": "ecommerce",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://${shop_name}.myshopify.com/admin/api/2024-01/orders.json",
                "headers": {
                    "X-Shopify-Access-Token": "${shopify_access_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "order": {
                        "line_items": [],
                        "customer": {
                            "email": "${customer_email}"
                        },
                        "financial_status": "pending"
                    }
                },
                "auth": {"type": "custom", "config": {"header": "X-Shopify-Access-Token"}}
            },
            "response_mapping": [
                {"source_path": "$.order.id", "target_variable": "order_id", "type": "number", "transform": "none"},
                {"source_path": "$.order.order_number", "target_variable": "order_number", "type": "number", "transform": "none"}
            ]
        },
        {
            "id": "quickbooks-create-invoice",
            "name": "QuickBooks - Create Invoice",
            "description": "Create invoice in QuickBooks Online",
            "category": "erp",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://quickbooks.api.intuit.com/v3/company/${company_id}/invoice",
                "headers": {
                    "Authorization": "Bearer ${quickbooks_access_token}",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                "query_params": {},
                "body": {
                    "CustomerRef": {
                        "value": "${customer_id}"
                    },
                    "Line": [],
                    "DueDate": "${due_date}"
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "quickbooks_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.Invoice.Id", "target_variable": "invoice_id", "type": "string", "transform": "none"},
                {"source_path": "$.Invoice.DocNumber", "target_variable": "invoice_number", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "linkedin-share-post",
            "name": "LinkedIn - Share Post",
            "description": "Share post on LinkedIn profile or company page",
            "category": "social_media",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.linkedin.com/v2/ugcPosts",
                "headers": {
                    "Authorization": "Bearer ${linkedin_access_token}",
                    "Content-Type": "application/json",
                    "X-Restli-Protocol-Version": "2.0.0"
                },
                "query_params": {},
                "body": {
                    "author": "urn:li:person:${person_id}",
                    "lifecycleState": "PUBLISHED",
                    "specificContent": {
                        "com.linkedin.ugc.ShareContent": {
                            "shareCommentary": {
                                "text": "${post_text}"
                            },
                            "shareMediaCategory": "NONE"
                        }
                    },
                    "visibility": {
                        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                    }
                },
                "auth": {"type": "oauth2", "config": {"token_variable": "linkedin_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.id", "target_variable": "post_id", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "twitter-create-tweet",
            "name": "Twitter/X - Create Tweet",
            "description": "Post tweet on Twitter/X",
            "category": "social_media",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.twitter.com/2/tweets",
                "headers": {
                    "Authorization": "Bearer ${twitter_bearer_token}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "text": "${tweet_text}"
                },
                "auth": {"type": "bearer", "config": {"token_variable": "twitter_bearer_token"}}
            },
            "response_mapping": [
                {"source_path": "$.data.id", "target_variable": "tweet_id", "type": "string", "transform": "none"},
                {"source_path": "$.data.text", "target_variable": "tweet_text", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "azure-blob-upload",
            "name": "Azure Blob Storage - Upload",
            "description": "Upload file to Azure Blob Storage",
            "category": "storage",
            "is_template": True,
            "config": {
                "method": "PUT",
                "url": "https://${storage_account}.blob.core.windows.net/${container_name}/${blob_name}",
                "headers": {
                    "x-ms-blob-type": "BlockBlob",
                    "x-ms-version": "2021-08-06",
                    "Authorization": "Bearer ${azure_access_token}",
                    "Content-Type": "${content_type}"
                },
                "query_params": {},
                "body": "${file_content}",
                "auth": {"type": "oauth2", "config": {"token_variable": "azure_access_token"}}
            },
            "response_mapping": [
                {"source_path": "$.ETag", "target_variable": "etag", "type": "string", "transform": "none"}
            ]
        },
        {
            "id": "aws-lambda-invoke",
            "name": "AWS Lambda - Invoke Function",
            "description": "Invoke AWS Lambda function",
            "category": "custom",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://lambda.${region}.amazonaws.com/2015-03-31/functions/${function_name}/invocations",
                "headers": {
                    "Authorization": "AWS4-HMAC-SHA256 ${aws_signature}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {},
                "auth": {"type": "custom", "config": {"auth_type": "aws_sig_v4"}}
            },
            "response_mapping": [
                {"source_path": "$", "target_variable": "lambda_response", "type": "object", "transform": "none"}
            ]
        },
        {
            "id": "datadog-send-metric",
            "name": "Datadog - Send Metric",
            "description": "Send custom metric to Datadog",
            "category": "monitoring",
            "is_template": True,
            "config": {
                "method": "POST",
                "url": "https://api.datadoghq.com/api/v1/series",
                "headers": {
                    "DD-API-KEY": "${datadog_api_key}",
                    "Content-Type": "application/json"
                },
                "query_params": {},
                "body": {
                    "series": [
                        {
                            "metric": "${metric_name}",
                            "points": [[{"$now_timestamp"}, "${metric_value}"]],
                            "type": "gauge",
                            "tags": []
                        }
                    ]
                },
                "auth": {"type": "api_key", "config": {"key_variable": "datadog_api_key"}}
            },
            "response_mapping": [
                {"source_path": "$.status", "target_variable": "status", "type": "string", "transform": "none"}
            ]
        }
    ]
    return {"templates": templates, "count": len(templates)}


# Note: Connector CRUD endpoints are defined earlier in the file (lines ~5165-5250)
# Duplicate endpoints removed to avoid routing conflicts

@app.post("/api/connectors/from-template")
async def create_connector_from_template(data: Dict[str, Any]):
    """Create a new connector from a template"""
    template_id = data.get("template_id")
    custom_name = data.get("name")
    
    # Get all templates
    templates_response = await get_connector_templates()
    templates = templates_response["templates"]
    
    # Find the template
    template = next((t for t in templates if t["id"] == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Create new connector from template
    connector_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    connector_dict = {
        **template,
        "id": connector_id,
        "name": custom_name or template["name"],
        "is_template": False,
        "created_at": now,
        "updated_at": now,
        "template_source": template_id
    }
    
    api_connectors_collection.insert_one(connector_dict)
    
    return {"message": "Connector created from template successfully", "id": connector_id, "connector": connector_dict}


# Note: update_connector and delete_connector endpoints are defined earlier in the file (lines ~5200-5250)
# Duplicate endpoints removed to avoid conflicts


@app.get("/api/connectors/stats/summary")
async def get_connector_stats_summary():
    """Get summary statistics for all connectors"""
    total_connectors = api_connectors_collection.count_documents({"is_template": False})
    total_templates = api_connectors_collection.count_documents({"is_template": True})
    
    # Get templates response to count built-in templates
    templates_response = await get_connector_templates()
    builtin_templates = templates_response["count"]
    
    return {
        "total_connectors": total_connectors,
        "total_templates": total_templates,
        "builtin_templates": builtin_templates,
        "grand_total": total_connectors + builtin_templates
    }


# ========== CIRCUIT BREAKER, RATE LIMITING, AND CONNECTION POOL ENDPOINTS ==========
# (Duplicate CRUD endpoints removed - see lines ~5165-5250 for primary connector management)


@app.post("/api/connectors/{connector_id}/test")
async def test_connector(connector_id: str, variables: Dict[str, Any]):
    """Test connector with provided variables"""
    connector = api_connectors_collection.find_one({"id": connector_id}, {"_id": 0})
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    try:
        config = connector.get("config", {})
        
        # Substitute variables in URL
        url = config.get("url", "")
        for key, value in variables.items():
            url = url.replace(f"${{{key}}}", str(value))
        
        # Substitute variables in headers
        headers = {}
        for key, value in config.get("headers", {}).items():
            header_value = value
            for var_key, var_value in variables.items():
                header_value = header_value.replace(f"${{{var_key}}}", str(var_value))
            headers[key] = header_value
        
        # Substitute variables in body
        body = config.get("body")
        if isinstance(body, str):
            for key, value in variables.items():
                body = body.replace(f"${{{key}}}", str(value))
        elif isinstance(body, dict):
            body = json.loads(json.dumps(body))  # Deep copy
            def replace_vars(obj):
                if isinstance(obj, str):
                    for key, value in variables.items():
                        obj = obj.replace(f"${{{key}}}", str(value))
                    return obj
                elif isinstance(obj, dict):
                    return {k: replace_vars(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [replace_vars(item) for item in obj]
                return obj
            body = replace_vars(body)
        
        # Make request
        method = config.get("method", "GET").upper()
        timeout = connector.get("error_handling", {}).get("timeout", 30000) / 1000
        
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=timeout)
        elif method == "POST":
            if isinstance(body, str):
                response = requests.post(url, headers=headers, data=body, timeout=timeout)
            else:
                response = requests.post(url, headers=headers, json=body, timeout=timeout)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=body, timeout=timeout)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=body, timeout=timeout)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=timeout)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported HTTP method: {method}")
        
        # Parse response
        try:
            response_data = response.json()
        except:
            response_data = response.text
        
        return {
            "success": response.status_code >= 200 and response.status_code < 300,
            "status_code": response.status_code,
            "response": response_data,
            "headers": dict(response.headers)
        }
    
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=408, detail="Request timeout")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")


@app.post("/api/connectors/execute")
async def execute_connector(connector_id: str, variables: Dict[str, Any]):
    """Execute connector with rate limiting, circuit breaker, and retry logic"""
    connector = api_connectors_collection.find_one({"id": connector_id}, {"_id": 0})
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    # Check circuit breaker
    circuit_breaker = get_circuit_breaker(connector_id)
    if not circuit_breaker.can_attempt():
        return {
            "success": False,
            "error": "Circuit breaker is open. Too many recent failures.",
            "retry_after": circuit_breaker.timeout
        }
    
    # Check rate limiting
    rate_limiter = get_rate_limiter(connector_id)
    if rate_limiter:
        can_proceed, wait_time = rate_limiter.can_proceed()
        if not can_proceed:
            return {
                "success": False,
                "error": "Rate limit exceeded",
                "retry_after": wait_time
            }
    
    # Execute with retry logic and connection pooling
    try:
        async def execute_request():
            # Use connection pool semaphore to limit concurrent requests
            async with client_semaphores[connector_id]:
                return await _execute_connector_request(connector, variables)
        
        # Execute with retry and exponential backoff
        result = await execute_with_retry(
            execute_request,
            max_retries=connector.get("retry_config", {}).get("max_retries", 3),
            base_delay=connector.get("retry_config", {}).get("base_delay", 1.0)
        )
        
        # Record success in circuit breaker
        circuit_breaker.record_success()
        
        return result
        
    except Exception as e:
        # Record failure in circuit breaker
        circuit_breaker.record_failure()
        
        return {
            "success": False,
            "error": f"Connector execution failed: {str(e)}"
        }

async def _execute_connector_request(connector: Dict[str, Any], variables: Dict[str, Any]) -> Dict[str, Any]:
    """Internal function to execute connector request with connection pooling"""
    config = connector.get("config", {})
    
    # Replace variables in URL
    url = config.get("url", "")
    for var_name, var_value in variables.items():
        url = url.replace(f"${{{var_name}}}", str(var_value))
    
    # Replace variables in headers
    headers = {}
    for key, value in config.get("headers", {}).items():
        for var_name, var_value in variables.items():
            value = value.replace(f"${{{var_name}}}", str(var_value))
        headers[key] = value
    
    # Replace variables in body
    body = config.get("body")
    if body:
        if isinstance(body, str):
            for var_name, var_value in variables.items():
                body = body.replace(f"${{{var_name}}}", str(var_value))
        elif isinstance(body, dict):
            body = json.loads(json.dumps(body))
            body_str = json.dumps(body)
            for var_name, var_value in variables.items():
                body_str = body_str.replace(f"${{{var_name}}}", str(var_value))
            body = json.loads(body_str)
    
    # Get HTTP client with connection pooling
    client = get_http_client(connector["id"], timeout=config.get("timeout", 30))
    
    # Execute request
    method = config.get("method", "GET").upper()
    
    if method == "GET":
        response = await client.get(url, headers=headers)
    elif method == "POST":
        response = await client.post(url, headers=headers, json=body if isinstance(body, dict) else None, content=body if isinstance(body, str) else None)
    elif method == "PUT":
        response = await client.put(url, headers=headers, json=body if isinstance(body, dict) else None, content=body if isinstance(body, str) else None)
    elif method == "PATCH":
        response = await client.patch(url, headers=headers, json=body if isinstance(body, dict) else None)
    elif method == "DELETE":
        response = await client.delete(url, headers=headers)
    else:
        raise ValueError(f"Unsupported HTTP method: {method}")
    
    # Parse response
    try:
        response_data = response.json()
    except:
        response_data = {"text": response.text}
    
    if not response.is_success:
        raise HTTPException(status_code=response.status_code, detail=f"API request failed: {response.text}")
    
    # Map response to variables
    mapped_variables = {}
    for mapping in connector.get("response_mapping", []):
        source_path = mapping.get("source_path", "")
        target_variable = mapping.get("target_variable", "")
        
        # Simple JSON path extraction ($.field.subfield)
        value = response_data
        if source_path.startswith("$."):
            path_parts = source_path[2:].split(".")
            for part in path_parts:
                # Handle array indexing like $.items[0]
                if '[' in part and ']' in part:
                    field_name = part[:part.index('[')]
                    index = int(part[part.index('[')+1:part.index(']')])
                    if isinstance(value, dict) and field_name in value:
                        value = value[field_name]
                        if isinstance(value, list) and len(value) > index:
                            value = value[index]
                        else:
                            value = None
                            break
                elif isinstance(value, dict):
                    value = value.get(part)
                else:
                    value = None
                    break
        
        # Apply transformation
        transform = mapping.get("transform", "none")
        if transform == "uppercase" and isinstance(value, str):
            value = value.upper()
        elif transform == "lowercase" and isinstance(value, str):
            value = value.lower()
        
        mapped_variables[target_variable] = value
    
    return {
        "success": True,
        "status_code": response.status_code,
        "mapped_variables": mapped_variables,
        "raw_response": response_data,
        "elapsed_ms": response.elapsed.total_seconds() * 1000
    }


# ============================================================================
# PHASE 3.4: INTEGRATION ENHANCEMENTS
# ============================================================================

# OAuth 2.0 Management
oauth_states_collection = db['oauth_states']
oauth_tokens_collection = db['oauth_tokens']
webhook_endpoints_collection = db['webhook_endpoints']
webhook_logs_collection = db['webhook_logs']

# Rate limiting storage (in-memory for simplicity, use Redis in production)
rate_limit_cache = {}
circuit_breaker_states = {}

# Connection pooling for HTTP requests
import httpx
import asyncio
from collections import defaultdict

# HTTP client pool with connection pooling
http_clients = {}  # connector_id -> httpx.AsyncClient
client_semaphores = defaultdict(lambda: asyncio.Semaphore(10))  # Max 10 concurrent requests per connector

def get_http_client(connector_id: str, timeout: int = 30) -> httpx.AsyncClient:
    """Get or create HTTP client with connection pooling for a connector"""
    if connector_id not in http_clients:
        http_clients[connector_id] = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            limits=httpx.Limits(
                max_keepalive_connections=5,
                max_connections=10,
                keepalive_expiry=30.0
            ),
            follow_redirects=True
        )
    return http_clients[connector_id]

async def close_http_clients():
    """Close all HTTP clients on shutdown"""
    for client in http_clients.values():
        await client.aclose()
    http_clients.clear()

# Circuit Breaker implementation
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout  # seconds to wait before trying again
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open
    
    def record_success(self):
        """Record successful call"""
        self.failure_count = 0
        self.state = "closed"
    
    def record_failure(self):
        """Record failed call"""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "open"
    
    def can_attempt(self) -> bool:
        """Check if request can be attempted"""
        if self.state == "closed":
            return True
        
        if self.state == "open":
            # Check if timeout has passed
            if self.last_failure_time:
                elapsed = (datetime.utcnow() - self.last_failure_time).total_seconds()
                if elapsed >= self.timeout:
                    self.state = "half-open"
                    return True
            return False
        
        # half-open state: try one request
        return True

def get_circuit_breaker(connector_id: str) -> CircuitBreaker:
    """Get or create circuit breaker for connector"""
    if connector_id not in circuit_breaker_states:
        circuit_breaker_states[connector_id] = CircuitBreaker()
    return circuit_breaker_states[connector_id]

# Rate limiting implementation
class RateLimiter:
    def __init__(self, max_requests: int, time_window: int):
        self.max_requests = max_requests
        self.time_window = time_window  # in seconds
        self.requests = []  # list of timestamps
    
    def can_proceed(self) -> tuple[bool, float]:
        """Check if request can proceed. Returns (can_proceed, wait_time)"""
        now = datetime.utcnow()
        
        # Clean old requests outside time window
        cutoff = now - timedelta(seconds=self.time_window)
        self.requests = [ts for ts in self.requests if ts > cutoff]
        
        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True, 0.0
        
        # Calculate wait time
        oldest_request = min(self.requests)
        wait_time = (oldest_request + timedelta(seconds=self.time_window) - now).total_seconds()
        return False, max(0, wait_time)
    
    def record_request(self):
        """Record a new request"""
        self.requests.append(datetime.utcnow())

def get_rate_limiter(connector_id: str) -> Optional[RateLimiter]:
    """Get rate limiter for connector if configured"""
    connector = api_connectors_collection.find_one({"id": connector_id})
    if not connector:
        return None
    
    rate_limit_config = connector.get("rate_limit")
    if not rate_limit_config:
        return None
    
    cache_key = f"rate_limiter:{connector_id}"
    if cache_key not in rate_limit_cache:
        rate_limit_cache[cache_key] = RateLimiter(
            max_requests=rate_limit_config.get("max_requests", 100),
            time_window=rate_limit_config.get("time_window", 60)
        )
    
    return rate_limit_cache[cache_key]

# Retry logic with exponential backoff
async def execute_with_retry(
    func,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0
):
    """Execute function with exponential backoff retry logic"""
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except (httpx.TimeoutException, httpx.NetworkError, httpx.ConnectError) as e:
            last_exception = e
            
            if attempt < max_retries:
                # Calculate delay with exponential backoff
                delay = min(base_delay * (exponential_base ** attempt), max_delay)
                # Add jitter to prevent thundering herd
                jitter = delay * 0.1 * (2 * (hash(str(datetime.utcnow())) % 100) / 100 - 1)
                actual_delay = delay + jitter
                
                await asyncio.sleep(actual_delay)
            else:
                # Max retries exceeded
                raise last_exception
    
    raise last_exception if last_exception else Exception("Retry failed")

class OAuthConfig(BaseModel):
    provider: str  # salesforce, hubspot, servicenow, etc.
    client_id: str
    client_secret: str
    redirect_uri: str
    authorization_url: str
    token_url: str
    scopes: List[str] = []

class WebhookConfig(BaseModel):
    name: str
    url: str
    events: List[str]
    secret: Optional[str] = None
    headers: Dict[str, str] = {}
    active: bool = True

@app.post("/api/oauth/authorize")
async def initiate_oauth_flow(config: OAuthConfig):
    """Initiate OAuth 2.0 authorization flow"""
    state = str(uuid.uuid4())
    
    # Store state for verification
    oauth_states_collection.insert_one({
        "id": state,
        "provider": config.provider,
        "client_id": config.client_id,
        "redirect_uri": config.redirect_uri,
        "token_url": config.token_url,
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(minutes=10)).isoformat()
    })
    
    # Build authorization URL
    auth_params = {
        "client_id": config.client_id,
        "redirect_uri": config.redirect_uri,
        "response_type": "code",
        "state": state,
        "scope": " ".join(config.scopes) if config.scopes else ""
    }
    
    auth_url = config.authorization_url
    if "?" in auth_url:
        auth_url += "&"
    else:
        auth_url += "?"
    
    auth_url += "&".join([f"{k}={v}" for k, v in auth_params.items() if v])
    
    return {
        "authorization_url": auth_url,
        "state": state,
        "message": "Redirect user to authorization_url"
    }

@app.post("/api/oauth/callback")
async def oauth_callback(data: Dict[str, Any]):
    """Handle OAuth callback and exchange code for token"""
    code = data.get("code")
    state = data.get("state")
    
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state parameter")
    
    # Verify state
    state_doc = oauth_states_collection.find_one({"id": state})
    if not state_doc:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    # Check expiration
    expires_at = datetime.fromisoformat(state_doc["expires_at"])
    if datetime.utcnow() > expires_at:
        raise HTTPException(status_code=400, detail="State expired")
    
    # Exchange code for token
    token_url = state_doc["token_url"]
    client_id = state_doc["client_id"]
    redirect_uri = state_doc["redirect_uri"]
    
    # Get client_secret from request (should be passed securely)
    client_secret = data.get("client_secret")
    if not client_secret:
        raise HTTPException(status_code=400, detail="client_secret required")
    
    try:
        token_response = requests.post(
            token_url,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=token_response.status_code,
                detail=f"Token exchange failed: {token_response.text}"
            )
        
        token_data = token_response.json()
        
        # Store token
        token_id = str(uuid.uuid4())
        oauth_tokens_collection.insert_one({
            "id": token_id,
            "provider": state_doc["provider"],
            "access_token": token_data.get("access_token"),
            "refresh_token": token_data.get("refresh_token"),
            "token_type": token_data.get("token_type", "Bearer"),
            "expires_in": token_data.get("expires_in"),
            "scope": token_data.get("scope"),
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 3600))).isoformat()
        })
        
        # Clean up state
        oauth_states_collection.delete_one({"id": state})
        
        return {
            "success": True,
            "token_id": token_id,
            "access_token": token_data.get("access_token"),
            "refresh_token": token_data.get("refresh_token"),
            "expires_in": token_data.get("expires_in")
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Token exchange failed: {str(e)}")

@app.post("/api/oauth/refresh")
async def refresh_oauth_token(data: Dict[str, Any]):
    """Refresh OAuth access token using refresh token"""
    token_id = data.get("token_id")
    
    if not token_id:
        raise HTTPException(status_code=400, detail="token_id required")
    
    token_doc = oauth_tokens_collection.find_one({"id": token_id})
    if not token_doc:
        raise HTTPException(status_code=404, detail="Token not found")
    
    refresh_token = token_doc.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="No refresh token available")
    
    # Provider-specific token refresh (simplified - should be configured per provider)
    token_url = data.get("token_url")
    client_id = data.get("client_id")
    client_secret = data.get("client_secret")
    
    if not all([token_url, client_id, client_secret]):
        raise HTTPException(status_code=400, detail="token_url, client_id, and client_secret required")
    
    try:
        refresh_response = requests.post(
            token_url,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": client_id,
                "client_secret": client_secret
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if refresh_response.status_code != 200:
            raise HTTPException(
                status_code=refresh_response.status_code,
                detail=f"Token refresh failed: {refresh_response.text}"
            )
        
        new_token_data = refresh_response.json()
        
        # Update stored token
        oauth_tokens_collection.update_one(
            {"id": token_id},
            {"$set": {
                "access_token": new_token_data.get("access_token"),
                "refresh_token": new_token_data.get("refresh_token", refresh_token),
                "expires_in": new_token_data.get("expires_in"),
                "updated_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(seconds=new_token_data.get("expires_in", 3600))).isoformat()
            }}
        )
        
        return {
            "success": True,
            "access_token": new_token_data.get("access_token"),
            "expires_in": new_token_data.get("expires_in")
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Token refresh failed: {str(e)}")

@app.get("/api/oauth/tokens")
async def get_oauth_tokens():
    """Get all stored OAuth tokens"""
    tokens = list(oauth_tokens_collection.find({}, {"_id": 0, "access_token": 0, "refresh_token": 0}))
    return {"tokens": tokens, "count": len(tokens)}

@app.delete("/api/oauth/tokens/{token_id}")
async def revoke_oauth_token(token_id: str):
    """Revoke and delete OAuth token"""
    result = oauth_tokens_collection.delete_one({"id": token_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Token not found")
    return {"message": "Token revoked successfully"}

# Rate Limiting & Circuit Breaker
class RateLimitConfig(BaseModel):
    connector_id: str
    max_requests: int = 100
    time_window: int = 60  # seconds
    retry_after: int = 60  # seconds to wait after limit exceeded

@app.post("/api/connectors/{connector_id}/rate-limit")
async def configure_rate_limit(connector_id: str, config: RateLimitConfig):
    """Configure rate limiting for a connector"""
    connector = api_connectors_collection.find_one({"id": connector_id})
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    api_connectors_collection.update_one(
        {"id": connector_id},
        {"$set": {
            "rate_limit": config.dict(),
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    
    # Clear existing rate limiter to force recreation with new config
    cache_key = f"rate_limiter:{connector_id}"
    if cache_key in rate_limit_cache:
        del rate_limit_cache[cache_key]
    
    return {"message": "Rate limit configured successfully"}

@app.get("/api/connectors/{connector_id}/circuit-breaker/status")
async def get_circuit_breaker_status(connector_id: str):
    """Get circuit breaker status for connector"""
    connector = api_connectors_collection.find_one({"id": connector_id})
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    circuit_breaker = circuit_breaker_states.get(connector_id)
    
    if not circuit_breaker:
        return {
            "connector_id": connector_id,
            "circuit_breaker": {
                "state": "not_initialized",
                "failure_count": 0,
                "last_failure_time": None,
                "can_attempt": True
            }
        }
    
    return {
        "connector_id": connector_id,
        "connector_name": connector.get("name", connector_id),
        "circuit_breaker": {
            "state": circuit_breaker.state,
            "failure_count": circuit_breaker.failure_count,
            "failure_threshold": circuit_breaker.failure_threshold,
            "last_failure_time": circuit_breaker.last_failure_time.isoformat() if circuit_breaker.last_failure_time else None,
            "timeout_seconds": circuit_breaker.timeout,
            "can_attempt": circuit_breaker.can_attempt(),
            "time_until_retry": None if circuit_breaker.state != "open" else max(0, circuit_breaker.timeout - (datetime.utcnow() - circuit_breaker.last_failure_time).total_seconds()) if circuit_breaker.last_failure_time else 0
        }
    }

@app.post("/api/connectors/{connector_id}/circuit-breaker/reset")
async def reset_circuit_breaker(connector_id: str):
    """Reset circuit breaker for a connector"""
    connector = api_connectors_collection.find_one({"id": connector_id})
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    if connector_id in circuit_breaker_states:
        del circuit_breaker_states[connector_id]
    
    return {
        "message": f"Circuit breaker reset successfully for connector {connector_id}",
        "connector_id": connector_id,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/connectors/circuit-breakers/status")
async def get_all_circuit_breakers_status():
    """Get status of all circuit breakers"""
    breakers = {}
    
    for connector_id, circuit_breaker in circuit_breaker_states.items():
        connector = api_connectors_collection.find_one({"id": connector_id})
        
        breakers[connector_id] = {
            "connector_id": connector_id,
            "connector_name": connector.get("name", connector_id) if connector else connector_id,
            "state": circuit_breaker.state,
            "failure_count": circuit_breaker.failure_count,
            "failure_threshold": circuit_breaker.failure_threshold,
            "last_failure_time": circuit_breaker.last_failure_time.isoformat() if circuit_breaker.last_failure_time else None,
            "can_attempt": circuit_breaker.can_attempt()
        }
    
    # Summary statistics
    total = len(breakers)
    open_count = sum(1 for b in breakers.values() if b["state"] == "open")
    half_open_count = sum(1 for b in breakers.values() if b["state"] == "half-open")
    closed_count = sum(1 for b in breakers.values() if b["state"] == "closed")
    
    return {
        "summary": {
            "total": total,
            "open": open_count,
            "half_open": half_open_count,
            "closed": closed_count,
            "health": "healthy" if open_count == 0 else "degraded" if open_count < total / 2 else "critical"
        },
        "circuit_breakers": breakers,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/connectors/{connector_id}/rate-limit/status")
async def get_rate_limit_status(connector_id: str):
    """Get current rate limit status for connector"""
    connector = api_connectors_collection.find_one({"id": connector_id})
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    rate_limit_config = connector.get("rate_limit", {})
    
    # Get rate limiter
    cache_key = f"rate_limiter:{connector_id}"
    rate_limiter = rate_limit_cache.get(cache_key)
    
    current_usage = {
        "configured": bool(rate_limit_config),
        "max_requests": rate_limit_config.get("max_requests", 0),
        "time_window": rate_limit_config.get("time_window", 0),
        "current_requests": len(rate_limiter.requests) if rate_limiter else 0,
        "available_requests": rate_limit_config.get("max_requests", 0) - (len(rate_limiter.requests) if rate_limiter else 0),
        "can_proceed": True,
        "wait_time": 0
    }
    
    if rate_limiter:
        can_proceed, wait_time = rate_limiter.can_proceed()
        current_usage["can_proceed"] = can_proceed
        current_usage["wait_time"] = wait_time
    
    return {
        "connector_id": connector_id,
        "rate_limit": rate_limit_config,
        "current_usage": current_usage.get("count", 0),
        "max_requests": rate_limit.get("max_requests", 100),
        "reset_at": current_usage.get("reset_at"),
        "available": rate_limit.get("max_requests", 100) - current_usage.get("count", 0)
    }

# Webhook Management
@app.post("/api/webhooks")
async def create_webhook(webhook: WebhookConfig):
    """Register a new webhook endpoint"""
    webhook_id = str(uuid.uuid4())
    webhook_token = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    webhook_dict = webhook.dict()
    webhook_dict["id"] = webhook_id
    webhook_dict["token"] = webhook_token
    webhook_dict["created_at"] = now
    webhook_dict["updated_at"] = now
    webhook_dict["total_calls"] = 0
    webhook_dict["last_called_at"] = None
    
    webhook_endpoints_collection.insert_one(webhook_dict)
    
    return {
        "message": "Webhook created successfully",
        "id": webhook_id,
        "token": webhook_token,
        "endpoint_url": f"/api/webhooks/{webhook_id}/receive"
    }

@app.get("/api/webhooks")
async def get_webhooks():
    """Get all registered webhooks"""
    webhooks = list(webhook_endpoints_collection.find({}, {"_id": 0}))
    return {"webhooks": webhooks, "count": len(webhooks)}

@app.get("/api/webhooks/{webhook_id}")
async def get_webhook(webhook_id: str):
    """Get webhook details"""
    webhook = webhook_endpoints_collection.find_one({"id": webhook_id}, {"_id": 0})
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return webhook

@app.put("/api/webhooks/{webhook_id}")
async def update_webhook(webhook_id: str, webhook: WebhookConfig):
    """Update webhook configuration"""
    existing = webhook_endpoints_collection.find_one({"id": webhook_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    webhook_dict = webhook.dict()
    webhook_dict["id"] = webhook_id
    webhook_dict["token"] = existing.get("token")
    webhook_dict["created_at"] = existing.get("created_at")
    webhook_dict["updated_at"] = datetime.utcnow().isoformat()
    webhook_dict["total_calls"] = existing.get("total_calls", 0)
    webhook_dict["last_called_at"] = existing.get("last_called_at")
    
    webhook_endpoints_collection.replace_one({"id": webhook_id}, webhook_dict)
    
    return {"message": "Webhook updated successfully"}

@app.delete("/api/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: str):
    """Delete webhook"""
    result = webhook_endpoints_collection.delete_one({"id": webhook_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return {"message": "Webhook deleted successfully"}

@app.post("/api/webhooks/{webhook_id}/receive")
async def receive_webhook(webhook_id: str, data: Dict[str, Any], background_tasks: BackgroundTasks):
    """Receive webhook payload"""
    webhook = webhook_endpoints_collection.find_one({"id": webhook_id})
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    if not webhook.get("active", True):
        raise HTTPException(status_code=403, detail="Webhook is inactive")
    
    # Log webhook call
    log_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    webhook_logs_collection.insert_one({
        "id": log_id,
        "webhook_id": webhook_id,
        "payload": data,
        "received_at": now,
        "status": "received"
    })
    
    # Update webhook stats
    webhook_endpoints_collection.update_one(
        {"id": webhook_id},
        {
            "$inc": {"total_calls": 1},
            "$set": {"last_called_at": now}
        }
    )
    
    # Process webhook in background
    def process_webhook():
        try:
            # Forward to configured URL
            if webhook.get("url"):
                headers = webhook.get("headers", {})
                requests.post(webhook["url"], json=data, headers=headers, timeout=30)
            
            webhook_logs_collection.update_one(
                {"id": log_id},
                {"$set": {"status": "processed", "processed_at": datetime.utcnow().isoformat()}}
            )
        except Exception as e:
            webhook_logs_collection.update_one(
                {"id": log_id},
                {"$set": {"status": "failed", "error": str(e), "processed_at": datetime.utcnow().isoformat()}}
            )
    
    background_tasks.add_task(process_webhook)
    
    return {"message": "Webhook received", "log_id": log_id}

@app.get("/api/webhooks/{webhook_id}/logs")
async def get_webhook_logs(webhook_id: str, limit: int = 50):
    """Get webhook call logs"""
    webhook = webhook_endpoints_collection.find_one({"id": webhook_id})
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    logs = list(webhook_logs_collection.find(
        {"webhook_id": webhook_id},
        {"_id": 0}
    ).sort("received_at", -1).limit(limit))
    
    return {"logs": logs, "count": len(logs)}

@app.post("/api/webhooks/{webhook_id}/test")
async def test_webhook(webhook_id: str, test_payload: Dict[str, Any]):
    """Test webhook with sample payload"""
    webhook = webhook_endpoints_collection.find_one({"id": webhook_id})
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    try:
        if webhook.get("url"):
            headers = webhook.get("headers", {})
            response = requests.post(
                webhook["url"],
                json=test_payload,
                headers=headers,
                timeout=30
            )
            
            return {
                "success": True,
                "status_code": response.status_code,
                "response": response.text[:1000]  # Limit response size
            }
        else:
            return {
                "success": True,
                "message": "Webhook has no URL configured, payload would be logged only"
            }
    except requests.RequestException as e:
        return {
            "success": False,
            "error": str(e)
        }


# ============================================================================
# CONNECTION POOL HEALTH AND STATISTICS ENDPOINTS
# ============================================================================

@app.get("/api/connectors/pool/health")
async def get_connection_pool_health():
    """Get health status of all connection pools"""
    pool_health = {}
    
    for connector_id, client in http_clients.items():
        try:
            # Get connection pool statistics
            pool_info = {
                "connector_id": connector_id,
                "is_closed": client.is_closed,
                "active_connections": len(client._transport._pool._connections) if hasattr(client, '_transport') and hasattr(client._transport, '_pool') else 0,
                "status": "healthy" if not client.is_closed else "closed"
            }
            
            # Check semaphore availability
            semaphore = client_semaphores.get(connector_id)
            if semaphore:
                pool_info["available_slots"] = semaphore._value
                pool_info["max_concurrent"] = semaphore._initial_value
                pool_info["in_use"] = semaphore._initial_value - semaphore._value
            
            pool_health[connector_id] = pool_info
            
        except Exception as e:
            pool_health[connector_id] = {
                "connector_id": connector_id,
                "status": "error",
                "error": str(e)
            }
    
    overall_status = "healthy"
    if any(pool.get("status") == "error" for pool in pool_health.values()):
        overall_status = "degraded"
    elif any(pool.get("status") == "closed" for pool in pool_health.values()):
        overall_status = "partial"
    
    return {
        "overall_status": overall_status,
        "total_pools": len(pool_health),
        "pools": pool_health,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/connectors/pool/statistics")
async def get_connection_pool_statistics():
    """Get detailed statistics for all connection pools"""
    statistics = {}
    
    for connector_id, client in http_clients.items():
        try:
            connector = api_connectors_collection.find_one({"id": connector_id})
            connector_name = connector.get("name", connector_id) if connector else connector_id
            
            stats = {
                "connector_id": connector_id,
                "connector_name": connector_name,
                "client_status": "active" if not client.is_closed else "closed",
                "created_at": getattr(client, '_created_at', None),
            }
            
            # Connection pool stats
            if hasattr(client, '_transport') and hasattr(client._transport, '_pool'):
                pool = client._transport._pool
                stats.update({
                    "pool_connections": len(pool._connections),
                    "max_keepalive": getattr(pool, '_max_keepalive_connections', 'unknown'),
                    "max_connections": getattr(pool, '_max_connections', 'unknown')
                })
            
            # Semaphore stats
            semaphore = client_semaphores.get(connector_id)
            if semaphore:
                stats.update({
                    "max_concurrent_requests": semaphore._initial_value,
                    "available_slots": semaphore._value,
                    "active_requests": semaphore._initial_value - semaphore._value,
                    "utilization_percent": round(((semaphore._initial_value - semaphore._value) / semaphore._initial_value) * 100, 2)
                })
            
            statistics[connector_id] = stats
            
        except Exception as e:
            statistics[connector_id] = {
                "connector_id": connector_id,
                "error": str(e),
                "status": "error"
            }
    
    return {
        "statistics": statistics,
        "total_connectors": len(statistics),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/connectors/{connector_id}/pool/reset")
async def reset_connection_pool(connector_id: str):
    """Reset connection pool for a specific connector"""
    if connector_id not in http_clients:
        raise HTTPException(status_code=404, detail="Connection pool not found for connector")
    
    try:
        # Close existing client
        old_client = http_clients[connector_id]
        await old_client.aclose()
        
        # Remove from pool
        del http_clients[connector_id]
        
        # Reset semaphore
        if connector_id in client_semaphores:
            del client_semaphores[connector_id]
        
        return {
            "message": f"Connection pool reset successfully for connector {connector_id}",
            "connector_id": connector_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset connection pool: {str(e)}")

@app.post("/api/connectors/pool/cleanup")
async def cleanup_connection_pools():
    """Clean up all inactive connection pools"""
    cleaned_pools = []
    errors = []
    
    for connector_id, client in list(http_clients.items()):
        try:
            if client.is_closed:
                del http_clients[connector_id]
                if connector_id in client_semaphores:
                    del client_semaphores[connector_id]
                cleaned_pools.append(connector_id)
        except Exception as e:
            errors.append({
                "connector_id": connector_id,
                "error": str(e)
            })
    
    return {
        "message": f"Cleaned up {len(cleaned_pools)} inactive connection pools",
        "cleaned_pools": cleaned_pools,
        "errors": errors,
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# SPRINT 4: ADVANCED DEBUGGING ENDPOINTS
# ============================================================================

@app.post("/api/instances/{instance_id}/breakpoints")
async def add_breakpoint(instance_id: str, breakpoint: Breakpoint):
    """Add breakpoint to workflow instance"""
    instance = workflow_instances_collection.find_one({"id": instance_id})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    breakpoints = instance.get("breakpoints", [])
    
    # Check if breakpoint already exists for this node
    existing_idx = next((i for i, bp in enumerate(breakpoints) if bp["node_id"] == breakpoint.node_id), None)
    
    if existing_idx is not None:
        # Update existing breakpoint
        breakpoints[existing_idx] = breakpoint.dict()
    else:
        # Add new breakpoint
        breakpoints.append(breakpoint.dict())
    
    workflow_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {"breakpoints": breakpoints}}
    )
    
    return {"message": "Breakpoint added successfully", "breakpoints": breakpoints}


@app.delete("/api/instances/{instance_id}/breakpoints/{node_id}")
async def remove_breakpoint(instance_id: str, node_id: str):
    """Remove breakpoint from workflow instance"""
    instance = workflow_instances_collection.find_one({"id": instance_id})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    breakpoints = instance.get("breakpoints", [])
    breakpoints = [bp for bp in breakpoints if bp["node_id"] != node_id]
    
    workflow_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {"breakpoints": breakpoints}}
    )
    
    return {"message": "Breakpoint removed successfully", "breakpoints": breakpoints}


@app.put("/api/instances/{instance_id}/breakpoints/{node_id}")
async def update_breakpoint(instance_id: str, node_id: str, breakpoint: Breakpoint):
    """Update breakpoint (enable/disable or change condition)"""
    instance = workflow_instances_collection.find_one({"id": instance_id})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    breakpoints = instance.get("breakpoints", [])
    
    # Find and update breakpoint
    for bp in breakpoints:
        if bp["node_id"] == node_id:
            bp["enabled"] = breakpoint.enabled
            bp["condition"] = breakpoint.condition
            break
    
    workflow_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {"breakpoints": breakpoints}}
    )
    
    return {"message": "Breakpoint updated successfully", "breakpoints": breakpoints}


@app.get("/api/instances/{instance_id}/breakpoints")
async def get_breakpoints(instance_id: str):
    """List all breakpoints for workflow instance"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    return {"breakpoints": instance.get("breakpoints", [])}


@app.post("/api/instances/{instance_id}/debug/step")
async def debug_step(instance_id: str):
    """Step to next node in debug mode"""
    instance = workflow_instances_collection.find_one({"id": instance_id})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    # Set debug_mode flag
    workflow_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {"debug_mode": True, "debug_action": "step"}}
    )
    
    return {"message": "Stepping to next node", "debug_mode": True}


@app.post("/api/instances/{instance_id}/debug/continue")
async def debug_continue(instance_id: str):
    """Continue execution until next breakpoint"""
    instance = workflow_instances_collection.find_one({"id": instance_id})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    workflow_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {"debug_mode": True, "debug_action": "continue"}}
    )
    
    return {"message": "Continuing execution", "debug_mode": True}


@app.post("/api/instances/{instance_id}/debug/pause")
async def debug_pause(instance_id: str):
    """Pause execution"""
    instance = workflow_instances_collection.find_one({"id": instance_id})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    workflow_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {"debug_mode": True, "debug_action": "pause"}}
    )
    
    return {"message": "Execution paused", "debug_mode": True}


@app.get("/api/instances/{instance_id}/debug/state")
async def get_debug_state(instance_id: str):
    """Get current debug state"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    return {
        "debug_mode": instance.get("debug_mode", False),
        "debug_action": instance.get("debug_action"),
        "current_node": instance.get("current_node"),
        "breakpoints": instance.get("breakpoints", []),
        "status": instance.get("status")
    }


@app.get("/api/instances/{instance_id}/logs")
async def get_execution_logs(instance_id: str, level: Optional[str] = None):
    """Get execution logs with optional level filtering"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    logs = instance.get("execution_logs", [])
    
    if level:
        logs = [log for log in logs if log.get("level") == level]
    
    return {"logs": logs, "count": len(logs)}


@app.post("/api/instances/{instance_id}/logs")
async def add_execution_log(instance_id: str, log: ExecutionLog):
    """Add log entry to workflow instance"""
    instance = workflow_instances_collection.find_one({"id": instance_id})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    logs = instance.get("execution_logs", [])
    logs.append(log.dict())
    
    # Keep only last 1000 logs to prevent bloat
    if len(logs) > 1000:
        logs = logs[-1000:]
    
    workflow_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {"execution_logs": logs}}
    )
    
    return {"message": "Log added successfully"}


@app.get("/api/instances/{instance_id}/performance")
async def get_performance_profile(instance_id: str):
    """Get performance profiling data"""
    instance = workflow_instances_collection.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    execution_history = instance.get("execution_history", [])
    
    # Calculate performance metrics
    total_duration_ms = 0
    node_performance = []
    
    for entry in execution_history:
        if entry.get("started_at") and entry.get("completed_at"):
            try:
                start = datetime.fromisoformat(entry["started_at"])
                end = datetime.fromisoformat(entry["completed_at"])
                duration_ms = int((end - start).total_seconds() * 1000)
                total_duration_ms += duration_ms
                
                node_performance.append({
                    "node_id": entry.get("node_id"),
                    "duration_ms": duration_ms,
                    "status": entry.get("status")
                })
            except:
                pass
    
    # Sort by duration (slowest first)
    node_performance.sort(key=lambda x: x["duration_ms"], reverse=True)
    
    return {
        "total_duration_ms": total_duration_ms,
        "nodes": node_performance,
        "slowest_nodes": node_performance[:5]
    }


# ============================================================================
# PHASE 2: AI-POWERED FEATURES
# ============================================================================

from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv
load_dotenv()


class AIWorkflowRequest(BaseModel):
    description: str
    industry: str = "general"
    preferences: Dict[str, Any] = {}


@app.post("/api/ai/generate-workflow")
async def generate_workflow_with_ai(request: AIWorkflowRequest):
    """
    Generate workflow structure from natural language description using AI
    """
    try:
        # Get API key from environment
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"workflow-gen-{uuid.uuid4()}",
            system_message="""You are a workflow design expert. Your task is to convert natural language descriptions into structured workflow definitions.

Generate workflows that include:
- Appropriate node types (Start, Task, Form, Decision, Approval, Action, End)
- Logical connections between nodes
- Proper node positioning for visual layout
- Metadata like estimated time and suggestions

Return ONLY valid JSON with this structure:
{
  "name": "Workflow Name",
  "description": "Brief description",
  "nodes": [{"id": "uuid", "type": "start|task|form|decision|approval|action|end", "data": {"label": "...", "description": "..."}, "position": {"x": 100, "y": 100}}],
  "edges": [{"id": "uuid", "source": "node-id", "target": "node-id"}],
  "metadata": {"nodeTypes": ["Task", "Approval"], "estimatedTime": "~10min", "suggestions": ["Add notifications", "Consider adding validation"]}
}"""
        ).with_model("openai", "gpt-4o-mini")
        
        # Create prompt
        prompt = f"""Create a workflow for the {request.industry} industry:

Description: {request.description}

Preferences:
- Include approvals: {request.preferences.get('includeApprovals', True)}
- Include forms: {request.preferences.get('includeForms', True)}
- Include notifications: {request.preferences.get('includeNotifications', True)}

Generate a complete, executable workflow with all necessary nodes and connections."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse AI response
        import json
        import re
        
        # Extract JSON from response (handle markdown code blocks)
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response, re.DOTALL)
        if json_match:
            workflow_json = json_match.group(1)
        else:
            workflow_json = response
        
        workflow = json.loads(workflow_json)
        
        # Add required fields
        workflow['id'] = str(uuid.uuid4())
        workflow['created_at'] = datetime.utcnow().isoformat()
        workflow['updated_at'] = datetime.utcnow().isoformat()
        workflow['status'] = 'draft'
        workflow['tags'] = ['ai-generated', request.industry]
        
        # Ensure all nodes have proper IDs and structure
        for node in workflow.get('nodes', []):
            if 'id' not in node:
                node['id'] = str(uuid.uuid4())
            if 'data' not in node:
                node['data'] = {}
            if 'position' not in node:
                node['position'] = {'x': 100, 'y': 100}
        
        # Ensure all edges have proper IDs
        for edge in workflow.get('edges', []):
            if 'id' not in edge:
                edge['id'] = str(uuid.uuid4())
        
        return {"workflow": workflow, "success": True}
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI response parsing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@app.post("/api/ai/optimize-workflow")
async def optimize_workflow_with_ai(workflow_id: str):
    """
    Get AI-powered optimization suggestions for an existing workflow
    """
    try:
        workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"workflow-opt-{uuid.uuid4()}",
            system_message="You are a workflow optimization expert. Analyze workflows and provide actionable improvement suggestions."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""Analyze this workflow and provide optimization suggestions:

Workflow Name: {workflow.get('name')}
Description: {workflow.get('description')}
Number of nodes: {len(workflow.get('nodes', []))}
Number of edges: {len(workflow.get('edges', []))}

Node types: {', '.join(set(n.get('type', 'unknown') for n in workflow.get('nodes', [])))}

Provide 3-5 specific, actionable suggestions to improve efficiency, reliability, or user experience.
Return as JSON array of strings: ["suggestion 1", "suggestion 2", ...]"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse suggestions
        import json
        import re
        
        json_match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', response, re.DOTALL)
        if json_match:
            suggestions_json = json_match.group(1)
        else:
            # Try to find array in response
            suggestions_json = re.search(r'\[.*?\]', response, re.DOTALL)
            suggestions_json = suggestions_json.group(0) if suggestions_json else '[]'
        
        suggestions = json.loads(suggestions_json)
        
        return {
            "workflow_id": workflow_id,
            "suggestions": suggestions,
            "analysis_date": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@app.post("/api/ai/suggest-config")
async def suggest_node_config_with_ai(node_type: str, context: Dict[str, Any] = {}):
    """
    Get AI-powered configuration suggestions for a node
    """
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"node-config-{uuid.uuid4()}",
            system_message="You are a workflow configuration expert. Provide best practice configuration recommendations."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""Suggest optimal configuration for a {node_type} node in a workflow.

Context: {json.dumps(context, indent=2)}

Provide recommendations for:
- Timeout values
- Retry settings
- Error handling approach
- Notifications
- Any node-specific best practices

Return as JSON object with recommended values and explanations."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {
            "node_type": node_type,
            "suggestions": response,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Configuration suggestion failed: {str(e)}")


# =============================================================================
# PHASE 2: Workflow Patterns & Components API
# =============================================================================

class WorkflowComponent(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    category: str  # 'approval', 'notification', 'data_processing', 'integration'
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    input_variables: List[str] = []
    output_variables: List[str] = []
    tags: List[str] = []
    usage_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@app.get("/api/components")
async def get_workflow_components(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    """
    Get reusable workflow components/patterns.
    These are pre-built node groups that can be inserted into workflows.
    """
    try:
        query = {}
        
        if category:
            query["category"] = category
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$in": [search]}}
            ]
        
        components = list(components_collection.find(query).limit(limit))
        
        for component in components:
            component["id"] = str(component.pop("_id"))
        
        return {
            "components": components,
            "count": len(components),
            "categories": ["approval", "notification", "data_processing", "integration", "error_handling"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch components: {str(e)}")


@app.post("/api/components")
async def create_workflow_component(component: WorkflowComponent):
    """
    Save a reusable workflow component.
    Users can save groups of nodes as reusable components.
    """
    try:
        component_data = component.dict(exclude={"id"})
        component_data["created_at"] = datetime.utcnow().isoformat()
        component_data["updated_at"] = datetime.utcnow().isoformat()
        component_data["usage_count"] = 0
        
        result = components_collection.insert_one(component_data)
        component_data["id"] = str(result.inserted_id)
        
        return {
            "message": "Component created successfully",
            "component": component_data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create component: {str(e)}")


@app.get("/api/components/{component_id}")
async def get_workflow_component(component_id: str):
    """Get a specific workflow component by ID."""
    try:
        from bson import ObjectId
        component = components_collection.find_one({"_id": ObjectId(component_id)})
        
        if not component:
            raise HTTPException(status_code=404, detail="Component not found")
        
        component["id"] = str(component.pop("_id"))
        
        # Increment usage count
        components_collection.update_one(
            {"_id": ObjectId(component_id)},
            {"$inc": {"usage_count": 1}}
        )
        
        return component
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch component: {str(e)}")


@app.delete("/api/components/{component_id}")
async def delete_workflow_component(component_id: str):
    """Delete a workflow component."""
    try:
        from bson import ObjectId
        result = components_collection.delete_one({"_id": ObjectId(component_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Component not found")
        
        return {"message": "Component deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete component: {str(e)}")


@app.get("/api/patterns")
async def get_workflow_patterns():
    """
    Get common workflow patterns with best practices.
    These are pre-configured workflows demonstrating common patterns.
    """
    patterns = [
        {
            "id": "approval-chain",
            "name": "Multi-Level Approval Chain",
            "description": "Sequential approval flow with escalation and rejection handling",
            "category": "approval",
            "complexity": "medium",
            "nodes_count": 8,
            "use_cases": [
                "Invoice approval (manager → finance → CFO)",
                "Leave requests (supervisor → HR → department head)",
                "Purchase orders based on amount thresholds"
            ],
            "features": [
                "Conditional escalation based on amount/priority",
                "Automatic rejection routing",
                "Notification at each approval step",
                "Timeout handling with reminders"
            ]
        },
        {
            "id": "parallel-approval",
            "name": "Parallel Approval with Consensus",
            "description": "Multiple approvers review simultaneously, requires all/majority approval",
            "category": "approval",
            "complexity": "medium",
            "nodes_count": 6,
            "use_cases": [
                "Contract review (legal + finance + operations)",
                "Design approval (UX + engineering + product)",
                "Budget allocation (multiple department heads)"
            ],
            "features": [
                "Parallel execution for speed",
                "Configurable consensus rules (all, majority, any)",
                "Individual approval tracking",
                "Merge logic with decision routing"
            ]
        },
        {
            "id": "data-enrichment",
            "name": "Data Collection & Enrichment",
            "description": "Collect data via form, enrich with API calls, store in database",
            "category": "data_processing",
            "complexity": "medium",
            "nodes_count": 7,
            "use_cases": [
                "Customer onboarding (form → CRM API → database)",
                "Lead capture (form → lead scoring API → Salesforce)",
                "Survey processing (form → analysis API → reporting)"
            ],
            "features": [
                "Form data collection",
                "External API integration for enrichment",
                "Data transformation and validation",
                "Database storage with error handling"
            ]
        },
        {
            "id": "error-retry",
            "name": "Robust Error Handling & Retry",
            "description": "API call with automatic retry, fallback, and error notifications",
            "category": "error_handling",
            "complexity": "low",
            "nodes_count": 5,
            "use_cases": [
                "Payment processing with retry logic",
                "Third-party API calls with fallbacks",
                "Data synchronization with error tracking"
            ],
            "features": [
                "Automatic retry with exponential backoff",
                "Fallback to alternative service",
                "Error logging and notifications",
                "Circuit breaker pattern"
            ]
        },
        {
            "id": "scheduled-batch",
            "name": "Scheduled Batch Processing",
            "description": "Timer-triggered workflow that processes multiple records",
            "category": "data_processing",
            "complexity": "high",
            "nodes_count": 10,
            "use_cases": [
                "Nightly report generation",
                "Batch invoice processing",
                "Daily data synchronization",
                "Weekly reminder emails"
            ],
            "features": [
                "Scheduled trigger (cron)",
                "Loop through records",
                "Parallel processing for performance",
                "Success/failure reporting"
            ]
        },
        {
            "id": "notification-cascade",
            "name": "Smart Notification Cascade",
            "description": "Progressive notification with escalation based on response",
            "category": "notification",
            "complexity": "medium",
            "nodes_count": 7,
            "use_cases": [
                "Task reminders (email → Slack → SMS)",
                "Incident alerts with escalation",
                "Overdue follow-ups"
            ],
            "features": [
                "Multi-channel notifications",
                "Wait for response with timeout",
                "Automatic escalation",
                "Response tracking"
            ]
        }
    ]
    
    return {
        "patterns": patterns,
        "count": len(patterns),
        "categories": ["approval", "data_processing", "error_handling", "notification", "integration"]
    }


@app.get("/api/patterns/{pattern_id}")
async def get_workflow_pattern_details(pattern_id: str):
    """Get detailed workflow structure for a specific pattern."""
    
    # This would load actual workflow definitions
    # For now, returning a sample structure
    
    pattern_workflows = {
        "approval-chain": {
            "name": "Multi-Level Approval Chain",
            "nodes": [
                {
                    "id": "start-1",
                    "type": "start",
                    "position": {"x": 200, "y": 50},
                    "data": {"label": "Start", "type": "start"}
                },
                {
                    "id": "form-1",
                    "type": "form",
                    "position": {"x": 200, "y": 150},
                    "data": {
                        "label": "Request Form",
                        "description": "Collect request details",
                        "formId": "",
                        "type": "form"
                    }
                },
                {
                    "id": "decision-1",
                    "type": "decision",
                    "position": {"x": 200, "y": 270},
                    "data": {
                        "label": "Check Amount",
                        "description": "Route based on request amount",
                        "condition": "${amount} > 10000",
                        "type": "decision"
                    }
                },
                {
                    "id": "approval-1",
                    "type": "approval",
                    "position": {"x": 100, "y": 400},
                    "data": {
                        "label": "Manager Approval",
                        "approvers": [],
                        "approvalType": "single",
                        "type": "approval"
                    }
                },
                {
                    "id": "approval-2",
                    "type": "approval",
                    "position": {"x": 300, "y": 400},
                    "data": {
                        "label": "Senior Manager Approval",
                        "approvers": [],
                        "approvalType": "single",
                        "type": "approval"
                    }
                },
                {
                    "id": "end-approved",
                    "type": "end",
                    "position": {"x": 200, "y": 550},
                    "data": {"label": "Approved", "type": "end"}
                },
                {
                    "id": "end-rejected",
                    "type": "end",
                    "position": {"x": 400, "y": 550},
                    "data": {"label": "Rejected", "type": "end"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "start-1", "target": "form-1"},
                {"id": "e2", "source": "form-1", "target": "decision-1"},
                {"id": "e3", "source": "decision-1", "target": "approval-1", "sourceHandle": "no", "label": "≤10K"},
                {"id": "e4", "source": "decision-1", "target": "approval-2", "sourceHandle": "yes", "label": ">10K"},
                {"id": "e5", "source": "approval-1", "target": "end-approved"},
                {"id": "e6", "source": "approval-2", "target": "end-approved"}
            ]
        }
    }
    
    pattern = pattern_workflows.get(pattern_id)
    
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    
    return pattern


# ========== PHASE 3.1: ENHANCED SUB-WORKFLOW SUPPORT ==========

@app.get("/api/workflow-components")
async def get_workflow_components():
    """Get list of reusable workflow components (Phase 3.1)"""
    components = list(workflow_components_collection.find({}, {"_id": 0}))
    return {"components": components, "count": len(components)}


@app.post("/api/workflow-components")
async def create_workflow_component(component_data: Dict[str, Any]):
    """Create a new reusable workflow component (Phase 3.1)"""
    component_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    component = {
        "id": component_id,
        "name": component_data.get("name", "New Component"),
        "description": component_data.get("description", ""),
        "category": component_data.get("category", "custom"),
        "tags": component_data.get("tags", []),
        "nodes": component_data.get("nodes", []),
        "edges": component_data.get("edges", []),
        "input_variables": component_data.get("input_variables", []),
        "output_variables": component_data.get("output_variables", []),
        "version": "1.0.0",
        "created_at": now,
        "updated_at": now,
        "created_by": component_data.get("created_by", "system"),
        "is_public": component_data.get("is_public", False),
        "usage_count": 0
    }
    
    workflow_components_collection.insert_one(component)
    return {"message": "Component created", "component_id": component_id, "component": component}


@app.get("/api/workflow-components/{component_id}")
async def get_workflow_component(component_id: str):
    """Get a specific workflow component (Phase 3.1)"""
    component = workflow_components_collection.find_one({"id": component_id}, {"_id": 0})
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    # Increment usage count
    workflow_components_collection.update_one(
        {"id": component_id},
        {"$inc": {"usage_count": 1}}
    )
    
    return component


@app.put("/api/workflow-components/{component_id}")
async def update_workflow_component(component_id: str, component_data: Dict[str, Any]):
    """Update a workflow component (Phase 3.1)"""
    existing = workflow_components_collection.find_one({"id": component_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Component not found")
    
    # Increment version
    current_version = existing.get("version", "1.0.0")
    version_parts = current_version.split(".")
    version_parts[1] = str(int(version_parts[1]) + 1)
    new_version = ".".join(version_parts)
    
    update_data = {
        "name": component_data.get("name", existing.get("name")),
        "description": component_data.get("description", existing.get("description")),
        "category": component_data.get("category", existing.get("category")),
        "tags": component_data.get("tags", existing.get("tags")),
        "nodes": component_data.get("nodes", existing.get("nodes")),
        "edges": component_data.get("edges", existing.get("edges")),
        "input_variables": component_data.get("input_variables", existing.get("input_variables")),
        "output_variables": component_data.get("output_variables", existing.get("output_variables")),
        "version": new_version,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    workflow_components_collection.update_one(
        {"id": component_id},
        {"$set": update_data}
    )
    
    return {"message": "Component updated", "component_id": component_id, "version": new_version}


@app.delete("/api/workflow-components/{component_id}")
async def delete_workflow_component(component_id: str):
    """Delete a workflow component (Phase 3.1)"""
    result = workflow_components_collection.delete_one({"id": component_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Component not found")
    
    return {"message": "Component deleted", "component_id": component_id}


@app.get("/api/workflows/{workflow_id}/versions")
async def get_workflow_versions(workflow_id: str):
    """Get all versions of a workflow for subprocess version management (Phase 3.1)"""
    versions = list(workflow_versions_collection.find(
        {"workflow_id": workflow_id},
        {"_id": 0}
    ).sort("version_number", -1))
    
    return {"workflow_id": workflow_id, "versions": versions, "count": len(versions)}


@app.post("/api/workflows/{workflow_id}/use-as-subprocess")
async def mark_workflow_as_subprocess(workflow_id: str, metadata: Dict[str, Any] = None):
    """Mark a workflow as suitable for use as a subprocess (Phase 3.1)"""
    if metadata is None:
        metadata = {}
    
    workflow = workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    update_data = {
        "is_subprocess_compatible": True,
        "subprocess_metadata": {
            "input_schema": metadata.get("input_schema", {}),
            "output_schema": metadata.get("output_schema", {}),
            "required_inputs": metadata.get("required_inputs", []),
            "expected_outputs": metadata.get("expected_outputs", []),
            "max_execution_time": metadata.get("max_execution_time", 3600),
            "can_run_in_parallel": metadata.get("can_run_in_parallel", True),
            "marked_at": datetime.utcnow().isoformat()
        }
    }
    
    workflows_collection.update_one(
        {"id": workflow_id},
        {"$set": update_data}
    )
    
    return {
        "message": "Workflow marked as subprocess-compatible",
        "workflow_id": workflow_id,
        "metadata": update_data["subprocess_metadata"]
    }


@app.get("/api/workflows/subprocess-compatible")
async def get_subprocess_compatible_workflows():
    """Get all workflows that can be used as subprocesses (Phase 3.1)"""
    workflows = list(workflows_collection.find(
        {"is_subprocess_compatible": True},
        {"_id": 0, "id": 1, "name": 1, "description": 1, "subprocess_metadata": 1, "lifecycle_state": 1}
    ))
    
    return {"workflows": workflows, "count": len(workflows)}


@app.get("/api/workflow-instances/{instance_id}/subprocess-tree")
async def get_subprocess_tree(instance_id: str):
    """Get the complete subprocess execution tree for an instance (Phase 3.1)"""
    from subprocess_manager import SubprocessManager
    subprocess_manager = SubprocessManager(db)
    
    tree = subprocess_manager.get_subprocess_tree(instance_id)
    return {"subprocess_tree": tree}


@app.post("/api/workflow-instances/{instance_id}/resume-from-subprocess")
async def resume_from_subprocess(instance_id: str, data: Dict[str, Any]):
    """Resume parent workflow after subprocess completion (Phase 3.1)"""
    from subprocess_manager import SubprocessManager
    subprocess_manager = SubprocessManager(db)
    
    subprocess_instance_id = data.get("subprocess_instance_id")
    node_id = data.get("node_id")
    output_mapping = data.get("output_mapping", {})
    
    if not subprocess_instance_id or not node_id:
        raise HTTPException(status_code=400, detail="Missing required parameters")
    
    # Handle subprocess completion and get mapped outputs
    result_data = subprocess_manager.handle_subprocess_completion(
        subprocess_instance_id=subprocess_instance_id,
        parent_instance_id=instance_id,
        parent_node_id=node_id,
        output_mapping=output_mapping
    )
    
    # Resume parent workflow execution
    execution_engine.resume_execution(
        instance_id=instance_id,
        node_id=node_id,
        result_data=result_data
    )
    
    return {
        "message": "Parent workflow resumed",
        "instance_id": instance_id,
        "result_data": result_data
    }


@app.post("/api/workflows/{workflow_id}/create-version-snapshot")
async def create_version_snapshot(workflow_id: str, data: Dict[str, Any]):
    """Create a version snapshot for subprocess pinning (Phase 3.1)"""
    from subprocess_manager import SubprocessManager
    subprocess_manager = SubprocessManager(db)
    
    version_number = data.get("version", "1.0.0")
    comment = data.get("comment", "")
    
    try:
        version_id = subprocess_manager.create_version_snapshot(
            workflow_id=workflow_id,
            version_number=version_number,
            comment=comment
        )
        
        return {
            "message": "Version snapshot created",
            "version_id": version_id,
            "workflow_id": workflow_id,
            "version": version_number
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/workflows/{workflow_id}/versions/list")
async def list_workflow_versions(workflow_id: str):
    """List all version snapshots for a workflow (Phase 3.1)"""
    versions = list(workflow_versions_collection.find(
        {"workflow_id": workflow_id},
        {"_id": 0}
    ).sort("created_at", -1))
    
    return {
        "workflow_id": workflow_id,
        "versions": versions,
        "count": len(versions)
    }


@app.post("/api/workflows/{workflow_id}/validate-subprocess")
async def validate_subprocess_workflow(workflow_id: str, data: Dict[str, Any]):
    """Validate if a workflow can be used as subprocess (Phase 3.1)"""
    from subprocess_manager import SubprocessManager
    subprocess_manager = SubprocessManager(db)
    
    version = data.get("version", "latest")
    
    validation = subprocess_manager.validate_subprocess_compatibility(workflow_id, version)
    
    return {
        "workflow_id": workflow_id,
        "version": version,
        **validation
    }


@app.post("/api/workflow-components/from-selection")
async def create_component_from_selection(data: Dict[str, Any]):
    """Create reusable component from workflow selection (Phase 3.1)"""
    component_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    component = {
        "id": component_id,
        "name": data.get("name", "New Component"),
        "description": data.get("description", ""),
        "category": data.get("category", "custom"),
        "tags": data.get("tags", []),
        "nodes": data.get("nodes", []),
        "edges": data.get("edges", []),
        "input_variables": data.get("input_variables", []),
        "output_variables": data.get("output_variables", []),
        "version": "1.0.0",
        "created_at": now,
        "updated_at": now,
        "created_by": data.get("created_by", "system"),
        "is_public": data.get("is_public", False),
        "usage_count": 0,
        "source_workflow_id": data.get("source_workflow_id"),
        "thumbnail": data.get("thumbnail")
    }
    
    workflow_components_collection.insert_one(component)
    
    # Audit log
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow_component",
        "entity_id": component_id,
        "action": "created",
        "details": {"name": component["name"], "category": component["category"]},
        "timestamp": now
    })
    
    return {
        "message": "Component created successfully",
        "component_id": component_id,
        "component": component
    }


@app.get("/api/workflow-components/search")
async def search_workflow_components(
    query: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[str] = None
):
    """Search and filter reusable components (Phase 3.1)"""
    search_filter = {}
    
    if query:
        search_filter["$or"] = [
            {"name": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}}
        ]
    
    if category and category != "all":
        search_filter["category"] = category
    
    if tags:
        tag_list = tags.split(",")
        search_filter["tags"] = {"$in": tag_list}
    
    components = list(workflow_components_collection.find(search_filter, {"_id": 0}).sort("usage_count", -1))
    
    # Get categories for filtering
    all_categories = workflow_components_collection.distinct("category")
    
    return {
        "components": components,
        "count": len(components),
        "categories": all_categories
    }


# ========== PHASE 3.1: DATA TRANSFORMATION API ENDPOINTS ==========

from transformation_engine import (
    apply_transformation, 
    get_function_metadata,
    TRANSFORMATION_FUNCTIONS
)


@app.post("/api/transformations/test")
async def test_transformation(request: Dict[str, Any]):
    """
    Test a transformation function with provided data
    
    Request body:
    {
        "function": "split",
        "args": ["hello,world", ","],
        "kwargs": {}
    }
    """
    try:
        function_name = request.get("function")
        args = request.get("args", [])
        kwargs = request.get("kwargs", {})
        
        if not function_name:
            raise HTTPException(status_code=400, detail="Function name required")
        
        if function_name not in TRANSFORMATION_FUNCTIONS:
            raise HTTPException(status_code=400, detail=f"Unknown function: {function_name}")
        
        result = apply_transformation(function_name, *args, **kwargs)
        
        return {
            "success": True,
            "function": function_name,
            "input": {"args": args, "kwargs": kwargs},
            "output": result,
            "output_type": type(result).__name__
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "function": request.get("function"),
            "input": {"args": request.get("args", []), "kwargs": request.get("kwargs", {})}
        }


@app.post("/api/transformations/apply")
async def apply_transformations(request: Dict[str, Any]):
    """
    Apply multiple transformations in sequence
    
    Request body:
    {
        "data": {...},
        "transformations": [
            {"function": "split", "args": ["value", ","]},
            {"function": "filter", "args": ["{previous_result}", "> 5"]}
        ]
    }
    """
    try:
        data = request.get("data")
        transformations = request.get("transformations", [])
        
        if not transformations:
            return {"success": True, "result": data, "steps": []}
        
        result = data
        steps = []
        
        for i, transform in enumerate(transformations):
            function_name = transform.get("function")
            args = transform.get("args", [])
            kwargs = transform.get("kwargs", {})
            
            # Replace {previous_result} placeholder with actual result
            args = [result if arg == "{previous_result}" else arg for arg in args]
            
            try:
                result = apply_transformation(function_name, *args, **kwargs)
                steps.append({
                    "step": i + 1,
                    "function": function_name,
                    "success": True,
                    "result": result
                })
            except Exception as e:
                steps.append({
                    "step": i + 1,
                    "function": function_name,
                    "success": False,
                    "error": str(e)
                })
                return {
                    "success": False,
                    "error": f"Transformation failed at step {i + 1}: {str(e)}",
                    "steps": steps,
                    "partial_result": result
                }
        
        return {
            "success": True,
            "result": result,
            "steps": steps,
            "transformation_count": len(transformations)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/api/transformations/functions")
async def get_transformation_functions():
    """
    Get list of all available transformation functions with metadata
    """
    try:
        metadata = get_function_metadata()
        
        # Add function count summary
        summary = {
            "total_functions": sum(len(funcs) for funcs in metadata.values()),
            "categories": list(metadata.keys()),
            "category_counts": {category: len(funcs) for category, funcs in metadata.items()}
        }
        
        return {
            "success": True,
            "summary": summary,
            "functions": metadata
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching functions: {str(e)}")


@app.post("/api/transformations/parse-json")
async def parse_json_path(request: Dict[str, Any]):
    """
    Extract data using JSONPath expression
    
    Request body:
    {
        "data": {...},
        "path": "$.users[*].name"
    }
    """
    try:
        data = request.get("data")
        path = request.get("path")
        
        if not path:
            raise HTTPException(status_code=400, detail="JSONPath expression required")
        
        result = apply_transformation("jsonpath", data, path)
        
        return {
            "success": True,
            "path": path,
            "result": result,
            "result_type": type(result).__name__
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "path": request.get("path")
        }


@app.post("/api/transformations/parse-xml")
async def parse_xml(request: Dict[str, Any]):
    """
    Parse XML string to JSON
    
    Request body:
    {
        "xml": "<root>...</root>"
    }
    """
    try:
        xml_string = request.get("xml")
        
        if not xml_string:
            raise HTTPException(status_code=400, detail="XML string required")
        
        result = apply_transformation("parse_xml", xml_string)
        
        return {
            "success": True,
            "result": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/api/transformations/parse-csv")
async def parse_csv(request: Dict[str, Any]):
    """
    Parse CSV string to JSON array
    
    Request body:
    {
        "csv": "name,age\\nJohn,30\\nJane,25",
        "delimiter": ",",
        "has_header": true
    }
    """
    try:
        csv_string = request.get("csv")
        delimiter = request.get("delimiter", ",")
        has_header = request.get("has_header", True)
        
        if not csv_string:
            raise HTTPException(status_code=400, detail="CSV string required")
        
        result = apply_transformation("parse_csv", csv_string, delimiter, has_header)
        
        return {
            "success": True,
            "result": result,
            "row_count": len(result) if isinstance(result, list) else 0
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/api/transformations/to-csv")
async def convert_to_csv(request: Dict[str, Any]):
    """
    Convert JSON array to CSV string
    
    Request body:
    {
        "data": [{...}, {...}],
        "delimiter": ","
    }
    """
    try:
        data = request.get("data")
        delimiter = request.get("delimiter", ",")
        
        if not data:
            raise HTTPException(status_code=400, detail="Data required")
        
        result = apply_transformation("to_csv", data, delimiter)
        
        return {
            "success": True,
            "csv": result,
            "row_count": len(data) if isinstance(data, list) else 0
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ========== PHASE 3.1: ENHANCED SUB-WORKFLOW SUPPORT ENDPOINTS ==========

@app.get("/api/workflows/subprocess-compatible")
async def get_subprocess_compatible_workflows():
    """Get all workflows that can be used as subprocesses"""
    try:
        # Get all published and draft workflows
        workflows = list(workflows_collection.find({
            "$or": [
                {"lifecycle_state": {"$in": ["published", "draft"]}},
                {"status": {"$in": ["published", "draft"]}}
            ]
        }, {"_id": 0}))
        
        # Filter to ensure they have start and end nodes
        compatible_workflows = []
        for workflow in workflows:
            nodes = workflow.get("nodes", [])
            has_start = any(n.get("type") == "start" for n in nodes)
            has_end = any(n.get("type") == "end" for n in nodes)
            
            if has_start and has_end:
                compatible_workflows.append({
                    "id": workflow["id"],
                    "name": workflow["name"],
                    "description": workflow.get("description", ""),
                    "lifecycle_state": workflow.get("lifecycle_state", workflow.get("status", "draft")),
                    "is_subprocess_compatible": workflow.get("is_subprocess_compatible", False),
                    "subprocess_metadata": workflow.get("subprocess_metadata", {}),
                    "version": workflow.get("version", 1),
                    "updated_at": workflow.get("updated_at")
                })
        
        return {"workflows": compatible_workflows, "count": len(compatible_workflows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workflows/{workflow_id}/versions/list")
async def list_workflow_versions(workflow_id: str):
    """Get list of all versions for a workflow"""
    try:
        from subprocess_manager import SubprocessManager
        subprocess_manager = SubprocessManager(db)
        
        # Get versions from workflow_versions collection
        versions = list(workflow_versions_collection.find(
            {"workflow_id": workflow_id},
            {"_id": 0}
        ).sort("created_at", -1))
        
        return {
            "workflow_id": workflow_id,
            "versions": versions,
            "count": len(versions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflows/{workflow_id}/validate-subprocess")
async def validate_subprocess(workflow_id: str, request: Dict[str, Any]):
    """Validate if a workflow can be used as a subprocess"""
    try:
        from subprocess_manager import SubprocessManager
        subprocess_manager = SubprocessManager(db)
        
        version = request.get("version", "latest")
        validation_result = subprocess_manager.validate_subprocess_compatibility(workflow_id, version)
        
        return validation_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflows/{workflow_id}/subprocess/mark-compatible")
async def mark_workflow_subprocess_compatible(workflow_id: str, request: Dict[str, Any]):
    """Mark a workflow as subprocess-compatible with metadata"""
    try:
        workflow = workflows_collection.find_one({"id": workflow_id})
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        subprocess_metadata = request.get("subprocess_metadata", {})
        is_compatible = request.get("is_subprocess_compatible", True)
        
        now = datetime.utcnow().isoformat()
        
        workflows_collection.update_one(
            {"id": workflow_id},
            {
                "$set": {
                    "is_subprocess_compatible": is_compatible,
                    "subprocess_metadata": subprocess_metadata,
                    "updated_at": now
                }
            }
        )
        
        # Audit log
        audit_logs_collection.insert_one({
            "id": str(uuid.uuid4()),
            "entity_type": "workflow",
            "entity_id": workflow_id,
            "action": "marked_subprocess_compatible",
            "details": {
                "is_compatible": is_compatible,
                "metadata": subprocess_metadata
            },
            "timestamp": now
        })
        
        return {
            "message": "Workflow marked as subprocess-compatible" if is_compatible else "Workflow unmarked as subprocess-compatible",
            "is_subprocess_compatible": is_compatible,
            "subprocess_metadata": subprocess_metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workflow-instances/{instance_id}/subprocess-tree")
async def get_subprocess_execution_tree(instance_id: str):
    """Get complete execution tree including all nested subprocesses"""
    try:
        from subprocess_manager import SubprocessManager
        subprocess_manager = SubprocessManager(db)
        
        tree = subprocess_manager.get_subprocess_tree(instance_id)
        
        return tree
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflows/{workflow_id}/versions/create")
async def create_workflow_version_snapshot(workflow_id: str, request: Dict[str, Any]):
    """Create a version snapshot for subprocess version pinning"""
    try:
        from subprocess_manager import SubprocessManager
        subprocess_manager = SubprocessManager(db)
        
        version_number = request.get("version_number")
        comment = request.get("comment", "")
        
        if not version_number:
            raise HTTPException(status_code=400, detail="version_number is required")
        
        version_id = subprocess_manager.create_version_snapshot(workflow_id, version_number, comment)
        
        return {
            "message": "Version snapshot created successfully",
            "version_id": version_id,
            "version_number": version_number
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== WORKFLOW COMPONENTS LIBRARY (REUSABLE COMPONENTS) ==========

class WorkflowComponent(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    category: str = "general"  # general, approval, data_processing, communication, etc.
    tags: List[str] = []
    pattern: Dict[str, Any]  # The node configuration pattern
    is_public: bool = True
    created_by: Optional[str] = "system"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@app.get("/api/workflow-components")
async def get_workflow_components(category: Optional[str] = None):
    """Get all reusable workflow components"""
    try:
        query = {}
        if category:
            query["category"] = category
        
        components = list(workflow_components_collection.find(query, {"_id": 0}))
        return {"components": components, "count": len(components)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workflow-components/{component_id}")
async def get_workflow_component(component_id: str):
    """Get a specific workflow component"""
    try:
        component = workflow_components_collection.find_one({"id": component_id}, {"_id": 0})
        if not component:
            raise HTTPException(status_code=404, detail="Component not found")
        return component
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflow-components")
async def create_workflow_component(component: WorkflowComponent):
    """Create a new reusable workflow component"""
    try:
        component_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        component_dict = component.dict()
        component_dict["id"] = component_id
        component_dict["created_at"] = now
        component_dict["updated_at"] = now
        
        workflow_components_collection.insert_one(component_dict)
        
        # Audit log
        audit_logs_collection.insert_one({
            "id": str(uuid.uuid4()),
            "entity_type": "workflow_component",
            "entity_id": component_id,
            "action": "created",
            "timestamp": now
        })
        
        return {"message": "Component created successfully", "id": component_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/workflow-components/{component_id}")
async def update_workflow_component(component_id: str, component: WorkflowComponent):
    """Update a workflow component"""
    try:
        existing = workflow_components_collection.find_one({"id": component_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Component not found")
        
        now = datetime.utcnow().isoformat()
        component_dict = component.dict()
        component_dict["id"] = component_id
        component_dict["created_at"] = existing.get("created_at")
        component_dict["updated_at"] = now
        
        workflow_components_collection.replace_one({"id": component_id}, component_dict)
        
        # Audit log
        audit_logs_collection.insert_one({
            "id": str(uuid.uuid4()),
            "entity_type": "workflow_component",
            "entity_id": component_id,
            "action": "updated",
            "timestamp": now
        })
        
        return {"message": "Component updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/workflow-components/{component_id}")
async def delete_workflow_component(component_id: str):
    """Delete a workflow component"""
    try:
        result = workflow_components_collection.delete_one({"id": component_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Component not found")
        
        # Audit log
        audit_logs_collection.insert_one({
            "id": str(uuid.uuid4()),
            "entity_type": "workflow_component",
            "entity_id": component_id,
            "action": "deleted",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {"message": "Component deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workflow-components/categories")
async def get_component_categories():
    """Get all unique component categories"""
    try:
        categories = workflow_components_collection.distinct("category")
        return {"categories": categories, "count": len(categories)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
