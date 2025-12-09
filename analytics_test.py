#!/usr/bin/env python3
"""
Comprehensive Analytics API Testing for LogicCanvas Phase 6
Tests all 11 analytics endpoints and their data structure
"""

import requests
import json
import sys
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

class AnalyticsAPITester:
    def __init__(self, base_url: str = "https://code-integration-6.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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

    def make_request(self, endpoint: str, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP GET request and return success status and response data"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}
            
            return success, response_data
        except Exception as e:
            return False, {"error": str(e)}

    def test_analytics_overview(self):
        """Test /api/analytics/overview endpoint"""
        print("\n🔍 Testing Analytics Overview Endpoint...")
        
        success, data = self.make_request('analytics/overview')
        
        if success:
            # Check required top-level fields
            required_fields = ['workflows', 'tasks', 'sla', 'approvals', 'recent_activity']
            missing_fields = [field for field in required_fields if field not in data]
            
            self.log_test("Overview endpoint returns required fields", 
                         len(missing_fields) == 0, 
                         f"Missing fields: {missing_fields}")
            
            # Check workflows section
            if 'workflows' in data:
                wf_fields = ['total', 'total_executions', 'success_rate', 'completed', 'failed']
                wf_missing = [f for f in wf_fields if f not in data['workflows']]
                self.log_test("Overview workflows section complete", 
                             len(wf_missing) == 0,
                             f"Missing workflow fields: {wf_missing}")
            
            # Check tasks section
            if 'tasks' in data:
                task_fields = ['pending', 'overdue']
                task_missing = [f for f in task_fields if f not in data['tasks']]
                self.log_test("Overview tasks section complete",
                             len(task_missing) == 0,
                             f"Missing task fields: {task_missing}")
            
            # Check SLA section
            if 'sla' in data:
                sla_fields = ['compliance_rate']
                sla_missing = [f for f in sla_fields if f not in data['sla']]
                self.log_test("Overview SLA section complete",
                             len(sla_missing) == 0,
                             f"Missing SLA fields: {sla_missing}")
        else:
            self.log_test("Overview endpoint accessibility", False, f"Response: {data}")

    def test_workflow_throughput(self):
        """Test /api/analytics/workflows/throughput endpoint"""
        print("\n🔍 Testing Workflow Throughput Endpoint...")
        
        success, data = self.make_request('analytics/workflows/throughput?days=30')
        
        if success:
            # Check response structure
            has_data = 'data' in data and isinstance(data['data'], list)
            self.log_test("Throughput endpoint returns data array", has_data)
            
            if has_data and len(data['data']) > 0:
                # Check first item structure
                first_item = data['data'][0]
                required_fields = ['date', 'total', 'completed']
                missing_fields = [f for f in required_fields if f not in first_item]
                
                self.log_test("Throughput data items have required fields",
                             len(missing_fields) == 0,
                             f"Missing fields in data items: {missing_fields}")
            else:
                self.log_test("Throughput data array structure", True, "Empty data array (acceptable)")
        else:
            self.log_test("Throughput endpoint accessibility", False, f"Response: {data}")

    def test_workflow_execution_time(self):
        """Test /api/analytics/workflows/execution-time endpoint"""
        print("\n🔍 Testing Workflow Execution Time Endpoint...")
        
        success, data = self.make_request('analytics/workflows/execution-time')
        
        if success:
            has_data = 'data' in data and isinstance(data['data'], list)
            self.log_test("Execution time endpoint returns data array", has_data)
            
            if has_data and len(data['data']) > 0:
                first_item = data['data'][0]
                required_fields = ['workflow_name', 'avg_execution_time', 'executions', 'min_time', 'max_time']
                missing_fields = [f for f in required_fields if f not in first_item]
                
                self.log_test("Execution time data items have required fields",
                             len(missing_fields) == 0,
                             f"Missing fields: {missing_fields}")
            else:
                self.log_test("Execution time data structure", True, "Empty data array (acceptable)")
        else:
            self.log_test("Execution time endpoint accessibility", False, f"Response: {data}")

    def test_workflow_success_rate(self):
        """Test /api/analytics/workflows/success-rate endpoint"""
        print("\n🔍 Testing Workflow Success Rate Endpoint...")
        
        success, data = self.make_request('analytics/workflows/success-rate')
        
        if success:
            has_data = 'data' in data and isinstance(data['data'], list)
            self.log_test("Success rate endpoint returns data array", has_data)
            
            if has_data and len(data['data']) > 0:
                # Check for pie chart data structure
                first_item = data['data'][0]
                required_fields = ['name', 'value']
                missing_fields = [f for f in required_fields if f not in first_item]
                
                self.log_test("Success rate data items have required fields",
                             len(missing_fields) == 0,
                             f"Missing fields: {missing_fields}")
            else:
                self.log_test("Success rate data structure", True, "Empty data array (acceptable)")
        else:
            self.log_test("Success rate endpoint accessibility", False, f"Response: {data}")

    def test_workflow_popularity(self):
        """Test /api/analytics/workflows/popularity endpoint"""
        print("\n🔍 Testing Workflow Popularity Endpoint...")
        
        success, data = self.make_request('analytics/workflows/popularity')
        
        if success:
            has_data = 'data' in data and isinstance(data['data'], list)
            self.log_test("Popularity endpoint returns data array", has_data)
            
            if has_data and len(data['data']) > 0:
                first_item = data['data'][0]
                required_fields = ['workflow_name', 'executions']
                missing_fields = [f for f in required_fields if f not in first_item]
                
                self.log_test("Popularity data items have required fields",
                             len(missing_fields) == 0,
                             f"Missing fields: {missing_fields}")
            else:
                self.log_test("Popularity data structure", True, "Empty data array (acceptable)")
        else:
            self.log_test("Popularity endpoint accessibility", False, f"Response: {data}")

    def test_sla_compliance(self):
        """Test /api/analytics/sla/compliance endpoint"""
        print("\n🔍 Testing SLA Compliance Endpoint...")
        
        success, data = self.make_request('analytics/sla/compliance')
        
        if success:
            required_fields = ['compliance_rate', 'completed_on_time', 'completed_late', 'overdue', 'at_risk', 'tasks_with_sla']
            missing_fields = [f for f in required_fields if f not in data]
            
            self.log_test("SLA compliance endpoint returns required fields",
                         len(missing_fields) == 0,
                         f"Missing fields: {missing_fields}")
            
            # Check data types
            if 'compliance_rate' in data:
                is_number = isinstance(data['compliance_rate'], (int, float))
                self.log_test("SLA compliance rate is numeric", is_number)
        else:
            self.log_test("SLA compliance endpoint accessibility", False, f"Response: {data}")

    def test_sla_trends(self):
        """Test /api/analytics/sla/trends endpoint"""
        print("\n🔍 Testing SLA Trends Endpoint...")
        
        success, data = self.make_request('analytics/sla/trends?days=30')
        
        if success:
            has_data = 'data' in data and isinstance(data['data'], list)
            self.log_test("SLA trends endpoint returns data array", has_data)
            
            if has_data and len(data['data']) > 0:
                first_item = data['data'][0]
                required_fields = ['date', 'compliance', 'on_time', 'late']
                missing_fields = [f for f in required_fields if f not in first_item]
                
                self.log_test("SLA trends data items have required fields",
                             len(missing_fields) == 0,
                             f"Missing fields: {missing_fields}")
            else:
                self.log_test("SLA trends data structure", True, "Empty data array (acceptable)")
        else:
            self.log_test("SLA trends endpoint accessibility", False, f"Response: {data}")

    def test_node_performance(self):
        """Test /api/analytics/nodes/performance endpoint"""
        print("\n🔍 Testing Node Performance Endpoint...")
        
        success, data = self.make_request('analytics/nodes/performance')
        
        if success:
            has_data = 'data' in data and isinstance(data['data'], list)
            self.log_test("Node performance endpoint returns data array", has_data)
            
            if has_data and len(data['data']) > 0:
                first_item = data['data'][0]
                required_fields = ['node_id', 'node_type', 'executions', 'avg_execution_time', 'successes', 'failures', 'failure_rate']
                missing_fields = [f for f in required_fields if f not in first_item]
                
                self.log_test("Node performance data items have required fields",
                             len(missing_fields) == 0,
                             f"Missing fields: {missing_fields}")
            else:
                self.log_test("Node performance data structure", True, "Empty data array (acceptable)")
        else:
            self.log_test("Node performance endpoint accessibility", False, f"Response: {data}")

    def test_node_bottlenecks(self):
        """Test /api/analytics/nodes/bottlenecks endpoint"""
        print("\n🔍 Testing Node Bottlenecks Endpoint...")
        
        success, data = self.make_request('analytics/nodes/bottlenecks?limit=5')
        
        if success:
            # Check for bottleneck categories
            required_sections = ['slowest_nodes', 'highest_failure_nodes']
            missing_sections = [s for s in required_sections if s not in data]
            
            self.log_test("Node bottlenecks endpoint returns required sections",
                         len(missing_sections) == 0,
                         f"Missing sections: {missing_sections}")
            
            # Check slowest nodes structure
            if 'slowest_nodes' in data and len(data['slowest_nodes']) > 0:
                first_slow = data['slowest_nodes'][0]
                required_fields = ['node_id', 'node_type', 'avg_execution_time', 'executions']
                missing_fields = [f for f in required_fields if f not in first_slow]
                
                self.log_test("Slowest nodes data has required fields",
                             len(missing_fields) == 0,
                             f"Missing fields: {missing_fields}")
            
            # Check highest failure nodes structure
            if 'highest_failure_nodes' in data and len(data['highest_failure_nodes']) > 0:
                first_failure = data['highest_failure_nodes'][0]
                required_fields = ['node_id', 'node_type', 'failure_rate', 'failures', 'executions']
                missing_fields = [f for f in required_fields if f not in first_failure]
                
                self.log_test("Highest failure nodes data has required fields",
                             len(missing_fields) == 0,
                             f"Missing fields: {missing_fields}")
        else:
            self.log_test("Node bottlenecks endpoint accessibility", False, f"Response: {data}")

    def test_user_productivity(self):
        """Test /api/analytics/users/productivity endpoint"""
        print("\n🔍 Testing User Productivity Endpoint...")
        
        success, data = self.make_request('analytics/users/productivity')
        
        if success:
            has_data = 'data' in data and isinstance(data['data'], list)
            self.log_test("User productivity endpoint returns data array", has_data)
            
            if has_data and len(data['data']) > 0:
                first_item = data['data'][0]
                required_fields = ['name', 'email', 'completed', 'total_tasks', 'pending', 'completion_rate', 'avg_completion_hours']
                missing_fields = [f for f in required_fields if f not in first_item]
                
                self.log_test("User productivity data items have required fields",
                             len(missing_fields) == 0,
                             f"Missing fields: {missing_fields}")
            else:
                self.log_test("User productivity data structure", True, "Empty data array (acceptable)")
        else:
            self.log_test("User productivity endpoint accessibility", False, f"Response: {data}")

    def test_user_workload(self):
        """Test /api/analytics/users/workload endpoint"""
        print("\n🔍 Testing User Workload Endpoint...")
        
        success, data = self.make_request('analytics/users/workload')
        
        if success:
            has_data = 'data' in data and isinstance(data['data'], list)
            self.log_test("User workload endpoint returns data array", has_data)
            
            if has_data and len(data['data']) > 0:
                first_item = data['data'][0]
                required_fields = ['name', 'email', 'pending_tasks']
                missing_fields = [f for f in required_fields if f not in first_item]
                
                self.log_test("User workload data items have required fields",
                             len(missing_fields) == 0,
                             f"Missing fields: {missing_fields}")
            else:
                self.log_test("User workload data structure", True, "Empty data array (acceptable)")
        else:
            self.log_test("User workload endpoint accessibility", False, f"Response: {data}")

    def run_all_tests(self):
        """Run all analytics API tests"""
        print("🚀 Starting LogicCanvas Phase 6 Analytics API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 70)
        
        # Test all 11 analytics endpoints
        self.test_analytics_overview()           # 1. Overview
        self.test_workflow_throughput()          # 2. Workflow throughput
        self.test_workflow_execution_time()      # 3. Workflow execution time
        self.test_workflow_success_rate()        # 4. Workflow success rate
        self.test_workflow_popularity()          # 5. Workflow popularity
        self.test_sla_compliance()               # 6. SLA compliance
        self.test_sla_trends()                   # 7. SLA trends
        self.test_node_performance()             # 8. Node performance
        self.test_node_bottlenecks()             # 9. Node bottlenecks
        self.test_user_productivity()            # 10. User productivity
        self.test_user_workload()                # 11. User workload
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Analytics API Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All analytics API tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} analytics API tests failed")
            return 1

def main():
    """Main test runner"""
    tester = AnalyticsAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())