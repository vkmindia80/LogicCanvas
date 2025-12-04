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

@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str):
    """Get single task by ID"""
    task = tasks_collection.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/api/tasks/{task_id}/reassign")
async def reassign_task(task_id: str, new_assignee: str):
    """Reassign task to a different user"""
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
async def delegate_task(task_id: str, delegate_to: str):
    """Delegate task to another user"""
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
async def escalate_task(task_id: str, reason: str = ""):
    """Escalate task to higher priority/manager"""
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
async def add_task_comment(task_id: str, content: str, author: str = "current_user"):
    """Add a comment to a task"""
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
            "title": f"You were mentioned in a comment",
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
    """Make approval decision and resume workflow"""
    approval = approvals_collection.find_one({"id": approval_id}, {"_id": 0})
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    if decision not in ["approved", "rejected", "changes_requested"]:
        raise HTTPException(status_code=400, detail="Invalid decision")
    
    # Record decision
    decision_entry = {
        "decided_by": decided_by or "user",
        "decision": decision,
        "comment": comment,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    approvals_collection.update_one(
        {"id": approval_id},
        {
            "$push": {"decisions": decision_entry},
            "$set": {"status": decision, "updated_at": datetime.utcnow().isoformat()}
        }
    )
    
    # Resume workflow execution
    execution_engine.resume_execution(
        approval["workflow_instance_id"],
        approval["node_id"],
        {"approval_decision": decision, "comment": comment}
    )
    
    return {"message": "Approval decision recorded and workflow resumed"}

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
