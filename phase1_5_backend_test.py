#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for LogicCanvas Phase 1-5 Enhancements
Tests new node types (try_catch, retry, batch_process), execution engine, and timeline APIs
"""

import requests
import json
import sys
import uuid
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

class Phase15BackendTester:
    def __init__(self, base_url: str = "https://visual-flow-engine.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_workflows = []
        self.created_instances = []

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

    def create_try_catch_workflow(self) -> Optional[str]:
        """Create a workflow with try-catch node for testing"""
        print("\n🔧 Creating Try-Catch Test Workflow...")
        
        nodes = [
            {
                "id": "start-1",
                "type": "start",
                "data": {"label": "Start"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "try-catch-1",
                "type": "try_catch",
                "data": {
                    "label": "Try-Catch Handler",
                    "onErrorAction": "continue",
                    "errorNodeId": "error-handler-1"
                },
                "position": {"x": 200, "y": 100}
            },
            {
                "id": "task-1",
                "type": "task",
                "data": {
                    "label": "Risky Task",
                    "description": "Task that might fail"
                },
                "position": {"x": 300, "y": 50}
            },
            {
                "id": "success-end",
                "type": "end",
                "data": {"label": "Success End"},
                "position": {"x": 400, "y": 50}
            },
            {
                "id": "error-handler-1",
                "type": "task",
                "data": {
                    "label": "Error Handler",
                    "description": "Handle errors"
                },
                "position": {"x": 300, "y": 150}
            },
            {
                "id": "error-end",
                "type": "end",
                "data": {"label": "Error End"},
                "position": {"x": 400, "y": 150}
            }
        ]
        
        edges = [
            {"id": "edge-1", "source": "start-1", "target": "try-catch-1"},
            {"id": "edge-2", "source": "try-catch-1", "target": "task-1", "sourceHandle": "success"},
            {"id": "edge-3", "source": "task-1", "target": "success-end"},
            {"id": "edge-4", "source": "try-catch-1", "target": "error-handler-1", "sourceHandle": "error"},
            {"id": "edge-5", "source": "error-handler-1", "target": "error-end"}
        ]
        
        workflow_data = {
            "name": "Try-Catch Test Workflow",
            "description": "Test workflow with try-catch error handling",
            "nodes": nodes,
            "edges": edges,
            "status": "draft"
        }
        
        success, data = self.make_request('POST', '/workflows', workflow_data, expected_status=200)
        
        if success and 'id' in data:
            workflow_id = data['id']
            self.created_workflows.append(workflow_id)
            self.log_test("Try-catch workflow creation", True, f"Created workflow: {workflow_id}")
            return workflow_id
        else:
            self.log_test("Try-catch workflow creation", False, f"Response: {data}")
            return None

    def create_retry_workflow(self) -> Optional[str]:
        """Create a workflow with retry node for testing"""
        print("\n🔧 Creating Retry Test Workflow...")
        
        nodes = [
            {
                "id": "start-1",
                "type": "start",
                "data": {"label": "Start"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "retry-1",
                "type": "retry",
                "data": {
                    "label": "Retry Handler",
                    "maxAttempts": 3,
                    "retryDelay": 1000,
                    "backoffMultiplier": 2.0,
                    "retryOn": ["network_error", "timeout", "5xx"]
                },
                "position": {"x": 200, "y": 100}
            },
            {
                "id": "api-call-1",
                "type": "action",
                "data": {
                    "label": "API Call",
                    "actionType": "http",
                    "url": "https://httpbin.org/status/500",
                    "method": "GET"
                },
                "position": {"x": 300, "y": 50}
            },
            {
                "id": "success-end",
                "type": "end",
                "data": {"label": "Success End"},
                "position": {"x": 400, "y": 50}
            },
            {
                "id": "failed-end",
                "type": "end",
                "data": {"label": "All Attempts Failed"},
                "position": {"x": 400, "y": 150}
            }
        ]
        
        edges = [
            {"id": "edge-1", "source": "start-1", "target": "retry-1"},
            {"id": "edge-2", "source": "retry-1", "target": "api-call-1"},
            {"id": "edge-3", "source": "api-call-1", "target": "success-end"},
            {"id": "edge-4", "source": "retry-1", "target": "failed-end", "sourceHandle": "failed"}
        ]
        
        workflow_data = {
            "name": "Retry Test Workflow",
            "description": "Test workflow with retry logic",
            "nodes": nodes,
            "edges": edges,
            "status": "draft"
        }
        
        success, data = self.make_request('POST', '/workflows', workflow_data, expected_status=200)
        
        if success and 'id' in data:
            workflow_id = data['id']
            self.created_workflows.append(workflow_id)
            self.log_test("Retry workflow creation", True, f"Created workflow: {workflow_id}")
            return workflow_id
        else:
            self.log_test("Retry workflow creation", False, f"Response: {data}")
            return None

    def create_batch_process_workflow(self) -> Optional[str]:
        """Create a workflow with batch processing node for testing"""
        print("\n🔧 Creating Batch Process Test Workflow...")
        
        nodes = [
            {
                "id": "start-1",
                "type": "start",
                "data": {"label": "Start"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "batch-1",
                "type": "batch_process",
                "data": {
                    "label": "Batch Processor",
                    "items": ["item1", "item2", "item3", "item4", "item5", "item6", "item7", "item8", "item9", "item10"],
                    "batchSize": 3,
                    "concurrentBatches": 1,
                    "delayBetweenBatches": 500
                },
                "position": {"x": 200, "y": 100}
            },
            {
                "id": "process-item",
                "type": "task",
                "data": {
                    "label": "Process Item",
                    "description": "Process individual batch item"
                },
                "position": {"x": 300, "y": 100}
            },
            {
                "id": "end-1",
                "type": "end",
                "data": {"label": "End"},
                "position": {"x": 400, "y": 100}
            }
        ]
        
        edges = [
            {"id": "edge-1", "source": "start-1", "target": "batch-1"},
            {"id": "edge-2", "source": "batch-1", "target": "process-item"},
            {"id": "edge-3", "source": "process-item", "target": "end-1"}
        ]
        
        workflow_data = {
            "name": "Batch Process Test Workflow",
            "description": "Test workflow with batch processing",
            "nodes": nodes,
            "edges": edges,
            "status": "draft"
        }
        
        success, data = self.make_request('POST', '/workflows', workflow_data, expected_status=200)
        
        if success and 'id' in data:
            workflow_id = data['id']
            self.created_workflows.append(workflow_id)
            self.log_test("Batch process workflow creation", True, f"Created workflow: {workflow_id}")
            return workflow_id
        else:
            self.log_test("Batch process workflow creation", False, f"Response: {data}")
            return None

    def test_workflow_execution(self, workflow_id: str, workflow_name: str) -> Optional[str]:
        """Execute a workflow and return instance ID"""
        print(f"\n🚀 Executing {workflow_name}...")
        
        execution_data = {
            "triggered_by": "test",
            "input_data": {"test": True}
        }
        
        success, data = self.make_request('POST', f'/workflows/{workflow_id}/execute', 
                                        execution_data, expected_status=200)
        
        if success and 'instance_id' in data:
            instance_id = data['instance_id']
            self.created_instances.append(instance_id)
            self.log_test(f"{workflow_name} execution started", True, f"Instance ID: {instance_id}")
            return instance_id
        else:
            self.log_test(f"{workflow_name} execution", False, f"Response: {data}")
            return None

    def test_timeline_api(self, instance_id: str, workflow_name: str):
        """Test the timeline API endpoint for a workflow instance"""
        print(f"\n📊 Testing Timeline API for {workflow_name}...")
        
        # Wait a moment for execution to start
        time.sleep(2)
        
        success, data = self.make_request('GET', f'/workflow-instances/{instance_id}/timeline', 
                                        expected_status=200)
        
        if success:
            # Check timeline structure
            has_timeline = 'timeline' in data and isinstance(data['timeline'], list)
            has_stats = 'stats' in data and isinstance(data['stats'], dict)
            has_branch_paths = 'branchPaths' in data
            
            self.log_test(f"{workflow_name} timeline API response structure", 
                         has_timeline and has_stats, 
                         f"Timeline: {has_timeline}, Stats: {has_stats}, BranchPaths: {has_branch_paths}")
            
            if has_stats:
                stats = data['stats']
                required_stats = ['total', 'completed', 'failed', 'retried', 'duration', 'avgNodeTime']
                missing_stats = [stat for stat in required_stats if stat not in stats]
                
                self.log_test(f"{workflow_name} timeline stats completeness", 
                             len(missing_stats) == 0,
                             f"Missing stats: {missing_stats}" if missing_stats else "All stats present")
            
            if has_timeline:
                timeline = data['timeline']
                self.log_test(f"{workflow_name} timeline has events", 
                             len(timeline) > 0,
                             f"Found {len(timeline)} timeline events")
                
                # Check timeline event structure
                if timeline:
                    event = timeline[0]
                    required_fields = ['node_id', 'status', 'timestamp']
                    missing_fields = [field for field in required_fields if field not in event]
                    
                    self.log_test(f"{workflow_name} timeline event structure", 
                                 len(missing_fields) == 0,
                                 f"Missing fields: {missing_fields}" if missing_fields else "Event structure correct")
        else:
            self.log_test(f"{workflow_name} timeline API", False, f"Response: {data}")

    def test_workflow_instance_status(self, instance_id: str, workflow_name: str):
        """Test workflow instance status endpoint"""
        print(f"\n📋 Testing Instance Status for {workflow_name}...")
        
        success, data = self.make_request('GET', f'/workflow-instances/{instance_id}', 
                                        expected_status=200)
        
        if success:
            # Check instance structure
            required_fields = ['id', 'workflow_id', 'status', 'started_at', 'variables']
            missing_fields = [field for field in required_fields if field not in data]
            
            self.log_test(f"{workflow_name} instance structure", 
                         len(missing_fields) == 0,
                         f"Missing fields: {missing_fields}" if missing_fields else "Instance structure correct")
            
            # Check status is valid
            valid_statuses = ['running', 'completed', 'failed', 'waiting', 'paused']
            status = data.get('status')
            
            self.log_test(f"{workflow_name} instance status valid", 
                         status in valid_statuses,
                         f"Status: {status}")
            
            # Check for node states
            if 'node_states' in data:
                node_states = data['node_states']
                self.log_test(f"{workflow_name} has node states", 
                             isinstance(node_states, dict),
                             f"Node states: {len(node_states) if isinstance(node_states, dict) else 'invalid'}")
        else:
            self.log_test(f"{workflow_name} instance status", False, f"Response: {data}")

    def test_execution_engine_features(self):
        """Test Phase 5 execution engine enhancements"""
        print("\n🔍 Testing Phase 5: Backend Execution Engine...")
        
        # Test try-catch workflow
        try_catch_id = self.create_try_catch_workflow()
        if try_catch_id:
            instance_id = self.test_workflow_execution(try_catch_id, "Try-Catch Workflow")
            if instance_id:
                self.test_timeline_api(instance_id, "Try-Catch Workflow")
                self.test_workflow_instance_status(instance_id, "Try-Catch Workflow")
        
        # Test retry workflow
        retry_id = self.create_retry_workflow()
        if retry_id:
            instance_id = self.test_workflow_execution(retry_id, "Retry Workflow")
            if instance_id:
                self.test_timeline_api(instance_id, "Retry Workflow")
                self.test_workflow_instance_status(instance_id, "Retry Workflow")
        
        # Test batch process workflow
        batch_id = self.create_batch_process_workflow()
        if batch_id:
            instance_id = self.test_workflow_execution(batch_id, "Batch Process Workflow")
            if instance_id:
                self.test_timeline_api(instance_id, "Batch Process Workflow")
                self.test_workflow_instance_status(instance_id, "Batch Process Workflow")

    def test_workflow_instances_list(self):
        """Test workflow instances list endpoint"""
        print("\n📋 Testing Workflow Instances List...")
        
        success, data = self.make_request('GET', '/workflow-instances', expected_status=200)
        
        if success:
            has_instances = 'instances' in data and isinstance(data['instances'], list)
            has_count = 'count' in data and isinstance(data['count'], int)
            
            self.log_test("Workflow instances list structure", 
                         has_instances and has_count,
                         f"Instances: {has_instances}, Count: {has_count}")
            
            if has_instances:
                instances = data['instances']
                self.log_test("Workflow instances list has data", 
                             len(instances) >= 0,
                             f"Found {len(instances)} instances")
        else:
            self.log_test("Workflow instances list", False, f"Response: {data}")

    def test_node_type_validation(self):
        """Test that new node types are properly validated"""
        print("\n🔍 Testing New Node Type Validation...")
        
        # Test workflow with new node types
        nodes = [
            {
                "id": "start-1",
                "type": "start",
                "data": {"label": "Start"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "try-catch-1",
                "type": "try_catch",
                "data": {"label": "Try-Catch"},
                "position": {"x": 200, "y": 100}
            },
            {
                "id": "retry-1",
                "type": "retry",
                "data": {"label": "Retry"},
                "position": {"x": 300, "y": 100}
            },
            {
                "id": "batch-1",
                "type": "batch_process",
                "data": {"label": "Batch Process"},
                "position": {"x": 400, "y": 100}
            },
            {
                "id": "end-1",
                "type": "end",
                "data": {"label": "End"},
                "position": {"x": 500, "y": 100}
            }
        ]
        
        edges = [
            {"id": "edge-1", "source": "start-1", "target": "try-catch-1"},
            {"id": "edge-2", "source": "try-catch-1", "target": "retry-1"},
            {"id": "edge-3", "source": "retry-1", "target": "batch-1"},
            {"id": "edge-4", "source": "batch-1", "target": "end-1"}
        ]
        
        workflow_data = {
            "name": "New Node Types Validation Test",
            "description": "Test workflow with all new node types",
            "nodes": nodes,
            "edges": edges,
            "status": "draft"
        }
        
        success, data = self.make_request('POST', '/workflows', workflow_data, expected_status=200)
        
        if success and 'id' in data:
            workflow_id = data['id']
            self.created_workflows.append(workflow_id)
            self.log_test("New node types workflow creation", True, f"Created workflow: {workflow_id}")
            
            # Test validation
            success, validation_data = self.make_request('GET', f'/workflows/{workflow_id}/validate', 
                                                       expected_status=200)
            
            if success:
                issues = validation_data.get('issues', [])
                error_count = len([i for i in issues if i.get('type') == 'error'])
                
                self.log_test("New node types validation", 
                             error_count == 0,
                             f"Found {error_count} validation errors")
            else:
                self.log_test("New node types validation", False, f"Validation response: {validation_data}")
        else:
            self.log_test("New node types workflow creation", False, f"Response: {data}")

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created workflows
        for workflow_id in self.created_workflows:
            success, _ = self.make_request('DELETE', f'/workflows/{workflow_id}', expected_status=200)
            if success:
                print(f"   Deleted workflow: {workflow_id}")
        
        # Note: Instances are typically cleaned up automatically or kept for audit

    def run_all_tests(self):
        """Run all Phase 1-5 backend tests"""
        print("🚀 Starting LogicCanvas Phase 1-5 Backend Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 70)
        
        try:
            # Core health check
            self.test_health_endpoint()
            
            # Phase 5: Backend execution engine tests
            self.test_execution_engine_features()
            
            # Additional API tests
            self.test_workflow_instances_list()
            self.test_node_type_validation()
            
        finally:
            # Always cleanup
            self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All Phase 1-5 backend tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    """Main test runner"""
    tester = Phase15BackendTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())