#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for LogicCanvas Workflow Validation
Tests the new /api/workflows/{workflow_id}/validate endpoint and related functionality
"""

import requests
import json
import sys
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

class LogicCanvasAPITester:
    def __init__(self, base_url: str = "https://phase8-roadmap.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_workflows = []
        self.created_forms = []

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

    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        print("\n🔍 Testing Health Endpoint...")
        
        success, data = self.make_request('GET', '/health', expected_status=200)
        
        if success:
            # Check required fields
            has_status = 'status' in data
            has_database = 'database' in data
            
            if has_status and has_database:
                self.log_test("Health endpoint returns required fields", True)
                self.log_test("Health endpoint status check", data.get('status') == 'healthy')
                self.log_test("Health endpoint database check", data.get('database') == 'connected')
            else:
                self.log_test("Health endpoint returns required fields", False, 
                            f"Missing fields. Got: {list(data.keys())}")
        else:
            self.log_test("Health endpoint accessibility", False, f"Response: {data}")

    def test_validation_endpoint_404(self):
        """Test validation endpoint with unknown workflow ID"""
        print("\n🔍 Testing Validation Endpoint - 404 Case...")
        
        fake_id = str(uuid.uuid4())
        success, data = self.make_request('GET', f'/workflows/{fake_id}/validate', expected_status=404)
        
        self.log_test("Validation endpoint returns 404 for unknown workflow", success, 
                     f"Workflow ID: {fake_id}, Response: {data}")

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

    def create_test_form(self, name: str, fields: List[Dict]) -> Optional[str]:
        """Create a test form and return its ID"""
        form_data = {
            "name": name,
            "description": f"Test form: {name}",
            "fields": fields
        }
        
        success, data = self.make_request('POST', '/forms', form_data, expected_status=200)
        
        if success and 'id' in data:
            form_id = data['id']
            self.created_forms.append(form_id)
            return form_id
        return None

    def test_valid_workflow_validation(self):
        """Test validation endpoint with a valid workflow"""
        print("\n🔍 Testing Validation Endpoint - Valid Workflow...")
        
        # Create a minimal valid workflow
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
        
        workflow_id = self.create_test_workflow("Valid Test Workflow", nodes, edges)
        
        if workflow_id:
            self.log_test("Valid workflow creation", True, f"Created workflow: {workflow_id}")
            
            # Test validation
            success, data = self.make_request('GET', f'/workflows/{workflow_id}/validate', expected_status=200)
            
            if success:
                # Check response structure
                has_workflow_id = 'workflow_id' in data
                has_issues = 'issues' in data and isinstance(data['issues'], list)
                has_issue_count = 'issue_count' in data and isinstance(data['issue_count'], int)
                
                self.log_test("Validation response has workflow_id", has_workflow_id)
                self.log_test("Validation response has issues array", has_issues)
                self.log_test("Validation response has issue_count number", has_issue_count)
                
                if has_workflow_id and has_issues and has_issue_count:
                    self.log_test("Validation response structure correct", True)
                    self.log_test("Issue count matches issues array length", 
                                data['issue_count'] == len(data['issues']))
                    
                    # For a valid workflow, should have minimal issues
                    print(f"   Found {data['issue_count']} validation issues")
                    for issue in data['issues']:
                        print(f"   - {issue.get('type', 'unknown')}: {issue.get('message', 'no message')}")
                else:
                    self.log_test("Validation response structure correct", False, 
                                f"Missing fields in response: {data}")
            else:
                self.log_test("Valid workflow validation request", False, f"Response: {data}")
        else:
            self.log_test("Valid workflow creation", False, "Failed to create test workflow")

    def test_workflow_no_start_node(self):
        """Test validation catches workflows with no start node"""
        print("\n🔍 Testing Validation - No Start Node...")
        
        # Create workflow without start node
        nodes = [
            {
                "id": "task-1",
                "type": "task", 
                "data": {"label": "Task"},
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
                "source": "task-1", 
                "target": "end-1"
            }
        ]
        
        workflow_id = self.create_test_workflow("No Start Node Workflow", nodes, edges)
        
        if workflow_id:
            success, data = self.make_request('GET', f'/workflows/{workflow_id}/validate', expected_status=200)
            
            if success and 'issues' in data:
                # Look for start node error
                start_node_error = any(
                    'start' in issue.get('message', '').lower() and issue.get('type') == 'error'
                    for issue in data['issues']
                )
                
                self.log_test("Validation catches missing start node", start_node_error,
                            f"Issues found: {[i.get('message') for i in data['issues']]}")
            else:
                self.log_test("No start node validation request", False, f"Response: {data}")

    def test_workflow_missing_form_reference(self):
        """Test validation catches form nodes with missing form references"""
        print("\n🔍 Testing Validation - Missing Form Reference...")
        
        # Create workflow with form node referencing non-existent form
        fake_form_id = str(uuid.uuid4())
        
        nodes = [
            {
                "id": "start-1",
                "type": "start",
                "data": {"label": "Start"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "form-1",
                "type": "form",
                "data": {
                    "label": "Form Node",
                    "formId": fake_form_id  # Non-existent form
                },
                "position": {"x": 200, "y": 100}
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
                "target": "form-1"
            },
            {
                "id": "edge-2", 
                "source": "form-1",
                "target": "end-1"
            }
        ]
        
        workflow_id = self.create_test_workflow("Missing Form Reference Workflow", nodes, edges)
        
        if workflow_id:
            success, data = self.make_request('GET', f'/workflows/{workflow_id}/validate', expected_status=200)
            
            if success and 'issues' in data:
                # Look for form reference error
                form_error = any(
                    'form' in issue.get('message', '').lower() and 
                    'does not exist' in issue.get('message', '').lower() and
                    issue.get('nodeId') == 'form-1' and
                    issue.get('type') == 'error'
                    for issue in data['issues']
                )
                
                self.log_test("Validation catches missing form reference", form_error,
                            f"Issues found: {[i.get('message') for i in data['issues']]}")
            else:
                self.log_test("Missing form reference validation request", False, f"Response: {data}")

    def test_workflow_with_valid_form_reference(self):
        """Test validation passes for form nodes with valid form references"""
        print("\n🔍 Testing Validation - Valid Form Reference...")
        
        # First create a real form
        form_fields = [
            {
                "id": "field-1",
                "type": "text",
                "label": "Name",
                "required": True
            }
        ]
        
        form_id = self.create_test_form("Test Form", form_fields)
        
        if form_id:
            # Create workflow with form node referencing the real form
            nodes = [
                {
                    "id": "start-1",
                    "type": "start",
                    "data": {"label": "Start"},
                    "position": {"x": 100, "y": 100}
                },
                {
                    "id": "form-1",
                    "type": "form",
                    "data": {
                        "label": "Form Node",
                        "formId": form_id  # Valid form reference
                    },
                    "position": {"x": 200, "y": 100}
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
                    "target": "form-1"
                },
                {
                    "id": "edge-2",
                    "source": "form-1", 
                    "target": "end-1"
                }
            ]
            
            workflow_id = self.create_test_workflow("Valid Form Reference Workflow", nodes, edges)
            
            if workflow_id:
                success, data = self.make_request('GET', f'/workflows/{workflow_id}/validate', expected_status=200)
                
                if success and 'issues' in data:
                    # Should NOT have form reference errors for this node
                    form_errors = [
                        issue for issue in data['issues']
                        if issue.get('nodeId') == 'form-1' and 
                        'does not exist' in issue.get('message', '').lower()
                    ]
                    
                    self.log_test("Valid form reference has no errors", len(form_errors) == 0,
                                f"Form errors found: {form_errors}")
                else:
                    self.log_test("Valid form reference validation request", False, f"Response: {data}")

    def test_decision_node_validation(self):
        """Test validation of decision nodes"""
        print("\n🔍 Testing Validation - Decision Node...")
        
        # Create workflow with decision node missing branches
        nodes = [
            {
                "id": "start-1",
                "type": "start",
                "data": {"label": "Start"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "decision-1",
                "type": "decision",
                "data": {
                    "label": "Decision",
                    "condition": "true"
                },
                "position": {"x": 200, "y": 100}
            },
            {
                "id": "end-1",
                "type": "end",
                "data": {"label": "End"},
                "position": {"x": 300, "y": 100}
            }
        ]
        
        # Only one edge - missing yes/no branches
        edges = [
            {
                "id": "edge-1",
                "source": "start-1",
                "target": "decision-1"
            }
        ]
        
        workflow_id = self.create_test_workflow("Decision Node Test Workflow", nodes, edges)
        
        if workflow_id:
            success, data = self.make_request('GET', f'/workflows/{workflow_id}/validate', expected_status=200)
            
            if success and 'issues' in data:
                # Look for decision node warnings
                decision_warnings = [
                    issue for issue in data['issues']
                    if issue.get('nodeId') == 'decision-1' and
                    ('branch' in issue.get('message', '').lower() or 
                     'outgoing' in issue.get('message', '').lower())
                ]
                
                self.log_test("Validation catches decision node issues", len(decision_warnings) > 0,
                            f"Decision warnings: {[i.get('message') for i in decision_warnings]}")

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created workflows
        for workflow_id in self.created_workflows:
            success, _ = self.make_request('DELETE', f'/workflows/{workflow_id}', expected_status=200)
            if success:
                print(f"   Deleted workflow: {workflow_id}")
        
        # Delete created forms  
        for form_id in self.created_forms:
            success, _ = self.make_request('DELETE', f'/forms/{form_id}', expected_status=200)
            if success:
                print(f"   Deleted form: {form_id}")

    def run_all_tests(self):
        """Run all validation tests"""
        print("🚀 Starting LogicCanvas Backend Validation Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        try:
            # Core endpoint tests
            self.test_health_endpoint()
            self.test_validation_endpoint_404()
            
            # Workflow validation tests
            self.test_valid_workflow_validation()
            self.test_workflow_no_start_node()
            self.test_workflow_missing_form_reference()
            self.test_workflow_with_valid_form_reference()
            self.test_decision_node_validation()
            
        finally:
            # Always cleanup
            self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    """Main test runner"""
    tester = LogicCanvasAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())