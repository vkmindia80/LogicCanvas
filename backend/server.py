from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import uuid

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
