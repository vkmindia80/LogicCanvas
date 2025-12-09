#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for LogicCanvas
Tests lifecycle management, version control, task management, and other Phase 6 features
"""

import requests
import json
import sys
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

class ComprehensiveBackendTester:
    def __init__(self, base_url: str = "https://api-connector-map.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_workflows = []
        self.created_tasks = []
        self.created_approvals = []

    def log_test(self, name: str, success: bool, details: str = "", expected: Any = None, actual: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name}")
            if details:
                print(f"   Details: {details}")
            if expected is not None and actual is not None:
                print(f"   Expected: {expected}")
                print(f"   Actual: {actual}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "expected": expected,
            "actual": actual
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request and return success status and response data"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}
            
            return success, response_data
        except Exception as e:
            return False, {"error": str(e)}

    def create_test_workflow(self, name: str, nodes: List[Dict], edges: List[Dict] = None) -> Optional[str]:
        """Create a test workflow and return its ID"""
        if edges is None:
            edges = []
            
        workflow_data = {
            "name": name,
            "description": f"Test workflow: {name}",
            "nodes": nodes,
            "edges": edges,
            "status": "draft"
        }
        
        success, data = self.make_request('POST', '/workflows', workflow_data, expected_status=200)
        
        if success and 'id' in data:
            workflow_id = data['id']
            self.created_workflows.append(workflow_id)
            return workflow_id
        return None

    def test_workflow_lifecycle_management(self):
        """Test workflow lifecycle transitions"""
        print("\n🔍 Testing Workflow Lifecycle Management...")
        
        # Create a test workflow
        nodes = [
            {
                "id": "start-1",
                "type": "start",
                "data": {"label": "Start"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "end-1",
                "type": "end",
                "data": {"label": "End"},
                "position": {"x": 300, "y": 100}
            }
        ]
        
        edges = [
            {
                "id": "edge-1",
                "source": "start-1",
                "target": "end-1"
            }
        ]
        
        workflow_id = self.create_test_workflow("Lifecycle Test Workflow", nodes, edges)
        
        if workflow_id:
            # Test lifecycle transitions
            
            # 1. Request Review (Draft -> In Review)
            success, data = self.make_request('POST', f'/workflows/{workflow_id}/lifecycle/review', 
                                            {"comment": "Ready for review", "changed_by": "test_user"})
            self.log_test("Workflow lifecycle: Request review", success, f"Response: {data}")
            
            # 2. Approve (In Review -> Published)
            success, data = self.make_request('POST', f'/workflows/{workflow_id}/lifecycle/approve',
                                            {"comment": "Approved for production", "changed_by": "test_approver"})
            self.log_test("Workflow lifecycle: Approve workflow", success, f"Response: {data}")
            
            # 3. Pause (Published -> Paused)
            success, data = self.make_request('POST', f'/workflows/{workflow_id}/lifecycle/pause',
                                            {"comment": "Pausing for maintenance", "changed_by": "test_admin"})
            self.log_test("Workflow lifecycle: Pause workflow", success, f"Response: {data}")
            
            # 4. Resume (Paused -> Published)
            success, data = self.make_request('POST', f'/workflows/{workflow_id}/lifecycle/resume',
                                            {"comment": "Resuming after maintenance", "changed_by": "test_admin"})
            self.log_test("Workflow lifecycle: Resume workflow", success, f"Response: {data}")
            
            # 5. Archive (Published -> Archived)
            success, data = self.make_request('POST', f'/workflows/{workflow_id}/lifecycle/archive',
                                            {"comment": "Archiving old workflow", "changed_by": "test_admin"})
            self.log_test("Workflow lifecycle: Archive workflow", success, f"Response: {data}")
            
            # 6. Get lifecycle history
            success, data = self.make_request('GET', f'/workflows/{workflow_id}/lifecycle/history')
            if success:
                has_history = 'history' in data and isinstance(data['history'], list)
                has_current_state = 'current_state' in data
                self.log_test("Workflow lifecycle: Get history", has_history and has_current_state,
                            f"History count: {len(data.get('history', []))}, Current state: {data.get('current_state')}")
            else:
                self.log_test("Workflow lifecycle: Get history", False, f"Response: {data}")

    def test_version_management(self):
        """Test workflow version management"""
        print("\n🔍 Testing Version Management...")
        
        # Create a test workflow
        nodes = [
            {
                "id": "start-1",
                "type": "start",
                "data": {"label": "Start"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "task-1",
                "type": "task",
                "data": {"label": "Task 1"},
                "position": {"x": 200, "y": 100}
            },
            {
                "id": "end-1",
                "type": "end",
                "data": {"label": "End"},
                "position": {"x": 300, "y": 100}
            }
        ]
        
        workflow_id = self.create_test_workflow("Version Test Workflow", nodes)
        
        if workflow_id:
            # 1. Get workflow versions
            success, data = self.make_request('GET', f'/workflows/{workflow_id}/versions')
            if success:
                has_versions = 'versions' in data and isinstance(data['versions'], list)
                has_current_version = 'current_version' in data
                self.log_test("Version management: Get versions", has_versions and has_current_version,
                            f"Version count: {len(data.get('versions', []))}, Current: {data.get('current_version')}")
            else:
                self.log_test("Version management: Get versions", False, f"Response: {data}")
            
            # 2. Get specific version
            success, data = self.make_request('GET', f'/workflows/{workflow_id}/versions/1')
            if success:
                has_version_data = 'version_data' in data
                self.log_test("Version management: Get specific version", has_version_data)
            else:
                self.log_test("Version management: Get specific version", False, f"Response: {data}")
            
            # 3. Compare versions (if we have multiple versions)
            success, data = self.make_request('POST', f'/workflows/{workflow_id}/versions/compare',
                                            {"version_a": 1, "version_b": 1})
            if success:
                has_diff = 'diff' in data
                self.log_test("Version management: Compare versions", has_diff)
            else:
                self.log_test("Version management: Compare versions", False, f"Response: {data}")

    def test_workflow_health_score(self):
        """Test workflow health score functionality"""
        print("\n🔍 Testing Workflow Health Score...")
        
        # Create a test workflow
        nodes = [
            {
                "id": "start-1",
                "type": "start",
                "data": {"label": "Start"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "end-1",
                "type": "end",
                "data": {"label": "End"},
                "position": {"x": 300, "y": 100}
            }
        ]
        
        edges = [
            {
                "id": "edge-1",
                "source": "start-1",
                "target": "end-1"
            }
        ]
        
        workflow_id = self.create_test_workflow("Health Score Test Workflow", nodes, edges)
        
        if workflow_id:
            success, data = self.make_request('GET', f'/workflows/{workflow_id}/health')
            
            if success:
                required_fields = ['workflow_id', 'workflow_name', 'health_score', 'health_status', 'metrics', 'recommendations']
                missing_fields = [f for f in required_fields if f not in data]
                
                self.log_test("Workflow health: Returns required fields",
                             len(missing_fields) == 0,
                             f"Missing fields: {missing_fields}")
                
                # Check health score is numeric and in valid range
                if 'health_score' in data:
                    score = data['health_score']
                    valid_score = isinstance(score, (int, float)) and 0 <= score <= 100
                    self.log_test("Workflow health: Valid health score", valid_score,
                                f"Score: {score}")
                
                # Check metrics structure
                if 'metrics' in data:
                    metrics = data['metrics']
                    metric_fields = ['validation_errors', 'validation_warnings', 'total_executions', 'success_rate']
                    missing_metric_fields = [f for f in metric_fields if f not in metrics]
                    self.log_test("Workflow health: Metrics structure complete",
                                 len(missing_metric_fields) == 0,
                                 f"Missing metric fields: {missing_metric_fields}")
            else:
                self.log_test("Workflow health endpoint accessibility", False, f"Response: {data}")

    def test_task_management(self):
        """Test task management functionality"""
        print("\n🔍 Testing Task Management...")
        
        # 1. Get users and roles for assignment
        success, users_data = self.make_request('GET', '/users')
        success_roles, roles_data = self.make_request('GET', '/roles')
        
        self.log_test("Task management: Get users", success, f"Users count: {len(users_data.get('users', []))}")
        self.log_test("Task management: Get roles", success_roles, f"Roles count: {len(roles_data.get('roles', []))}")
        
        # 2. Create a test task
        task_data = {
            "workflow_instance_id": str(uuid.uuid4()),
            "node_id": str(uuid.uuid4()),
            "title": "Test Task",
            "description": "This is a test task for assignment testing",
            "priority": "medium",
            "due_date": datetime.now().isoformat()
        }
        
        success, data = self.make_request('POST', '/tasks', task_data)
        if success and 'id' in data:
            task_id = data['id']
            self.created_tasks.append(task_id)
            self.log_test("Task management: Create task", True, f"Task ID: {task_id}")
            
            # 3. Test assignment strategies
            if users_data.get('users') and len(users_data['users']) > 0:
                user_email = users_data['users'][0]['email']
                
                # Direct assignment
                success, data = self.make_request('POST', '/tasks/assign', {
                    "task_id": task_id,
                    "strategy": "direct",
                    "target": user_email
                })
                self.log_test("Task management: Direct assignment", success)
                
                # Test reassignment
                if len(users_data['users']) > 1:
                    new_user_email = users_data['users'][1]['email']
                    success, data = self.make_request('POST', f'/tasks/{task_id}/reassign', {
                        "new_assignee": new_user_email
                    })
                    self.log_test("Task management: Reassignment", success)
            
            # 4. Get task details
            success, data = self.make_request('GET', f'/tasks/{task_id}')
            if success:
                required_fields = ['id', 'title', 'status', 'priority']
                missing_fields = [f for f in required_fields if f not in data]
                self.log_test("Task management: Get task details",
                             len(missing_fields) == 0,
                             f"Missing fields: {missing_fields}")
        else:
            self.log_test("Task management: Create task", False, f"Response: {data}")

    def test_template_library(self):
        """Test template library functionality"""
        print("\n🔍 Testing Template Library...")
        
        # 1. Get available templates
        success, data = self.make_request('GET', '/templates')
        
        if success:
            has_templates = 'templates' in data and isinstance(data['templates'], list)
            has_count = 'count' in data
            self.log_test("Template library: Get templates list", has_templates and has_count,
                         f"Template count: {data.get('count', 0)}")
            
            # If templates exist, test getting a specific template
            if has_templates and len(data['templates']) > 0:
                template_id = data['templates'][0].get('id')
                if template_id:
                    success, template_data = self.make_request('GET', f'/templates/{template_id}')
                    self.log_test("Template library: Get specific template", success)
                    
                    # Test creating workflow from template
                    if success:
                        success, create_data = self.make_request('POST', f'/templates/{template_id}/create-workflow',
                                                               {"name": "Test Workflow from Template"})
                        if success and 'id' in create_data:
                            self.created_workflows.append(create_data['id'])
                            self.log_test("Template library: Create workflow from template", True)
                        else:
                            self.log_test("Template library: Create workflow from template", False, f"Response: {create_data}")
        else:
            self.log_test("Template library: Get templates list", False, f"Response: {data}")

    def test_workflow_execution(self):
        """Test workflow execution functionality"""
        print("\n🔍 Testing Workflow Execution...")
        
        # Create a simple executable workflow
        nodes = [
            {
                "id": "start-1",
                "type": "start",
                "data": {"label": "Start"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "end-1",
                "type": "end",
                "data": {"label": "End"},
                "position": {"x": 300, "y": 100}
            }
        ]
        
        edges = [
            {
                "id": "edge-1",
                "source": "start-1",
                "target": "end-1"
            }
        ]
        
        workflow_id = self.create_test_workflow("Execution Test Workflow", nodes, edges)
        
        if workflow_id:
            # First publish the workflow
            success, data = self.make_request('POST', f'/workflows/{workflow_id}/lifecycle/review',
                                            {"comment": "Ready for execution test", "changed_by": "test_user"})
            if success:
                success, data = self.make_request('POST', f'/workflows/{workflow_id}/lifecycle/approve',
                                                {"comment": "Approved for execution", "changed_by": "test_approver"})
            
            # Test execution endpoints
            success, data = self.make_request('POST', f'/workflows/{workflow_id}/execute', {})
            if success:
                instance_id = data.get('instance_id')
                self.log_test("Workflow execution: Start execution", True, f"Instance ID: {instance_id}")
                
                if instance_id:
                    # Get execution status
                    success, status_data = self.make_request('GET', f'/workflows/instances/{instance_id}')
                    self.log_test("Workflow execution: Get instance status", success)
            else:
                self.log_test("Workflow execution: Start execution", False, f"Response: {data}")

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created workflows
        for workflow_id in self.created_workflows:
            success, _ = self.make_request('DELETE', f'/workflows/{workflow_id}', expected_status=200)
            if success:
                print(f"   Deleted workflow: {workflow_id}")
        
        # Delete created tasks
        for task_id in self.created_tasks:
            success, _ = self.make_request('DELETE', f'/tasks/{task_id}', expected_status=200)
            if success:
                print(f"   Deleted task: {task_id}")

    def run_all_tests(self):
        """Run all comprehensive backend tests"""
        print("🚀 Starting Comprehensive LogicCanvas Backend Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 70)
        
        try:
            # Test all major backend functionality
            self.test_workflow_lifecycle_management()
            self.test_version_management()
            self.test_workflow_health_score()
            self.test_task_management()
            self.test_template_library()
            self.test_workflow_execution()
            
        finally:
            # Always cleanup
            self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Comprehensive Backend Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All comprehensive backend tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} comprehensive backend tests failed")
            return 1

def main():
    """Main test runner"""
    tester = ComprehensiveBackendTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())