"""Workflow Execution Engine for LogicCanvas"""
import uuid
import json
import re
import requests
from datetime import datetime, timedelta
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
            if expression.lower() in ["true", "yes", "1"]:
                return True
            if expression.lower() in ["false", "no", "0"]:
                return False

            # Try to evaluate safely
            # This is a simplified evaluator - production would use ast.literal_eval or similar
            try:
                result = eval(expression, {"__builtins__": {}}, variables)
                return result
            except Exception:
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
        """Execute task node - creates a task with assignment strategy and SLA"""
        task_data = node.get("data", {})

        task_id = str(uuid.uuid4())
        now = datetime.utcnow()

        # Calculate due date based on SLA hours
        due_in_hours = task_data.get("dueInHours", 24)
        due_date = (now + timedelta(hours=due_in_hours)).isoformat()

        # Determine assignee based on strategy
        assignment_strategy = task_data.get("assignmentStrategy", "direct")
        assigned_to = task_data.get("assignedTo")
        assignment_role = task_data.get("assignmentRole")

        # For non-direct strategies, we'll assign when the task is created
        # The actual assignment will be done via the API endpoint

        task = {
            "id": task_id,
            "workflow_instance_id": self.instance_id,
            "node_id": node["id"],
            "title": task_data.get("label", "Task"),
            "description": task_data.get("description", ""),
            "assigned_to": assigned_to if assignment_strategy == "direct" else None,
            "assignment_strategy": assignment_strategy,
            "assignment_role": assignment_role,
            "priority": task_data.get("priority", "medium"),
            "status": "pending",
            "due_date": due_date,
            "sla_hours": due_in_hours,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

        self.db["tasks"].insert_one(task)

        # If using role-based assignment, auto-assign now
        if assignment_strategy != "direct" and assignment_role:
            self._auto_assign_task(task_id, assignment_strategy, assignment_role)

        # Return waiting status - execution will resume when task is completed
        return {"status": "waiting", "waiting_for": "task", "task_id": task_id}

    def _auto_assign_task(self, task_id: str, strategy: str, role: str):
        """Auto-assign task based on strategy"""
        role_doc = self.db["roles"].find_one({"name": role})
        if not role_doc or not role_doc.get("members"):
            return

        members = role_doc["members"]
        assignee = None

        if strategy == "role":
            # First available in role
            assignee = members[0]

        elif strategy == "round_robin":
            # Simple round-robin using task count
            task_count = self.db["tasks"].count_documents({})
            assignee = members[task_count % len(members)]

        elif strategy == "load_balanced":
            # Get user with lowest workload
            users = list(self.db["users"].find({"email": {"$in": members}}).sort("workload", 1))
            if users:
                assignee = users[0]["email"]
                self.db["users"].update_one({"email": assignee}, {"$inc": {"workload": 1}})

        if assignee:
            self.db["tasks"].update_one(
                {"id": task_id},
                {"$set": {"assigned_to": assignee, "assigned_at": datetime.utcnow().isoformat()}},
            )

    def execute_decision_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute decision node - evaluate condition"""
        node_data = node.get("data", {})
        condition = node_data.get("condition", "true")

        # Evaluate condition
        result = self.evaluator.evaluate(condition, self.variables)

        return {
            "status": "completed",
            "output": {"decision": bool(result), "condition": condition},
            "route": "true" if result else "false",
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
            "updated_at": datetime.utcnow().isoformat(),
        }

        self.db["approvals"].insert_one(approval)

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
        if action_type == "webhook":
            return self._execute_webhook_action(action_data)
        if action_type == "script":
            return self._execute_script_action(action_data)
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
                auth = None
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
                timeout=30,
            )

            return {
                "status": "completed",
                "output": {
                    "status_code": response.status_code,
                    "response": response.text[:1000],  # Limit response size
                    "success": response.status_code < 400,
                },
            }
        except Exception as exc:  # noqa: BLE001
            return {"status": "failed", "error": str(exc)}

    def _execute_webhook_action(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute webhook (same as HTTP action)"""
        return self._execute_http_action(action_data)

    def _execute_script_action(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute script (simplified - just store for now)"""
        script = action_data.get("script", "")
        return {
            "status": "completed",
            "output": {"script_executed": True, "script": script[:100]},
        }

    def execute_end_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute end node"""
        return {"status": "completed", "output": {"ended": True}}

    def execute_timer_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute timer node - delay execution or schedule timeout"""
        timer_data = node.get("data", {})
        timer_type = timer_data.get("timerType", "delay")  # delay, scheduled, timeout
        
        if timer_type == "delay":
            # Delay in seconds
            delay_seconds = timer_data.get("delaySeconds", 0)
            delay_minutes = timer_data.get("delayMinutes", 0)
            delay_hours = timer_data.get("delayHours", 0)
            
            total_seconds = delay_seconds + (delay_minutes * 60) + (delay_hours * 3600)
            
            # Store timer end time
            end_time = (datetime.utcnow() + timedelta(seconds=total_seconds)).isoformat()
            
            return {
                "status": "waiting",
                "waiting_for": "timer",
                "timer_type": "delay",
                "timer_end": end_time,
                "delay_seconds": total_seconds
            }
        
        elif timer_type == "scheduled":
            # Scheduled time (cron or specific datetime)
            scheduled_time = timer_data.get("scheduledTime")
            return {
                "status": "waiting",
                "waiting_for": "timer",
                "timer_type": "scheduled",
                "timer_end": scheduled_time
            }
        
        elif timer_type == "timeout":
            # Timeout - execute immediately but can be used for SLA tracking
            timeout_hours = timer_data.get("timeoutHours", 24)
            timeout_end = (datetime.utcnow() + timedelta(hours=timeout_hours)).isoformat()
            
            return {
                "status": "completed",
                "output": {"timeout_set": True, "timeout_end": timeout_end}
            }
        
        return {"status": "completed", "output": {"timer_executed": True}}

    def execute_subprocess_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute subprocess node - enhanced nested workflow execution with version support"""
        subprocess_data = node.get("data", {})
        subprocess_workflow_id = subprocess_data.get("subprocessWorkflowId")
        
        if not subprocess_workflow_id:
            return {"status": "failed", "error": "No subprocess workflow configured"}
        
        # Get subprocess workflow and check if it exists
        subprocess_workflow = self.db["workflows"].find_one({"id": subprocess_workflow_id}, {"_id": 0})
        if not subprocess_workflow:
            return {"status": "failed", "error": f"Subprocess workflow '{subprocess_workflow_id}' not found"}
        
        # Check workflow status - only published workflows can be used as subprocesses
        workflow_status = subprocess_workflow.get("lifecycle_state", subprocess_workflow.get("status", "draft"))
        if workflow_status not in ["published", "draft"]:
            return {"status": "failed", "error": f"Subprocess workflow must be published (current: {workflow_status})"}
        
        # Get input mapping
        input_mapping = subprocess_data.get("inputMapping", {})
        subprocess_input = {}
        
        # Map parent variables to subprocess input
        for key, parent_var in input_mapping.items():
            if parent_var in self.variables:
                subprocess_input[key] = self.variables[parent_var]
            else:
                # Try to evaluate as expression
                evaluated_value = self.evaluator.evaluate(str(parent_var), self.variables)
                subprocess_input[key] = evaluated_value
        
        # Get output mapping for later use
        output_mapping = subprocess_data.get("outputMapping", {})
        
        # Get current instance to check nesting level
        current_instance = self.db["workflow_instances"].find_one({"id": self.instance_id})
        current_nesting_level = current_instance.get("nesting_level", 0)
        
        # Prevent infinite recursion - max nesting level is 5
        if current_nesting_level >= 5:
            return {"status": "failed", "error": "Maximum subprocess nesting level (5) exceeded"}
        
        # Start subprocess execution
        from server import execution_engine as global_engine
        try:
            subprocess_instance_id = global_engine.start_execution(
                subprocess_workflow_id,
                triggered_by=f"subprocess:{self.instance_id}",
                input_data=subprocess_input,
                parent_instance_id=self.instance_id,
                nesting_level=current_nesting_level + 1
            )
            
            return {
                "status": "waiting",
                "waiting_for": "subprocess",
                "subprocess_instance_id": subprocess_instance_id,
                "subprocess_workflow_id": subprocess_workflow_id,
                "output_mapping": output_mapping,  # Store for when subprocess completes
                "nesting_level": current_nesting_level + 1
            }
        except Exception as e:
            return {"status": "failed", "error": f"Subprocess execution failed: {str(e)}"}

    def execute_event_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute event node - send/receive messages or signals"""
        event_data = node.get("data", {})
        event_type = event_data.get("eventType", "message")  # message, signal, error
        event_action = event_data.get("eventAction", "send")  # send, receive, throw, catch
        
        if event_action == "send" or event_action == "throw":
            # Send message/signal or throw error
            event_name = event_data.get("eventName", "")
            event_payload = event_data.get("eventPayload", {})
            
            # Store event in events collection
            event_id = str(uuid.uuid4())
            self.db["workflow_events"].insert_one({
                "id": event_id,
                "instance_id": self.instance_id,
                "node_id": node["id"],
                "event_type": event_type,
                "event_name": event_name,
                "event_payload": event_payload,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "sent"
            })
            
            return {
                "status": "completed",
                "output": {
                    "event_sent": True,
                    "event_id": event_id,
                    "event_type": event_type,
                    "event_name": event_name
                }
            }
        
        elif event_action == "receive" or event_action == "catch":
            # Wait for message/signal or catch error
            event_name = event_data.get("eventName", "")
            timeout_hours = event_data.get("timeoutHours", 24)
            
            return {
                "status": "waiting",
                "waiting_for": "event",
                "event_type": event_type,
                "event_name": event_name,
                "timeout": (datetime.utcnow() + timedelta(hours=timeout_hours)).isoformat()
            }
        
        return {"status": "completed", "output": {"event_processed": True}}

    def execute_screen_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute screen node - display information to user"""
        screen_data = node.get("data", {})
        return {"status": "waiting", "waiting_for": "screen", "screen_data": screen_data}

    def execute_switch_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute switch/case node - multi-way branching"""
        switch_data = node.get("data", {})
        switch_variable = switch_data.get("variable", "")
        cases = switch_data.get("cases", [])
        
        # Evaluate the variable
        value = self.evaluator.evaluate(switch_variable, self.variables)
        
        # Find matching case
        matched_case = None
        for case in cases:
            case_value = case.get("value")
            if str(value) == str(case_value):
                matched_case = case.get("id", case_value)
                break
        
        # If no match, use default
        if not matched_case:
            matched_case = "default"
        
        return {
            "status": "completed",
            "output": {"switch_result": value, "case": matched_case},
            "route": matched_case
        }

    def execute_assignment_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute assignment node - set variables"""
        assignment_data = node.get("data", {})
        assignments = assignment_data.get("assignments", [])
        
        updated_variables = {}
        for assignment in assignments:
            var_name = assignment.get("variable")
            value_expr = assignment.get("value")
            
            if var_name and value_expr is not None:
                # Evaluate the value expression
                value = self.evaluator.evaluate(str(value_expr), self.variables)
                updated_variables[var_name] = value
                self.variables[var_name] = value
        
        return {
            "status": "completed",
            "output": {"assigned": updated_variables}
        }

    def execute_loop_for_each_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute for-each loop node with advanced features"""
        loop_data = node.get("data", {})
        collection = loop_data.get("collection", [])
        item_var = loop_data.get("itemVariable", "item")
        index_var = loop_data.get("indexVariable", "index")
        max_iterations = loop_data.get("maxIterations", 1000)
        batch_size = loop_data.get("batchSize", 0)  # 0 means no batching
        break_condition = loop_data.get("breakCondition", "")  # Exit early if condition is true
        
        # Evaluate collection
        if isinstance(collection, str):
            collection = self.evaluator.evaluate(collection, self.variables)
        
        if not isinstance(collection, list):
            # Try to convert to list if it's a dict
            if isinstance(collection, dict):
                collection = list(collection.items())
            else:
                return {"status": "failed", "error": "Collection is not iterable"}
        
        # Apply max iterations limit for safety
        total_items = len(collection)
        if total_items > max_iterations:
            collection = collection[:max_iterations]
            print(f"⚠️  Loop limited to {max_iterations} iterations (collection had {total_items} items)")
        
        return {
            "status": "completed",
            "output": {
                "loop_type": "for_each",
                "collection": collection,
                "item_variable": item_var,
                "index_variable": index_var,
                "total_iterations": len(collection),
                "batch_size": batch_size,
                "break_condition": break_condition
            },
            "loop": True
        }

    def execute_loop_while_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute while loop node"""
        loop_data = node.get("data", {})
        condition = loop_data.get("condition", "false")
        max_iterations = loop_data.get("maxIterations", 100)
        
        # Evaluate condition
        result = self.evaluator.evaluate(condition, self.variables)
        
        return {
            "status": "completed",
            "output": {
                "loop_type": "while",
                "condition": condition,
                "condition_result": bool(result),
                "max_iterations": max_iterations
            },
            "loop": True,
            "continue_loop": bool(result)
        }

    def execute_loop_repeat_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute repeat loop node"""
        loop_data = node.get("data", {})
        count = loop_data.get("count", 1)
        counter_var = loop_data.get("counterVariable", "counter")
        
        # Evaluate count
        if isinstance(count, str):
            count = self.evaluator.evaluate(count, self.variables)
        
        try:
            count = int(count)
        except (ValueError, TypeError):
            count = 1
        
        return {
            "status": "completed",
            "output": {
                "loop_type": "repeat",
                "count": count,
                "counter_variable": counter_var
            },
            "loop": True
        }

    def execute_lookup_record_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute lookup record node - find record by criteria"""
        lookup_data = node.get("data", {})
        collection_name = lookup_data.get("collection", "")
        criteria = lookup_data.get("criteria", {})
        
        if not collection_name:
            return {"status": "failed", "error": "No collection specified"}
        
        # Evaluate criteria with variables
        evaluated_criteria = {}
        for key, value in criteria.items():
            evaluated_criteria[key] = self.evaluator.evaluate(str(value), self.variables)
        
        try:
            collection = self.db[collection_name]
            record = collection.find_one(evaluated_criteria, {"_id": 0})
            
            return {
                "status": "completed",
                "output": {"record": record, "found": record is not None}
            }
        except Exception as e:
            return {"status": "failed", "error": f"Lookup failed: {str(e)}"}

    def execute_create_record_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute create record node - insert into database"""
        create_data = node.get("data", {})
        collection_name = create_data.get("collection", "")
        record_data = create_data.get("recordData", {})
        
        if not collection_name:
            return {"status": "failed", "error": "No collection specified"}
        
        # Evaluate record data with variables
        evaluated_data = {}
        for key, value in record_data.items():
            if isinstance(value, str):
                evaluated_data[key] = self.evaluator.evaluate(value, self.variables)
            else:
                evaluated_data[key] = value
        
        try:
            import uuid
            evaluated_data["id"] = str(uuid.uuid4())
            
            collection = self.db[collection_name]
            result = collection.insert_one(evaluated_data)
            
            return {
                "status": "completed",
                "output": {
                    "record_id": evaluated_data["id"],
                    "inserted": True
                }
            }
        except Exception as e:
            return {"status": "failed", "error": f"Create failed: {str(e)}"}

    def execute_update_record_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute update record node - modify existing record"""
        update_data = node.get("data", {})
        collection_name = update_data.get("collection", "")
        record_id = update_data.get("recordId", "")
        update_fields = update_data.get("updateFields", {})
        
        if not collection_name or not record_id:
            return {"status": "failed", "error": "Collection or record ID not specified"}
        
        # Evaluate update fields with variables
        evaluated_updates = {}
        for key, value in update_fields.items():
            if isinstance(value, str):
                evaluated_updates[key] = self.evaluator.evaluate(value, self.variables)
            else:
                evaluated_updates[key] = value
        
        try:
            collection = self.db[collection_name]
            result = collection.update_one(
                {"id": record_id},
                {"$set": evaluated_updates}
            )
            
            return {
                "status": "completed",
                "output": {
                    "record_id": record_id,
                    "updated": result.modified_count > 0,
                    "matched": result.matched_count > 0
                }
            }
        except Exception as e:
            return {"status": "failed", "error": f"Update failed: {str(e)}"}

    def execute_delete_record_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Execute delete record node - remove record"""
        delete_data = node.get("data", {})
        collection_name = delete_data.get("collection", "")
        record_id = delete_data.get("recordId", "")
        
        if not collection_name or not record_id:
            return {"status": "failed", "error": "Collection or record ID not specified"}
        
        try:
            collection = self.db[collection_name]
            result = collection.delete_one({"id": record_id})
            
            return {
                "status": "completed",
                "output": {
                    "record_id": record_id,
                    "deleted": result.deleted_count > 0
                }
            }
        except Exception as e:
            return {"status": "failed", "error": f"Delete failed: {str(e)}"}

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
            "end": self.execute_end_node,
            "timer": self.execute_timer_node,
            "subprocess": self.execute_subprocess_node,
            "event": self.execute_event_node,
            # New Sprint 1 nodes
            "screen": self.execute_screen_node,
            "switch": self.execute_switch_node,
            "assignment": self.execute_assignment_node,
            "loop_for_each": self.execute_loop_for_each_node,
            "loop_while": self.execute_loop_while_node,
            "loop_repeat": self.execute_loop_repeat_node,
            "lookup_record": self.execute_lookup_record_node,
            "create_record": self.execute_create_record_node,
            "update_record": self.execute_update_record_node,
            "delete_record": self.execute_delete_record_node,
        }

        executor = executors.get(node_type)
        if executor:
            return executor(node)
        return {"status": "failed", "error": f"Unknown node type: {node_type}"}


class WorkflowExecutionEngine:
    """Main workflow execution engine with enhanced error handling and retry logic"""

    def __init__(self, db):
        self.db = db
        self.max_retries = 3
        self.retry_delay_seconds = 5

    def start_execution(
        self,
        workflow_id: str,
        triggered_by: str = "manual",
        input_data: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Start a new workflow execution"""
        # Get workflow definition
        workflow = self.db["workflows"].find_one({"id": workflow_id}, {"_id": 0})
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        # Create workflow instance
        instance_id = str(uuid.uuid4())
        now_iso = datetime.utcnow().isoformat()
        instance = {
            "id": instance_id,
            "workflow_id": workflow_id,
            "status": "running",
            "triggered_by": triggered_by,
            "started_at": now_iso,
            "updated_at": now_iso,
            "completed_at": None,
            "current_node_id": None,
            "variables": input_data or {},
            "execution_history": [],
            # New: normalized execution log used by analytics endpoints
            "execution_log": [],
            # Per-node status map
            "node_states": {},
        }

        self.db["workflow_instances"].insert_one(instance)

        # Start execution from start node
        self._execute_from_start(instance_id, workflow)

        return instance_id

    def _execute_from_start(self, instance_id: str, workflow: Dict[str, Any]) -> None:
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

    def _execute_node(self, instance_id: str, node: Dict[str, Any], workflow: Dict[str, Any]) -> None:
        """Execute a single node with retry logic and enhanced error handling"""
        instance = self.db["workflow_instances"].find_one({"id": instance_id}, {"_id": 0})
        if not instance:
            return

        node_id = node["id"]
        node_type = node.get("type")
        node_label = node.get("data", {}).get("label", node_type)

        # Mark current node on instance
        now_iso = datetime.utcnow().isoformat()
        self.db["workflow_instances"].update_one(
            {"id": instance_id},
            {"$set": {"current_node_id": node_id, "updated_at": now_iso}},
        )

        # Execute node with retry logic for transient failures
        started_at = datetime.utcnow().isoformat()
        executor = NodeExecutor(self.db, instance_id, instance.get("variables", {}))
        
        result = None
        retry_count = 0
        last_error = None
        
        # Retry logic for action nodes (HTTP, webhook, script)
        should_retry = node_type in ["action", "lookup_record", "create_record", "update_record"]
        max_attempts = self.max_retries if should_retry else 1
        
        for attempt in range(max_attempts):
            try:
                result = executor.execute_node(node)
                
                # If result is failed but recoverable, retry
                if result.get("status") == "failed" and should_retry and attempt < max_attempts - 1:
                    error_msg = result.get("error", "")
                    # Check if error is retryable (network, timeout, 5xx errors)
                    if self._is_retryable_error(error_msg):
                        retry_count = attempt + 1
                        last_error = error_msg
                        print(f"⚠️  Retrying node {node_label} (attempt {retry_count + 1}/{max_attempts}): {error_msg}")
                        import time
                        time.sleep(self.retry_delay_seconds)
                        continue
                
                # Success or non-retryable error, break out
                break
                
            except Exception as e:
                # Unexpected exception during execution
                result = {"status": "failed", "error": f"Execution exception: {str(e)}"}
                if should_retry and attempt < max_attempts - 1:
                    retry_count = attempt + 1
                    last_error = str(e)
                    print(f"⚠️  Retrying node {node_label} after exception (attempt {retry_count + 1}/{max_attempts}): {str(e)}")
                    import time
                    time.sleep(self.retry_delay_seconds)
                    continue
                break
        
        completed_at = datetime.utcnow().isoformat()
        status = result.get("status")
        
        # Add retry information to result if retries occurred
        if retry_count > 0:
            result["retry_count"] = retry_count
            result["retried"] = True

        # Record execution history (back-compat) and normalized execution_log
        history_entry = {
            "node_id": node_id,
            "node_type": node_type,
            "timestamp": completed_at,
            "result": result,
        }

        log_entry = {
            "node_id": node_id,
            "node_type": node_type,
            "status": status,
            "started_at": started_at,
            "completed_at": completed_at,
            "error": result.get("error"),
        }

        self.db["workflow_instances"].update_one(
            {"id": instance_id},
            {
                "$push": {"execution_history": history_entry, "execution_log": log_entry},
                "$set": {f"node_states.{node_id}": status},
            },
        )

        # Handle result
        if status == "completed":
            # Update variables with output
            if "output" in result:
                self.db["workflow_instances"].update_one(
                    {"id": instance_id},
                    {"$set": {f"variables.{node_id}": result["output"]}},
                )

            # Check if this is an end node
            if node_type == "end":
                self._update_instance_status(instance_id, "completed")
                return

            # Find next node(s)
            next_nodes = self._get_next_nodes(node, workflow, result.get("route"))

            # Execute next nodes
            for next_node in next_nodes:
                self._execute_node(instance_id, next_node, workflow)

        elif status == "waiting":
            # Node is waiting for external input (task, approval, form)
            self._update_instance_status(instance_id, "waiting")

        elif status == "failed":
            self._update_instance_status(instance_id, "failed", result.get("error"))

    def _get_next_nodes(
        self,
        current_node: Dict[str, Any],
        workflow: Dict[str, Any],
        route: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get next nodes based on edges.

        Supports:
        - Multi-connector decision nodes via `edge.sourceHandle` (e.g., 'yes' / 'no')
        - Backwards compatibility with label-based routing for existing workflows
        - Fan-out for parallel gateways (all outgoing edges)
        """

        next_nodes: List[Dict[str, Any]] = []
        current_node_id = current_node.get("id")
        node_type = current_node.get("type")

        # Normalize decision route to a logical branch name
        desired_handle: Optional[str] = None
        if node_type == "decision" and route is not None:
            route_str = str(route).lower()
            is_true_branch = route_str in ["true", "1", "yes"]
            desired_handle = "yes" if is_true_branch else "no"

        for edge in workflow.get("edges", []):
            if edge.get("source") != current_node_id:
                continue

            # For decision nodes, use sourceHandle first, then fall back to label matching
            if node_type == "decision" and desired_handle is not None:
                edge_handle = edge.get("sourceHandle") or edge.get("source_handle")

                if edge_handle:
                    # Explicit handle-based routing (recommended for new workflows)
                    if edge_handle != desired_handle:
                        continue
                else:
                    # Backwards compatibility: fall back to label-based routing
                    edge_label = (edge.get("label") or "").lower()
                    if desired_handle == "yes":
                        # Treat yes/true/approve/shortlist as positive branch
                        if not any(
                            k in edge_label
                            for k in [
                                "yes",
                                "true",
                                "approve",
                                "approved",
                                "shortlist",
                                "accept",
                            ]
                        ):
                            continue
                    else:
                        # Treat no/false/reject/decline as negative branch
                        if not any(
                            k in edge_label
                            for k in [
                                "no",
                                "false",
                                "reject",
                                "rejected",
                                "decline",
                                "fail",
                            ]
                        ):
                            continue

            # For non-decision nodes, we currently ignore `route` and simply
            # follow all outgoing edges (e.g., parallel fan-out).

            # Find target node
            target_id = edge.get("target")
            if not target_id:
                continue

            for node in workflow.get("nodes", []):
                if node.get("id") == target_id:
                    next_nodes.append(node)
                    break

        return next_nodes

    def _is_retryable_error(self, error_msg: str) -> bool:
        """Determine if an error is retryable (network, timeout, 5xx)"""
        error_lower = error_msg.lower()
        retryable_keywords = [
            "timeout", "connection", "network", "unavailable", 
            "503", "502", "500", "504", "429",  # HTTP status codes
            "temporarily", "transient"
        ]
        return any(keyword in error_lower for keyword in retryable_keywords)
    
    def _update_instance_status(self, instance_id: str, status: str, error: Optional[str] = None) -> None:
        """Update workflow instance status"""
        update_data: Dict[str, Any] = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }

        if status in ["completed", "failed", "cancelled"]:
            update_data["completed_at"] = datetime.utcnow().isoformat()

        if error:
            update_data["error"] = error
            # Add friendly error message
            update_data["error_friendly"] = self._get_friendly_error_message(error)

        self.db["workflow_instances"].update_one({"id": instance_id}, {"$set": update_data})
    
    def _get_friendly_error_message(self, error: str) -> str:
        """Convert technical error messages to user-friendly messages"""
        error_lower = error.lower()
        
        if "timeout" in error_lower:
            return "The operation took too long to complete. Please try again."
        elif "connection" in error_lower or "network" in error_lower:
            return "Unable to connect to the service. Please check your connection and try again."
        elif "404" in error_lower:
            return "The requested resource was not found. Please check your configuration."
        elif "401" in error_lower or "403" in error_lower:
            return "Authentication failed. Please check your credentials."
        elif "500" in error_lower or "502" in error_lower or "503" in error_lower:
            return "The service is temporarily unavailable. Please try again in a few moments."
        elif "no form configured" in error_lower:
            return "This form node is not properly configured. Please select a form."
        elif "no collection specified" in error_lower:
            return "Database collection not specified. Please configure the collection name."
        elif "workflow not found" in error_lower:
            return "The specified workflow could not be found. It may have been deleted."
        else:
            return "An error occurred. Please contact support if this persists."

    def resume_execution(self, instance_id: str, node_id: str, result_data: Optional[Dict[str, Any]] = None) -> None:
        """Resume execution after waiting (task completed, approval given, form submitted)"""
        instance = self.db["workflow_instances"].find_one({"id": instance_id}, {"_id": 0})
        if not instance:
            return

        workflow = self.db["workflows"].find_one({"id": instance["workflow_id"]}, {"_id": 0})
        if not workflow:
            return

        # Find the node
        current_node: Optional[Dict[str, Any]] = None
        for node in workflow.get("nodes", []):
            if node["id"] == node_id:
                current_node = node
                break

        if not current_node:
            return

        # Update variables with result data and mark running
        if result_data is not None:
            self.db["workflow_instances"].update_one(
                {"id": instance_id},
                {
                    "$set": {
                        f"variables.{node_id}_result": result_data,
                        "status": "running",
                        "updated_at": datetime.utcnow().isoformat(),
                    }
                },
            )

        # Continue to next nodes
        next_nodes = self._get_next_nodes(current_node, workflow)
        for next_node in next_nodes:
            self._execute_node(instance_id, next_node, workflow)

    def pause_execution(self, instance_id: str) -> None:
        """Pause workflow execution"""
        self._update_instance_status(instance_id, "paused")

    def cancel_execution(self, instance_id: str) -> None:
        """Cancel workflow execution"""
        self._update_instance_status(instance_id, "cancelled")

    def execute_single_node(self, instance_id: str, node_id: str, workflow: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single node for step-by-step debugging"""
        instance = self.db["workflow_instances"].find_one({"id": instance_id}, {"_id": 0})
        if not instance:
            return {"status": "error", "message": "Instance not found"}
        
        # Find the node
        node = None
        for n in workflow.get("nodes", []):
            if n["id"] == node_id:
                node = n
                break
        
        if not node:
            return {"status": "error", "message": "Node not found"}
        
        # Execute the node
        try:
            result = self._execute_node(instance_id, node, workflow)
            
            # Get next nodes
            next_nodes = self._get_next_nodes(node, workflow)
            next_node_ids = [n["id"] for n in next_nodes]
            
            # Get updated variables
            updated_instance = self.db["workflow_instances"].find_one({"id": instance_id}, {"_id": 0})
            
            return {
                "status": "success",
                "node_id": node_id,
                "result": result,
                "next_nodes": next_node_ids,
                "variables": updated_instance.get("variables", {})
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "node_id": node_id
            }
