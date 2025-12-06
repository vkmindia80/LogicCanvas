"""Variable Management System for LogicCanvas"""
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum


class VariableType(str, Enum):
    """Variable data types"""
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    OBJECT = "object"
    ARRAY = "array"
    DATE = "date"
    NULL = "null"


class VariableScope(str, Enum):
    """Variable scopes"""
    WORKFLOW = "workflow"  # Available throughout workflow instance
    NODE = "node"  # Local to specific node
    GLOBAL = "global"  # Shared across workflow instances


class VariableManager:
    """Manage workflow variables with types and scopes"""

    def __init__(self, db):
        self.db = db

    def get_variable_type(self, value: Any) -> VariableType:
        """Infer variable type from value"""
        if value is None:
            return VariableType.NULL
        elif isinstance(value, bool):
            return VariableType.BOOLEAN
        elif isinstance(value, int) or isinstance(value, float):
            return VariableType.NUMBER
        elif isinstance(value, str):
            # Check if it's a date string
            try:
                datetime.fromisoformat(value.replace('Z', '+00:00'))
                return VariableType.DATE
            except (ValueError, AttributeError):
                return VariableType.STRING
        elif isinstance(value, list):
            return VariableType.ARRAY
        elif isinstance(value, dict):
            return VariableType.OBJECT
        else:
            return VariableType.STRING

    def track_variable_change(
        self,
        instance_id: str,
        variable_name: str,
        value: Any,
        scope: VariableScope = VariableScope.WORKFLOW,
        node_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> None:
        """Track a variable change with history"""
        var_type = self.get_variable_type(value)
        now = datetime.utcnow().isoformat()

        # Create variable change record
        change_record = {
            "id": str(uuid.uuid4()),
            "instance_id": instance_id,
            "variable_name": variable_name,
            "value": value,
            "type": var_type.value,
            "scope": scope.value,
            "node_id": node_id,
            "description": description or f"Variable '{variable_name}' updated",
            "timestamp": now
        }

        # Store in variable_changes collection
        self.db["variable_changes"].insert_one(change_record)

        # Update workflow instance variables
        instance = self.db["workflow_instances"].find_one({"id": instance_id}, {"_id": 0})
        if instance:
            variables = instance.get("variables", {})
            variables[variable_name] = {
                "value": value,
                "type": var_type.value,
                "scope": scope.value,
                "node_id": node_id,
                "updated_at": now
            }
            self.db["workflow_instances"].update_one(
                {"id": instance_id},
                {"$set": {"variables": variables, "updated_at": now}}
            )

    def get_instance_variables(
        self,
        instance_id: str,
        scope: Optional[VariableScope] = None,
        variable_type: Optional[VariableType] = None
    ) -> List[Dict[str, Any]]:
        """Get all variables for a workflow instance with filters"""
        instance = self.db["workflow_instances"].find_one({"id": instance_id}, {"_id": 0})
        if not instance:
            return []

        variables = instance.get("variables", {})
        result = []

        for name, var_data in variables.items():
            # Handle both old format (value only) and new format (dict with metadata)
            if isinstance(var_data, dict) and "value" in var_data:
                value = var_data["value"]
                var_type = var_data.get("type", self.get_variable_type(value).value)
                var_scope = var_data.get("scope", VariableScope.WORKFLOW.value)
                node_id = var_data.get("node_id")
                updated_at = var_data.get("updated_at")
            else:
                value = var_data
                var_type = self.get_variable_type(value).value
                var_scope = VariableScope.WORKFLOW.value
                node_id = None
                updated_at = None

            # Apply filters
            if scope and var_scope != scope.value:
                continue
            if variable_type and var_type != variable_type.value:
                continue

            result.append({
                "name": name,
                "value": value,
                "type": var_type,
                "scope": var_scope,
                "node_id": node_id,
                "updated_at": updated_at
            })

        return result

    def get_variable_history(
        self,
        instance_id: str,
        variable_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get variable change history"""
        query = {"instance_id": instance_id}
        if variable_name:
            query["variable_name"] = variable_name

        changes = list(
            self.db["variable_changes"]
            .find(query, {"_id": 0})
            .sort("timestamp", -1)
        )

        return changes

    def get_global_variables(self) -> List[Dict[str, Any]]:
        """Get all global variables shared across workflows"""
        global_vars = list(
            self.db["global_variables"].find({}, {"_id": 0})
        )
        return global_vars

    def set_global_variable(
        self,
        variable_name: str,
        value: Any,
        description: Optional[str] = None
    ) -> None:
        """Set a global variable"""
        var_type = self.get_variable_type(value)
        now = datetime.utcnow().isoformat()

        self.db["global_variables"].update_one(
            {"name": variable_name},
            {
                "$set": {
                    "name": variable_name,
                    "value": value,
                    "type": var_type.value,
                    "description": description,
                    "updated_at": now
                }
            },
            upsert=True
        )

    def get_variable_watch_list(
        self,
        instance_id: str
    ) -> List[str]:
        """Get list of variables being watched for debugging"""
        instance = self.db["workflow_instances"].find_one({"id": instance_id}, {"_id": 0})
        if not instance:
            return []
        return instance.get("watch_list", [])

    def add_to_watch_list(
        self,
        instance_id: str,
        variable_name: str
    ) -> None:
        """Add variable to watch list"""
        self.db["workflow_instances"].update_one(
            {"id": instance_id},
            {"$addToSet": {"watch_list": variable_name}}
        )

    def remove_from_watch_list(
        self,
        instance_id: str,
        variable_name: str
    ) -> None:
        """Remove variable from watch list"""
        self.db["workflow_instances"].update_one(
            {"id": instance_id},
            {"$pull": {"watch_list": variable_name}}
        )

    def validate_type(
        self,
        value: Any,
        expected_type: VariableType
    ) -> bool:
        """Validate if value matches expected type"""
        actual_type = self.get_variable_type(value)
        return actual_type == expected_type

    def convert_type(
        self,
        value: Any,
        target_type: VariableType
    ) -> Any:
        """Convert value to target type"""
        try:
            if target_type == VariableType.STRING:
                return str(value)
            elif target_type == VariableType.NUMBER:
                return float(value) if '.' in str(value) else int(value)
            elif target_type == VariableType.BOOLEAN:
                if isinstance(value, str):
                    return value.lower() in ['true', 'yes', '1']
                return bool(value)
            elif target_type == VariableType.ARRAY:
                if isinstance(value, list):
                    return value
                return [value]
            elif target_type == VariableType.DATE:
                if isinstance(value, str):
                    return datetime.fromisoformat(value.replace('Z', '+00:00')).isoformat()
                return value
            else:
                return value
        except (ValueError, TypeError, AttributeError):
            return value
