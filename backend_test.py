#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for LogicCanvas Template Library
Tests template library functionality, static file serving, and workflow creation from templates
"""

import requests
import json
import sys
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

class TemplateLibraryTester:
    def __init__(self, base_url: str = "https://lib-growth-next.preview.emergentagent.com"):
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

    def test_static_file_serving(self):
        """Test if templates directory is served as static files"""
        print("\n🔍 Testing Static File Serving - Templates Index...")
        
        # Test direct access to templates/index.json
        url = f"{self.base_url}/templates/index.json"
        try:
            response = requests.get(url, timeout=30)
            success = response.status_code == 200
            
            if success:
                try:
                    data = response.json()
                    templates = data.get("templates", [])
                    categories = data.get("categories", [])
                    
                    self.log_test("Static file serving works", True, 
                                f"Found {len(templates)} templates and {len(categories)} categories")
                    
                    # Verify we have 61 templates as expected
                    if len(templates) >= 61:
                        self.log_test("Template count verification", True, 
                                    f"Found {len(templates)} templates (expected 61+)")
                    else:
                        self.log_test("Template count verification", False, 
                                    f"Expected 61+ templates, found {len(templates)}")
                    
                    return True, data
                except json.JSONDecodeError:
                    self.log_test("Static file serving JSON parsing", False, 
                                "Response is not valid JSON")
                    return False, {}
            else:
                self.log_test("Static file serving accessibility", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                return False, {}
                
        except Exception as e:
            self.log_test("Static file serving request", False, f"Error: {str(e)}")
            return False, {}

    def test_templates_api_endpoint(self):
        """Test the /api/templates endpoint"""
        print("\n🔍 Testing Templates API Endpoint...")
        
        success, data = self.make_request('GET', '/templates', expected_status=200)
        
        if success and isinstance(data, dict):
            templates = data.get("templates", [])
            count = data.get("count", 0)
            
            self.log_test("Templates API endpoint works", True, 
                        f"API returned {count} templates")
            
            if count >= 61:
                self.log_test("API template count verification", True, 
                            f"Found {count} templates (expected 61+)")
            else:
                self.log_test("API template count verification", False, 
                            f"Expected 61+ templates from API, found {count}")
                
        else:
            self.log_test("Templates API endpoint", False, f"Response: {data}")
        
        return success, data

    def test_specific_template_loading(self):
        """Test loading a specific template"""
        print("\n🔍 Testing Specific Template Loading...")
        
        # Test loading a known template
        template_id = "hr-onboarding"
        success, data = self.make_request('GET', f'/templates/{template_id}', expected_status=200)
        
        if success and isinstance(data, dict):
            self.log_test("Specific template loading works", True, 
                        f"Loaded template: {data.get('name', 'Unknown')}")
            
            # Verify template has required fields
            required_fields = ['name', 'description', 'nodes', 'edges']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                self.log_test("Template has required fields", True)
            else:
                self.log_test("Template has required fields", False, 
                            f"Missing fields: {missing_fields}")
        else:
            self.log_test("Specific template loading", False, f"Response: {data}")
        
        return success, data

    def test_template_workflow_creation(self):
        """Test creating a workflow from template"""
        print("\n🔍 Testing Template Workflow Creation...")
        
        template_id = "hr-onboarding"
        workflow_data = {
            "name": "Test HR Onboarding Workflow from Template"
        }
        
        success, data = self.make_request('POST', f'/templates/{template_id}/create-workflow', 
                                        workflow_data, expected_status=200)
        
        if success and isinstance(data, dict):
            workflow_id = data.get("id")
            if workflow_id:
                self.log_test("Template workflow creation works", True, 
                            f"Created workflow with ID: {workflow_id}")
                self.created_workflows.append(workflow_id)
                
                # Verify the created workflow has template metadata
                workflow_success, workflow_data = self.make_request('GET', f'/workflows/{workflow_id}', 
                                                                  expected_status=200)
                if workflow_success:
                    template_metadata = workflow_data.get("template_id") == template_id
                    self.log_test("Created workflow has template metadata", template_metadata)
                
                return True, data
            else:
                self.log_test("Template workflow creation", False, "No workflow ID returned")
        else:
            self.log_test("Template workflow creation", False, f"Response: {data}")
        
        return success, data

    def test_template_categories_and_complexity(self):
        """Test template categorization and complexity levels"""
        print("\n🔍 Testing Template Categories and Complexity...")
        
        success, response = self.test_static_file_serving()
        
        if success and isinstance(response, dict):
            templates = response.get("templates", [])
            categories = response.get("categories", [])
            
            # Count by complexity
            complexity_counts = {}
            category_counts = {}
            
            for template in templates:
                complexity = template.get("complexity", "unknown")
                category = template.get("category", "unknown")
                
                complexity_counts[complexity] = complexity_counts.get(complexity, 0) + 1
                category_counts[category] = category_counts.get(category, 0) + 1
            
            print(f"   📊 Complexity Distribution:")
            for complexity, count in complexity_counts.items():
                print(f"      {complexity}: {count} templates")
                
            print(f"   📊 Category Distribution:")
            for category, count in sorted(category_counts.items()):
                print(f"      {category}: {count} templates")
                
            # Verify expected complexity levels exist
            expected_complexities = ['simple', 'medium', 'high', 'complex']
            found_complexities = set(complexity_counts.keys())
            
            if all(c in found_complexities for c in expected_complexities):
                self.log_test("All expected complexity levels found", True)
            else:
                missing = set(expected_complexities) - found_complexities
                self.log_test("All expected complexity levels found", False, 
                            f"Missing complexity levels: {missing}")
                
            # Verify categories exist
            if len(categories) >= 10:
                self.log_test("Sufficient categories defined", True, 
                            f"Found {len(categories)} categories")
            else:
                self.log_test("Sufficient categories defined", False, 
                            f"Expected 10+ categories, found {len(categories)}")
                
        return success, response

    def run_all_tests(self):
        """Run all template library tests"""
        print("🚀 Starting Template Library Backend Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        try:
            # Core endpoint tests
            self.test_health_endpoint()
            
            # Template library specific tests
            self.test_static_file_serving()
            self.test_templates_api_endpoint()
            self.test_specific_template_loading()
            self.test_template_workflow_creation()
            self.test_template_categories_and_complexity()
            
            # Legacy validation tests (keep some for completeness)
            self.test_validation_endpoint_404()
            self.test_valid_workflow_validation()
            
        finally:
            # Always cleanup
            self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All template library tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    """Main test runner"""
    tester = TemplateLibraryTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())