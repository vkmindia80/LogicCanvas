"""Enhanced Subprocess Management for LogicCanvas - Phase 3.1"""
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from pymongo.database import Database


class SubprocessManager:
    """Manages subprocess execution, version control, and context isolation"""
    
    def __init__(self, db: Database):
        self.db = db
        self.workflows_collection = db['workflows']
        self.workflow_instances_collection = db['workflow_instances']
        self.workflow_versions_collection = db['workflow_versions']
        self.workflow_components_collection = db['workflow_components']
    
    def get_subprocess_workflow(self, workflow_id: str, version: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get subprocess workflow by ID and optional version
        
        Args:
            workflow_id: The workflow ID
            version: Optional version number or 'latest', 'published'
        
        Returns:
            Workflow document or None
        """
        if version and version != 'latest':
            # Get specific version from workflow_versions collection
            if version == 'published':
                # Get the latest published version
                version_doc = self.workflow_versions_collection.find_one(
                    {"workflow_id": workflow_id, "status": "published"},
                    {"_id": 0}
                )
            else:
                # Get specific version number
                version_doc = self.workflow_versions_collection.find_one(
                    {"workflow_id": workflow_id, "version": version},
                    {"_id": 0}
                )
            
            if version_doc:
                # Reconstruct workflow from version snapshot
                return version_doc.get("snapshot")
        
        # Get latest version from workflows collection
        workflow = self.workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
        return workflow
    
    def validate_subprocess_compatibility(self, workflow_id: str, version: Optional[str] = None) -> Dict[str, Any]:
        """Validate if a workflow can be used as a subprocess
        
        Returns:
            Dictionary with validation results
        """
        workflow = self.get_subprocess_workflow(workflow_id, version)
        
        if not workflow:
            return {
                "valid": False,
                "errors": ["Workflow not found"]
            }
        
        errors = []
        warnings = []
        
        # Check if workflow is marked as subprocess-compatible
        if not workflow.get("is_subprocess_compatible"):
            warnings.append("Workflow is not explicitly marked as subprocess-compatible")
        
        # Check lifecycle state
        lifecycle_state = workflow.get("lifecycle_state", workflow.get("status", "draft"))
        if lifecycle_state not in ["published", "draft"]:
            errors.append(f"Workflow must be published or draft (current: {lifecycle_state})")
        
        # Check for start and end nodes
        nodes = workflow.get("nodes", [])
        has_start = any(n.get("type") == "start" for n in nodes)
        has_end = any(n.get("type") == "end" for n in nodes)
        
        if not has_start:
            errors.append("Workflow must have a start node")
        if not has_end:
            warnings.append("Workflow should have at least one end node")
        
        # Check for infinite recursion (workflow calling itself)
        subprocess_nodes = [n for n in nodes if n.get("type") == "subprocess"]
        for node in subprocess_nodes:
            sub_wf_id = node.get("data", {}).get("subprocessWorkflowId")
            if sub_wf_id == workflow_id:
                errors.append("Workflow cannot call itself as subprocess (infinite recursion)")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "subprocess_metadata": workflow.get("subprocess_metadata", {})
        }
    
    def prepare_subprocess_context(self,
                                   parent_instance_id: str,
                                   subprocess_workflow_id: str,
                                   input_mapping: Dict[str, str],
                                   parent_variables: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare isolated context for subprocess execution
        
        Args:
            parent_instance_id: Parent workflow instance ID
            subprocess_workflow_id: Subprocess workflow ID
            input_mapping: Mapping of parent variables to subprocess inputs
            parent_variables: Parent workflow variables
        
        Returns:
            Subprocess context dictionary
        """
        subprocess_context = {
            "_parent_instance_id": parent_instance_id,
            "_subprocess_workflow_id": subprocess_workflow_id,
            "_context_type": "subprocess",
            "_isolated": True
        }
        
        # Map parent variables to subprocess inputs based on mapping
        for subprocess_var, parent_var in input_mapping.items():
            if parent_var in parent_variables:
                subprocess_context[subprocess_var] = parent_variables[parent_var]
            elif "${" in parent_var and "}" in parent_var:
                # Handle expression evaluation
                from execution_engine import ExpressionEvaluator
                evaluator = ExpressionEvaluator()
                subprocess_context[subprocess_var] = evaluator.evaluate(parent_var, parent_variables)
            else:
                # Use literal value
                subprocess_context[subprocess_var] = parent_var
        
        return subprocess_context
    
    def handle_subprocess_completion(self,
                                     subprocess_instance_id: str,
                                     parent_instance_id: str,
                                     parent_node_id: str,
                                     output_mapping: Dict[str, str]) -> Dict[str, Any]:
        """Handle subprocess completion and map outputs back to parent
        
        Args:
            subprocess_instance_id: Completed subprocess instance ID
            parent_instance_id: Parent workflow instance ID
            parent_node_id: Parent's subprocess node ID
            output_mapping: Mapping of subprocess outputs to parent variables
        
        Returns:
            Result data to pass back to parent
        """
        # Get subprocess instance
        subprocess_instance = self.workflow_instances_collection.find_one(
            {"id": subprocess_instance_id},
            {"_id": 0}
        )
        
        if not subprocess_instance:
            return {"error": "Subprocess instance not found"}
        
        subprocess_variables = subprocess_instance.get("variables", {})
        subprocess_status = subprocess_instance.get("status")
        
        result_data = {
            "subprocess_instance_id": subprocess_instance_id,
            "subprocess_status": subprocess_status,
            "subprocess_completed_at": subprocess_instance.get("completed_at"),
            "subprocess_error": subprocess_instance.get("error")
        }
        
        # Map subprocess outputs to parent variables
        mapped_outputs = {}
        for parent_var, subprocess_var in output_mapping.items():
            if subprocess_var in subprocess_variables:
                mapped_outputs[parent_var] = subprocess_variables[subprocess_var]
            else:
                # Try to get from execution history outputs
                for history_entry in subprocess_instance.get("execution_history", []):
                    if subprocess_var in history_entry.get("result", {}).get("output", {}):
                        mapped_outputs[parent_var] = history_entry["result"]["output"][subprocess_var]
                        break
        
        result_data["mapped_outputs"] = mapped_outputs
        
        # Update parent instance child tracking
        self.workflow_instances_collection.update_one(
            {"id": parent_instance_id},
            {
                "$push": {
                    "child_instances": {
                        "subprocess_instance_id": subprocess_instance_id,
                        "node_id": parent_node_id,
                        "status": subprocess_status,
                        "completed_at": subprocess_instance.get("completed_at")
                    }
                }
            }
        )
        
        return result_data
    
    def get_subprocess_tree(self, instance_id: str, max_depth: int = 10) -> Dict[str, Any]:
        """Build complete subprocess execution tree
        
        Args:
            instance_id: Root instance ID
            max_depth: Maximum recursion depth
        
        Returns:
            Tree structure with all child subprocesses
        """
        def build_tree_recursive(inst_id: str, depth: int = 0) -> Dict[str, Any]:
            if depth > max_depth:
                return {"error": "Max depth exceeded"}
            
            instance = self.workflow_instances_collection.find_one(
                {"id": inst_id},
                {"_id": 0}
            )
            
            if not instance:
                return {"error": "Instance not found"}
            
            # Get workflow details
            workflow = self.workflows_collection.find_one(
                {"id": instance["workflow_id"]},
                {"_id": 0, "name": 1, "description": 1}
            )
            
            # Get child instances
            children = list(self.workflow_instances_collection.find(
                {"parent_instance_id": inst_id},
                {"_id": 0}
            ))
            
            # Build child trees
            child_trees = []
            for child in children:
                child_tree = build_tree_recursive(child["id"], depth + 1)
                child_trees.append(child_tree)
            
            return {
                "instance_id": inst_id,
                "workflow_id": instance["workflow_id"],
                "workflow_name": workflow.get("name", "Unknown") if workflow else "Unknown",
                "status": instance.get("status"),
                "nesting_level": instance.get("nesting_level", 0),
                "started_at": instance.get("started_at"),
                "completed_at": instance.get("completed_at"),
                "duration_seconds": self._calculate_duration(instance),
                "parent_instance_id": instance.get("parent_instance_id"),
                "children": child_trees,
                "child_count": len(child_trees),
                "has_errors": instance.get("status") == "failed"
            }
        
        return build_tree_recursive(instance_id)
    
    def _calculate_duration(self, instance: Dict[str, Any]) -> Optional[float]:
        """Calculate instance duration in seconds"""
        started_at = instance.get("started_at")
        completed_at = instance.get("completed_at")
        
        if not started_at:
            return None
        
        try:
            start = datetime.fromisoformat(started_at)
            end = datetime.fromisoformat(completed_at) if completed_at else datetime.utcnow()
            return (end - start).total_seconds()
        except (ValueError, TypeError):
            return None
    
    def create_version_snapshot(self, workflow_id: str, version_number: str, comment: str = "") -> str:
        """Create a version snapshot of a workflow for subprocess pinning
        
        Args:
            workflow_id: Workflow ID to snapshot
            version_number: Version number (e.g., "1.0.0")
            comment: Version comment
        
        Returns:
            Version ID
        """
        workflow = self.workflows_collection.find_one({"id": workflow_id}, {"_id": 0})
        
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        version_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        version_doc = {
            "id": version_id,
            "workflow_id": workflow_id,
            "version": version_number,
            "snapshot": {
                "id": workflow_id,
                "name": workflow.get("name"),
                "description": workflow.get("description"),
                "nodes": workflow.get("nodes", []),
                "edges": workflow.get("edges", []),
                "subprocess_metadata": workflow.get("subprocess_metadata", {})
            },
            "status": workflow.get("lifecycle_state", "draft"),
            "comment": comment,
            "created_at": now,
            "created_by": workflow.get("updated_by", "system")
        }
        
        self.workflow_versions_collection.insert_one(version_doc)
        
        return version_id
