"""Load tests for F1 Comedor

Tests system performance under load:
- API response times
- Concurrent user simulation
- Database query performance
"""
import pytest
import time
import httpx
from concurrent.futures import ThreadPoolExecutor, as_completed
from statistics import mean, median


@pytest.mark.skip(reason="Requires running server on localhost:8000")
class TestLoadPerformance:
    """Load testing for API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = httpx.post(
            "http://localhost:8000/api/auth/login",
            json={"username": "admin", "password": "admin123"},
            timeout=10.0
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    
    def test_api_health_check_performance(self):
        """Test health check endpoint response time"""
        times = []
        
        for _ in range(100):
            start = time.time()
            response = httpx.get("http://localhost:8000/health", timeout=5.0)
            elapsed = time.time() - start
            times.append(elapsed)
            assert response.status_code == 200
        
        avg_time = mean(times)
        p95_time = sorted(times)[94]
        
        print(f"\nHealth Check Performance:")
        print(f"  Average: {avg_time*1000:.2f}ms")
        print(f"  P95: {p95_time*1000:.2f}ms")
        
        assert avg_time < 0.1, f"Average response time {avg_time}s exceeds 100ms"
    
    def test_concurrent_api_requests(self, auth_token):
        """Test concurrent API requests"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        results = []
        
        def make_request(endpoint):
            start = time.time()
            try:
                response = httpx.get(
                    f"http://localhost:8000{endpoint}",
                    headers=headers,
                    timeout=10.0
                )
                return time.time() - start, response.status_code
            except Exception as e:
                return time.time() - start, str(e)
        
        # 50 concurrent requests
        endpoints = [
            "/api/companies",
            "/api/employees",
            "/api/categories",
            "/api/consumptions",
        ] * 12 + ["/api/companies"]  # 50 total
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request, ep) for ep in endpoints]
            for future in as_completed(futures):
                results.append(future.result())
        
        times = [r[0] for r in results]
        success_count = sum(1 for r in results if r[1] == 200)
        
        print(f"\nConcurrent Requests Results:")
        print(f"  Total: {len(results)}")
        print(f"  Success: {success_count}")
        print(f"  Average: {mean(times)*1000:.2f}ms")
        print(f"  Median: {median(times)*1000:.2f}ms")
        
        assert success_count >= 45, f"Only {success_count}/50 requests succeeded"
    
    def test_dashboard_stats_performance(self, auth_token):
        """Test dashboard stats endpoint performance"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        times = []
        
        for _ in range(10):
            start = time.time()
            response = httpx.get(
                "http://localhost:8000/api/reports/dashboard/stats",
                headers=headers,
                timeout=30.0
            )
            elapsed = time.time() - start
            times.append(elapsed)
            assert response.status_code == 200
        
        avg_time = mean(times)
        
        print(f"\nDashboard Stats Performance:")
        print(f"  Average: {avg_time*1000:.2f}ms")
        
        assert avg_time < 5.0, f"Dashboard stats took {avg_time}s, should be < 5s"


@pytest.mark.skip(reason="Requires running server on localhost:8000")
class TestStressTest:
    """Stress testing scenarios"""
    
    def test_sustained_load(self, auth_token):
        """Test system under sustained load"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        total_requests = 200
        success_count = 0
        error_count = 0
        
        def make_request(i):
            nonlocal success_count, error_count
            try:
                response = httpx.get(
                    "http://localhost:8000/api/companies",
                    headers=headers,
                    timeout=10.0
                )
                if response.status_code == 200:
                    success_count += 1
                else:
                    error_count += 1
            except Exception:
                error_count += 1
        
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(make_request, i) for i in range(total_requests)]
            for future in as_completed(futures):
                future.result()
        
        elapsed = time.time() - start_time
        rps = total_requests / elapsed
        
        print(f"\nSustained Load Results:")
        print(f"  Total requests: {total_requests}")
        print(f"  Success: {success_count}")
        print(f"  Errors: {error_count}")
        print(f"  Duration: {elapsed:.2f}s")
        print(f"  RPS: {rps:.2f}")
        
        assert success_count >= 180, f"Only {success_count}/{total_requests} succeeded"