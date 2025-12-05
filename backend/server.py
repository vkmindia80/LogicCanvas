from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import os
import uuid
from execution_engine import WorkflowExecutionEngine, ExpressionEvaluator
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

# Initialize Execution Engine
execution_engine = WorkflowExecutionEngine(db)

# Initialize Scheduler
scheduler = BackgroundScheduler()
scheduler.start()

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
    
    workflows_collection.replace_one({"id": workflow_id}, workflow_dict)
    
    # Log audit
    audit_logs_collection.insert_one({
        "id": str(uuid.uuid4()),
        "entity_type": "workflow",
        "entity_id": workflow_id,
        "action": "updated",
        "timestamp": now
    })
    
    return {"message": "Workflow updated successfully"}

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


# Form Endpoints
@app.get("/api/forms")
async def get_forms():
    forms = list(forms_collection.find({}, {"_id": 0}))
    return {"forms": forms, "count": len(forms)}

@app.get("/api/forms/{form_id}")
async def get_form(form_id: str):
    form = forms_collection.find_one({"id": form_id}, {"_id": 0})
# Ensure indexes for auth & RBAC related collections
users_collection.create_index("email", unique=True)
roles_collection.create_index("name", unique=True)

# Seed an initial admin/builder/demo user set for auto-login and RBAC demos
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


    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

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

# SLA Tracking
@app.get("/api/tasks/sla/overdue")
async def get_overdue_tasks():
    """Get tasks that are past their due date"""
    now = datetime.utcnow().isoformat()
    overdue_tasks = list(tasks_collection.find(
        {
            "due_date": {"$lt": now},
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
