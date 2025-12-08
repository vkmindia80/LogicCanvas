#!/usr/bin/env python3
"""
Phase 6 Analytics Dashboard Comprehensive Testing
Tests all 11 analytics endpoints, workflow lifecycle, task management, and template functionality
"""

import requests
import json
import sys
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

class Phase6ComprehensiveTester:
    def __init__(self, base_url: str = "https://workflow-analytics-3.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_workflows = []
        self.created_tasks = []
        self.auth_token = None
        self.current_user = None

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
        
        if self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:500]}
            
            return success, response_data
        except Exception as e:
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test basic health endpoint"""
        print("\n🔍 Testing Health Check...")
        success, data = self.make_request('GET', '/health')
        self.log_test("Health Check", success, 
                     f"Status: {data.get('status', 'unknown')}" if success else str(data))

    def test_authentication(self):
        """Test user authentication"""
        print("\n🔐 Testing Authentication...")
        
        # Try to login with admin user
        login_data = {
            "username": "admin@example.com",
            "password": "admin123"
        }
        
        success, data = self.make_request('POST', '/auth/login', login_data)
        if success and 'access_token' in data:
            self.auth_token = data['access_token']
            self.current_user = data.get('user', {})
            self.log_test("Admin Login", True, f"Logged in as {self.current_user.get('email', 'unknown')}")
        else:
            self.log_test("Admin Login", False, f"Login failed: {data}")

    def test_analytics_endpoints(self):
        """Test all 11 analytics endpoints"""
        print("\n📊 Testing Analytics Endpoints...")
        
        analytics_endpoints = [
            # Overview Analytics (1 endpoint)
            ('GET', '/analytics/overview', 'Analytics Overview'),
            
            # Workflow Analytics (4 endpoints)
            ('GET', '/analytics/workflows/throughput?days=30', 'Workflow Throughput'),
            ('GET', '/analytics/workflows/execution-time', 'Workflow Execution Time'),
            ('GET', '/analytics/workflows/success-rate', 'Workflow Success Rate'),
            ('GET', '/analytics/workflows/popularity', 'Workflow Popularity'),
            
            # SLA Analytics (2 endpoints)
            ('GET', '/analytics/sla/compliance', 'SLA Compliance'),
            ('GET', '/analytics/sla/trends?days=30', 'SLA Trends'),
            
            # Node Analytics (2 endpoints)
            ('GET', '/analytics/nodes/performance', 'Node Performance'),
            ('GET', '/analytics/nodes/bottlenecks?limit=5', 'Node Bottlenecks'),
            
            # User Analytics (2 endpoints)
            ('GET', '/analytics/users/productivity', 'User Productivity'),
            ('GET', '/analytics/users/workload', 'User Workload')
        ]
        
        for method, endpoint, name in analytics_endpoints:
            success, data = self.make_request(method, endpoint)
            if success:
                # Check if response has expected structure
                has_data = 'data' in data or any(key in data for key in ['workflows', 'tasks', 'sla', 'compliance_rate', 'slowest_nodes', 'highest_failure_nodes'])
                self.log_test(f"Analytics: {name}", has_data, 
                             f"Response keys: {list(data.keys())}" if has_data else "Missing expected data structure")
            else:
                self.log_test(f"Analytics: {name}", False, str(data))

    def create_sample_workflow(self) -> Optional[str]:
        """Create a sample workflow for testing"""
        workflow_data = {
            "name": f"Test Workflow {datetime.now().strftime('%H%M%S')}",
            "description": "Sample workflow for Phase 6 testing",
            "nodes": [
                {
                    "id": "start-1",
                    "type": "start",
                    "data": {"label": "Start"},
                    "position": {"x": 100, "y": 100}
                },
                {
                    "id": "task-1",
                    "type": "task",
                    "data": {
                        "label": "Sample Task",
                        "title": "Review Document",
                        "description": "Please review the attached document",
                        "dueInHours": 24
                    },
                    "position": {"x": 300, "y": 100}
                },
                {
                    "id": "end-1",
                    "type": "end",
                    "data": {"label": "End"},
                    "position": {"x": 500, "y": 100}
                }
            ],
            "edges": [
                {
                    "id": "e1",
                    "source": "start-1",
                    "target": "task-1"
                },
                {
                    "id": "e2",
                    "source": "task-1",
                    "target": "end-1"
                }
            ],
            "status": "draft",
            "tags": ["test", "phase6"]
        }
        
        success, data = self.make_request('POST', '/workflows', workflow_data, 200)
        if success and 'id' in data:
            workflow_id = data['id']
            self.created_workflows.append(workflow_id)
            return workflow_id
        return None

    def test_workflow_lifecycle(self):
        """Test workflow lifecycle management"""
        print("\n🔄 Testing Workflow Lifecycle Management...")
        
        # Create a workflow
        workflow_id = self.create_sample_workflow()
        if not workflow_id:
            self.log_test("Create Sample Workflow", False, "Failed to create workflow")
            return
        
        self.log_test("Create Sample Workflow", True, f"Created workflow: {workflow_id}")
        
        # Test lifecycle transitions
        transitions = [
            ('review', 'Request Review'),
            ('approve', 'Approve Workflow'),
            ('pause', 'Pause Workflow'),
            ('resume', 'Resume Workflow'),
            ('archive', 'Archive Workflow')
        ]
        
        for transition, name in transitions:
            transition_data = {
                "comment": f"Testing {transition} transition",
                "changed_by": "test_user"
            }
            
            success, data = self.make_request('POST', f'/workflows/{workflow_id}/lifecycle/{transition}', transition_data)
            self.log_test(f"Lifecycle: {name}", success, 
                         f"New state: {data.get('new_state', 'unknown')}" if success else str(data))

    def test_version_management(self):
        """Test version management functionality"""
        print("\n📝 Testing Version Management...")
        
        if not self.created_workflows:
            self.log_test("Version Management Setup", False, "No workflows available for testing")
            return
        
        workflow_id = self.created_workflows[0]
        
        # Test get versions
        success, data = self.make_request('GET', f'/workflows/{workflow_id}/versions')
        self.log_test("Get Workflow Versions", success, 
                     f"Found {data.get('version_count', 0)} versions" if success else str(data))
        
        # Test version comparison
        compare_data = {"version_a": 1, "version_b": 1}
        success, data = self.make_request('POST', f'/workflows/{workflow_id}/versions/compare', compare_data)
        self.log_test("Compare Workflow Versions", success, 
                     f"Diff keys: {list(data.get('diff', {}).keys())}" if success else str(data))

    def test_task_management(self):
        """Test task management functionality"""
        print("\n📋 Testing Task Management...")
        
        # Create a task
        task_data = {
            "workflow_instance_id": str(uuid.uuid4()),
            "node_id": "task-1",
            "title": "Test Task for Phase 6",
            "description": "This is a test task created during Phase 6 testing",
            "priority": "high",
            "status": "pending"
        }
        
        success, data = self.make_request('POST', '/tasks', task_data, 200)
        if success and 'id' in data:
            task_id = data['id']
            self.created_tasks.append(task_id)
            self.log_test("Create Task", True, f"Created task: {task_id}")
            
            # Test task assignment strategies
            assignment_strategies = [
                ("direct", "admin@example.com"),
                ("role", "admin"),
                ("load_balanced", "admin")
            ]
            
            for strategy, target in assignment_strategies:
                assign_data = {
                    "task_id": task_id,
                    "strategy": strategy,
                    "target": target
                }
                
                success, data = self.make_request('POST', '/tasks/assign', assign_data)
                self.log_test(f"Task Assignment: {strategy}", success, 
                             f"Assigned to: {data.get('assignee', 'unknown')}" if success else str(data))
                break  # Only test one strategy to avoid conflicts
        else:
            self.log_test("Create Task", False, str(data))

    def test_template_functionality(self):
        """Test template library functionality"""
        print("\n📚 Testing Template Functionality...")
        
        # Test get templates
        success, data = self.make_request('GET', '/templates')
        if success:
            templates = data.get('templates', [])
            self.log_test("Get Templates", len(templates) > 0, 
                         f"Found {len(templates)} templates")
            
            # Test get specific template
            if templates:
                template_id = templates[0].get('id')
                if template_id:
                    success, template_data = self.make_request('GET', f'/templates/{template_id}')
                    self.log_test("Get Specific Template", success, 
                                 f"Template: {template_data.get('name', 'unknown')}" if success else str(template_data))
                    
                    # Test create workflow from template
                    create_data = {"name": f"From Template {datetime.now().strftime('%H%M%S')}"}
                    success, workflow_data = self.make_request('POST', f'/templates/{template_id}/create-workflow', create_data)
                    if success and 'id' in workflow_data:
                        self.created_workflows.append(workflow_data['id'])
                        self.log_test("Create Workflow from Template", True, 
                                     f"Created workflow: {workflow_data['id']}")
                    else:
                        self.log_test("Create Workflow from Template", False, str(workflow_data))
        else:
            self.log_test("Get Templates", False, str(data))

    def test_approval_queue(self):
        """Test approval queue functionality"""
        print("\n✅ Testing Approval Queue...")
        
        # Create an approval
        approval_data = {
            "workflow_instance_id": str(uuid.uuid4()),
            "node_id": "approval-1",
            "title": "Test Approval for Phase 6",
            "description": "This is a test approval created during Phase 6 testing",
            "approvers": ["admin@example.com"],
            "approval_type": "single"
        }
        
        success, data = self.make_request('POST', '/approvals', approval_data, 200)
        if success and 'id' in data:
            approval_id = data['id']
            self.log_test("Create Approval", True, f"Created approval: {approval_id}")
            
            # Test get approvals
            success, data = self.make_request('GET', '/approvals?status=pending')
            self.log_test("Get Pending Approvals", success, 
                         f"Found {data.get('count', 0)} pending approvals" if success else str(data))
        else:
            self.log_test("Create Approval", False, str(data))

    def test_notifications(self):
        """Test notifications system"""
        print("\n🔔 Testing Notifications System...")
        
        # Test get notifications
        success, data = self.make_request('GET', '/notifications')
        self.log_test("Get All Notifications", success, 
                     f"Found {data.get('count', 0)} notifications" if success else str(data))
        
        # Test get unread notifications
        success, data = self.make_request('GET', '/notifications?unread_only=true')
        self.log_test("Get Unread Notifications", success, 
                     f"Found {data.get('count', 0)} unread notifications" if success else str(data))

    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created workflows
        for workflow_id in self.created_workflows:
            success, _ = self.make_request('DELETE', f'/workflows/{workflow_id}', expected_status=200)
            if success:
                print(f"   Deleted workflow: {workflow_id}")
        
        # Note: Tasks and approvals are typically not deleted in production systems
        # but their status can be updated to completed/cancelled

    def run_all_tests(self):
        """Run all Phase 6 comprehensive tests"""
        print("🚀 Starting Phase 6 Analytics Dashboard Comprehensive Testing")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 80)
        
        try:
            # Core functionality tests
            self.test_health_check()
            self.test_authentication()
            
            # Phase 6 specific tests
            self.test_analytics_endpoints()
            
            # Workflow management tests
            self.test_workflow_lifecycle()
            self.test_version_management()
            
            # Task and approval tests
            self.test_task_management()
            self.test_approval_queue()
            
            # Template and notification tests
            self.test_template_functionality()
            self.test_notifications()
            
        except KeyboardInterrupt:
            print("\n⚠️ Testing interrupted by user")
        except Exception as e:
            print(f"\n💥 Unexpected error during testing: {e}")
        finally:
            self.cleanup()
            self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 PHASE 6 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        print(f"🎯 Total Tests: {self.tests_run}")
        
        # Group results by category
        categories = {}
        for result in self.test_results:
            category = result['name'].split(':')[0] if ':' in result['name'] else 'General'
            if category not in categories:
                categories[category] = {'passed': 0, 'total': 0}
            categories[category]['total'] += 1
            if result['success']:
                categories[category]['passed'] += 1
        
        print("\n📋 Results by Category:")
        for category, stats in categories.items():
            rate = (stats['passed'] / stats['total'] * 100) if stats['total'] > 0 else 0
            print(f"   {category}: {stats['passed']}/{stats['total']} ({rate:.1f}%)")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['name']}: {test['details']}")
        
        print("\n" + "=" * 80)
        
        return success_rate >= 80  # Consider 80%+ as overall success

def main():
    """Main function"""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "https://workflow-analytics-3.preview.emergentagent.com"
    
    tester = Phase6ComprehensiveTester(base_url)
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()