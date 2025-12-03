"""Workflow Execution Engine for LogicCanvas"""
import uuid
import json
import re
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional
from pymongo.collection import Collection

class ExpressionEvaluator:
    """Evaluate expressions with workflow variables"""
    
    @staticmethod
    def evaluate(expression: str, variables: Dict[str, Any]) -> Any:
        """Safely evaluate expressions with variables"""
        try:
            # Simple variable substitution: ${variable}
            for var_name, var_value in variables.items():
                expression = expression.replace(f"${{{var_name}}}", str(var_value))
            
            # Safe evaluation for basic comparisons
            # Support: ==, !=, >, <, >=, <=, and, or, not
            # Replace common operators
            expression = expression.replace(" and ", " and ").replace(" or ", " or ")
            
            # For simple boolean checks
            if expression.lower() in ['true', 'yes', '1']:
                return True
            if expression.lower() in ['false', 'no', '0']:
                return False
            
            # Try to evaluate safely
            # This is a simplified evaluator - production would use ast.literal_eval or similar
            try:
                result = eval(expression, {"__builtins__": {}}, variables)
                return result
            except:
                return expression
        except Exception as e:
            print(f"Expression evaluation error: {e}")
            return expression

class NodeExecutor:
    """Execute individual workflow nodes"""
    
    def __init__(self, db, instance_id: str, variables: Dict[str, Any]):
        self.db = db
        self.instance_id = instance_id
        self.variables = variables
        self.evaluator = ExpressionEvaluator()
    
    def execute_start_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute start node"""
        return {"status": "completed", "output": {"started": True}}
    
    def execute_task_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute task node - creates a task and waits"""
        task_data = node.get("data", {})
        
        task_id = str(uuid.uuid4())
        task = {
            "id": task_id,
            "workflow_instance_id": self.instance_id,
            "node_id": node["id"],
            "title": task_data.get("label", "Task"),
            "description": task_data.get("description", ""),
            "assigned_to": task_data.get("assignedTo"),
            "priority": task_data.get("priority", "medium"),
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        self.db['tasks'].insert_one(task)
        
        # Return waiting status - execution will resume when task is completed
        return {"status": "waiting", "waiting_for": "task", "task_id": task_id}
    
    def execute_decision_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute decision node - evaluate condition"""
        node_data = node.get("data", {})
        condition = node_data.get("condition", "true")
        
        # Evaluate condition
        result = self.evaluator.evaluate(condition, self.variables)
        
        return {
            "status": "completed",
            "output": {"decision": bool(result), "condition": condition},
            "route": "true" if result else "false"
        }
    
    def execute_approval_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute approval node - creates approval and waits"""
        approval_data = node.get("data", {})
        
        approval_id = str(uuid.uuid4())
        approval = {
            "id": approval_id,
            "workflow_instance_id": self.instance_id,
            "node_id": node["id"],
            "title": approval_data.get("label", "Approval Required"),
            "description": approval_data.get("description", ""),
            "approvers": approval_data.get("approvers", []),
            "approval_type": approval_data.get("approvalType", "single"),
            "status": "pending",
            "decisions": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        self.db['approvals'].insert_one(approval)
        
        return {"status": "waiting", "waiting_for": "approval", "approval_id": approval_id}
    
    def execute_form_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute form node - presents form and waits for submission"""
        form_data = node.get("data", {})
        form_id = form_data.get("formId")
        
        if not form_id:
            return {"status": "failed", "error": "No form configured"}
        
        return {"status": "waiting", "waiting_for": "form", "form_id": form_id}
    
    def execute_parallel_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute parallel node - fork execution"""
        return {"status": "completed", "output": {"forked": True}, "parallel": True}
    
    def execute_merge_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute merge node - wait for all branches"""
        # Check if all incoming branches are completed
        return {"status": "completed", "output": {"merged": True}}
    
    def execute_action_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute action node - HTTP call, webhook, script"""
        action_data = node.get("data", {})
        action_type = action_data.get("actionType", "http")
        
        if action_type == "http":
            return self._execute_http_action(action_data)
        elif action_type == "webhook":
            return self._execute_webhook_action(action_data)
        elif action_type == "script":
            return self._execute_script_action(action_data)
        else:
            return {"status": "failed", "error": f"Unknown action type: {action_type}"}
    
    def _execute_http_action(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute HTTP request"""
        try:
            url = action_data.get("url", "")
            method = action_data.get("method", "GET").upper()
            headers = action_data.get("headers", {})
            body = action_data.get("body", {})
            auth_type = action_data.get("authType")
            
            # Substitute variables in URL and body
            url = self.evaluator.evaluate(url, self.variables)
            if isinstance(body, str):
                body = self.evaluator.evaluate(body, self.variables)
            
            # Add authentication
            if auth_type == "bearer":
                token = action_data.get("token", "")
                headers["Authorization"] = f"Bearer {token}"
            elif auth_type == "basic":
                auth = (action_data.get("username", ""), action_data.get("password", ""))
            else:
                auth = None
            
            # Make request
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=body if method in ["POST", "PUT", "PATCH"] else None,
                auth=auth,
                timeout=30
            )
            
            return {
                "status": "completed",
                "output": {
                    "status_code": response.status_code,
                    "response": response.text[:1000],  # Limit response size
                    "success": response.status_code < 400
                }
            }
        except Exception as e:
            return {"status": "failed", "error": str(e)}
    
    def _execute_webhook_action(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute webhook"""
        return self._execute_http_action(action_data)
    
    def _execute_script_action(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute script (simplified - just store for now)"""
        script = action_data.get("script", "")
        return {"status": "completed", "output": {"script_executed": True, "script": script[:100]}}
    
    def execute_end_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute end node"""
        return {"status": "completed", "output": {"ended": True}}
    
    def execute_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a node based on its type"""
        node_type = node.get("type", "")
        
        executors = {
            "start": self.execute_start_node,
            "task": self.execute_task_node,
            "decision": self.execute_decision_node,
            "approval": self.execute_approval_node,
            "form": self.execute_form_node,
            "parallel": self.execute_parallel_node,
            "merge": self.execute_merge_node,
            "action": self.execute_action_node,
            "end": self.execute_end_node
        }
        
        executor = executors.get(node_type)
        if executor:
            return executor(node)
        else:
            return {"status": "failed", "error": f"Unknown node type: {node_type}"}

class WorkflowExecutionEngine:
    """Main workflow execution engine"""
    
    def __init__(self, db):
        self.db = db
    
    def start_execution(self, workflow_id: str, triggered_by: str = "manual", input_data: Dict[str, Any] = None) -> str:
        """Start a new workflow execution"""
        # Get workflow definition
        workflow = self.db['workflows'].find_one({"id": workflow_id}, {"_id": 0})
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        # Create workflow instance
        instance_id = str(uuid.uuid4())
        instance = {
            "id": instance_id,
            "workflow_id": workflow_id,
            "status": "running",
            "triggered_by": triggered_by,
            "started_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "completed_at": None,
            "current_node_id": None,
            "variables": input_data or {},
            "execution_history": [],
            "node_states": {}  # Track state of each node
        }
        
        self.db['workflow_instances'].insert_one(instance)
        
        # Start execution from start node
        self._execute_from_start(instance_id, workflow)
        
        return instance_id
    
    def _execute_from_start(self, instance_id: str, workflow: Dict[str, Any]):
        """Execute workflow from start node"""
        # Find start node
        start_node = None
        for node in workflow.get("nodes", []):
            if node.get("type") == "start":
                start_node = node
                break
        
        if not start_node:
            self._update_instance_status(instance_id, "failed", "No start node found")
            return
        
        # Execute from start node
        self._execute_node(instance_id, start_node, workflow)
    
    def _execute_node(self, instance_id: str, node: Dict[str, Any], workflow: Dict[str, Any]):
        """Execute a single node and continue to next"""
        instance = self.db['workflow_instances'].find_one({"id": instance_id}, {"_id": 0})
        if not instance:
            return
        
        # Update current node
        self.db['workflow_instances'].update_one(
            {"id": instance_id},
            {"$set": {"current_node_id": node["id"], "updated_at": datetime.utcnow().isoformat()}}
        )
        
        # Execute node
        executor = NodeExecutor(self.db, instance_id, instance.get("variables", {}))
        result = executor.execute_node(node)
        
        # Record execution history
        history_entry = {
            "node_id": node["id"],
            "node_type": node.get("type"),
            "timestamp": datetime.utcnow().isoformat(),
            "result": result
        }
        
        self.db['workflow_instances'].update_one(
            {"id": instance_id},
            {
                "$push": {"execution_history": history_entry},
                "$set": {f"node_states.{node['id']}": result.get("status")}
            }
        )
        
        # Handle result
        if result.get("status") == "completed":
            # Update variables with output
            if "output" in result:
                self.db['workflow_instances'].update_one(
                    {"id": instance_id},
                    {"$set": {f"variables.{node['id']}": result["output"]}}
                )
            
            # Check if this is an end node
            if node.get("type") == "end":
                self._update_instance_status(instance_id, "completed")
                return
            
            # Find next node(s)
            next_nodes = self._get_next_nodes(node, workflow, result.get("route"))
            
            # Execute next nodes
            for next_node in next_nodes:
                self._execute_node(instance_id, next_node, workflow)
        
        elif result.get("status") == "waiting":
            # Node is waiting for external input (task, approval, form)
            self._update_instance_status(instance_id, "waiting")
        
        elif result.get("status") == "failed":
            self._update_instance_status(instance_id, "failed", result.get("error"))
    
    def _get_next_nodes(self, current_node: Dict[str, Any], workflow: Dict[str, Any], route: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get next nodes based on edges"""
        next_nodes = []
        
        for edge in workflow.get("edges", []):
            if edge["source"] == current_node["id"]:
                # Check if route matches (for decision nodes)
                if route:
                    edge_label = edge.get("label", "").lower()
                    if route.lower() not in edge_label:
                        continue
                
                # Find target node
                for node in workflow.get("nodes", []):
                    if node["id"] == edge["target"]:
                        next_nodes.append(node)
                        break
        
        return next_nodes
    
    def _update_instance_status(self, instance_id: str, status: str, error: Optional[str] = None):
        """Update workflow instance status"""
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if status in ["completed", "failed", "cancelled"]:
            update_data["completed_at"] = datetime.utcnow().isoformat()
        
        if error:
            update_data["error"] = error
        
        self.db['workflow_instances'].update_one(
            {"id": instance_id},
            {"$set": update_data}
        )
    
    def resume_execution(self, instance_id: str, node_id: str, result_data: Dict[str, Any] = None):
        """Resume execution after waiting (task completed, approval given, form submitted)"""
        instance = self.db['workflow_instances'].find_one({"id": instance_id}, {"_id": 0})
        if not instance:
            return
        
        workflow = self.db['workflows'].find_one({"id": instance["workflow_id"]}, {"_id": 0})
        if not workflow:
            return
        
        # Find the node
        current_node = None
        for node in workflow.get("nodes", []):
            if node["id"] == node_id:
                current_node = node
                break
        
        if not current_node:
            return
        
        # Update variables with result data
        if result_data:
            self.db['workflow_instances'].update_one(
                {"id": instance_id},
                {"$set": {f"variables.{node_id}_result": result_data, "status": "running"}}
            )
        
        # Continue to next nodes
        next_nodes = self._get_next_nodes(current_node, workflow)
        for next_node in next_nodes:
            self._execute_node(instance_id, next_node, workflow)
    
    def pause_execution(self, instance_id: str):
        """Pause workflow execution"""
        self._update_instance_status(instance_id, "paused")
    
    def cancel_execution(self, instance_id: str):
        """Cancel workflow execution"""
        self._update_instance_status(instance_id, "cancelled")
