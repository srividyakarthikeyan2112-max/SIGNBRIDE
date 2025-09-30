import requests
import sys
import json
from datetime import datetime

class SignBridgeAPITester:
    def __init__(self, base_url="https://signify-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=10):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_time": response.elapsed.total_seconds(),
                "error": None
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    result["response_data"] = response_data
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    result["response_data"] = response.text[:200]
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                result["error"] = response.text[:200]

            self.test_results.append(result)
            return success, response.json() if success and response.text else {}

        except requests.exceptions.Timeout:
            error_msg = f"Request timeout after {timeout}s"
            print(f"❌ Failed - {error_msg}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "TIMEOUT",
                "success": False,
                "error": error_msg
            }
            self.test_results.append(result)
            return False, {}
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Failed - Error: {error_msg}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": error_msg
            }
            self.test_results.append(result)
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_supported_signs(self):
        """Test supported signs endpoint"""
        return self.run_test("Supported Signs", "GET", "supported-signs", 200)

    def test_sign_prediction(self):
        """Test sign prediction endpoint with mock landmarks"""
        # Generate mock hand landmarks (21 points with x, y, z coordinates)
        mock_landmarks = []
        for i in range(21):
            mock_landmarks.append([
                0.5 + (i * 0.01),  # x: 0.5-0.7
                0.5 + (i * 0.01),  # y: 0.5-0.7
                0.0                # z: 0.0
            ])
        
        data = {
            "landmarks": mock_landmarks,
            "handedness": "Right"
        }
        
        return self.run_test("Sign Prediction", "POST", "predict", 200, data)

    def test_text_to_sign(self):
        """Test text to sign conversion"""
        test_cases = [
            {"text": "hello", "description": "Supported phrase"},
            {"text": "thank you", "description": "Supported phrase"},
            {"text": "unsupported phrase", "description": "Unsupported phrase"}
        ]
        
        results = []
        for case in test_cases:
            data = {"text": case["text"]}
            success, response = self.run_test(
                f"Text to Sign - {case['description']}", 
                "POST", 
                "text-to-sign", 
                200, 
                data
            )
            results.append((success, response))
        
        return results

    def test_conversations_crud(self):
        """Test conversation CRUD operations"""
        # First, get conversations
        success1, _ = self.run_test("Get Conversations", "GET", "conversations", 200)
        
        # Clear conversations
        success2, _ = self.run_test("Clear Conversations", "DELETE", "conversations", 200)
        
        return success1 and success2

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting SignBridge API Tests")
        print("=" * 50)
        
        # Test basic endpoints
        self.test_health_check()
        self.test_root_endpoint()
        self.test_supported_signs()
        
        # Test core functionality
        self.test_sign_prediction()
        self.test_text_to_sign()
        self.test_conversations_crud()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test_name']}: {test.get('error', 'Status mismatch')}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = SignBridgeAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "summary": {
                    "tests_run": tester.tests_run,
                    "tests_passed": tester.tests_passed,
                    "success_rate": (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0
                },
                "test_results": tester.test_results
            }, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())