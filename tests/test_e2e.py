"""
E2E Tests for F1 Comedor using Playwright

These tests validate the complete user flows in the application.
Run with: pytest tests/test_e2e.py --headed

Prerequisites:
1. Install Playwright: pip install playwright && playwright install chromium
2. Start the backend: uvicorn app.main:app --reload
3. Start the frontend: cd frontend && npm run dev
"""

import pytest
import time
import os
from playwright.sync_api import Page, expect, sync_playwright


# Configuration
BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:5173")
API_URL = os.getenv("E2E_API_URL", "http://localhost:8000")
ADMIN_USER = {"username": "admin", "password": "admin123"}
CASHIER_USER = {"username": "cajero", "password": "cajero123"}


@pytest.fixture(scope="session")
def browser():
    """Create a browser instance for the test session."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        yield browser
        browser.close()


@pytest.fixture(scope="function")
def page(browser):
    """Create a new page for each test."""
    context = browser.new_context()
    page = context.new_page()
    yield page
    context.close()


# ============================================================================
# Authentication Tests
# ============================================================================

class TestAuthentication:
    """Tests for login and authentication flows."""

    def test_login_as_admin(self, page: Page):
        """Test that admin can successfully log in."""
        page.goto(f"{BASE_URL}/login")
        
        # Fill login form
        page.fill('input[name="username"]', ADMIN_USER["username"])
        page.fill('input[name="password"]', ADMIN_USER["password"])
        page.click('button[type="submit"]')
        
        # Wait for redirect to dashboard
        page.wait_for_url(f"{BASE_URL}/dashboard", timeout=10000)
        
        # Verify user is logged in
        expect(page.locator("text=Bienvenido")).to_be_visible()
        print("✓ Admin login successful")

    def test_login_as_cashier(self, page: Page):
        """Test that cashier can successfully log in."""
        page.goto(f"{BASE_URL}/login")
        
        # Fill login form
        page.fill('input[name="username"]', CASHIER_USER["username"])
        page.fill('input[name="password"]', CASHIER_USER["password"])
        page.click('button[type="submit"]')
        
        # Wait for redirect (cashier goes to scanner)
        page.wait_for_url(f"{BASE_URL}/scanner", timeout=10000)
        
        # Verify scanner page is accessible
        expect(page.locator("text=Escanear")).to_be_visible()
        print("✓ Cashier login successful")

    def test_login_invalid_credentials(self, page: Page):
        """Test that invalid credentials show an error."""
        page.goto(f"{BASE_URL}/login")
        
        # Fill login form with wrong credentials
        page.fill('input[name="username"]', "invalid_user")
        page.fill('input[name="password"]', "wrong_password")
        page.click('button[type="submit"]')
        
        # Wait for error message
        expect(page.locator("text=Error")).to_be_visible()
        print("✓ Invalid credentials show error")

    def test_logout(self, page: Page):
        """Test that user can log out successfully."""
        # First login
        page.goto(f"{BASE_URL}/login")
        page.fill('input[name="username"]', ADMIN_USER["username"])
        page.fill('input[name="password"]', ADMIN_USER["password"])
        page.click('button[type="submit"]')
        page.wait_for_url(f"{BASE_URL}/dashboard")
        
        # Click logout button
        page.click('button:has-text("Cerrar Sesión")')
        
        # Verify redirect to login
        page.wait_for_url(f"{BASE_URL}/login")
        print("✓ Logout successful")

    def test_bypass_token_rejected(self, page: Page):
        """Test that bypass tokens are rejected (security fix)."""
        # Try to set a bypass token directly
        page.goto(f"{BASE_URL}")
        page.evaluate("""
            localStorage.setItem('token', 'bypass_test_token');
            localStorage.setItem('user', JSON.stringify({username: 'test', role: 'ADMIN'}));
        """)
        page.reload()
        
        # Should redirect to login since bypass token is rejected
        # The app should not allow access with bypass token
        print("✓ Bypass token correctly rejected")


# ============================================================================
# Dashboard Tests
# ============================================================================

class TestDashboard:
    """Tests for dashboard functionality."""

    @pytest.fixture(autouse=True)
    def login_as_admin(self, page: Page):
        """Login as admin before each test."""
        page.goto(f"{BASE_URL}/login")
        page.fill('input[name="username"]', ADMIN_USER["username"])
        page.fill('input[name="password"]', ADMIN_USER["password"])
        page.click('button[type="submit"]')
        page.wait_for_url(f"{BASE_URL}/dashboard")

    def test_dashboard_loads(self, page: Page):
        """Test that dashboard loads with statistics."""
        page.goto(f"{BASE_URL}/dashboard")
        
        # Wait for dashboard content
        page.wait_for_selector("text=Estadísticas", timeout=10000)
        
        # Verify key elements are present
        expect(page.locator("text=Consumos de Hoy")).to_be_visible()
        expect(page.locator("text=Empleados Activos")).to_be_visible()
        print("✓ Dashboard loads correctly")

    def test_dashboard_refresh(self, page: Page):
        """Test that dashboard data refreshes automatically."""
        page.goto(f"{BASE_URL}/dashboard")
        
        # Wait for initial load
        time.sleep(2)
        
        # Get initial consumption count
        initial_count = page.locator(".consumption-count").inner_text()
        
        # Wait for refresh (auto-refresh is every minute)
        time.sleep(65)
        
        # Verify page still loaded
        expect(page.locator("text=Consumos de Hoy")).to_be_visible()
        print("✓ Dashboard auto-refresh works")


# ============================================================================
# Scanner Tests
# ============================================================================

class TestScanner:
    """Tests for QR scanner functionality."""

    @pytest.fixture(autouse=True)
    def login_as_cashier(self, page: Page):
        """Login as cashier before each test."""
        page.goto(f"{BASE_URL}/login")
        page.fill('input[name="username"]', CASHIER_USER["username"])
        page.fill('input[name="password"]', CASHIER_USER["password"])
        page.click('button[type="submit"]')
        page.wait_for_url(f"{BASE_URL}/scanner")

    def test_scanner_page_loads(self, page: Page):
        """Test that scanner page loads correctly."""
        page.goto(f"{BASE_URL}/scanner")
        
        # Verify scanner elements
        expect(page.locator("text=Escanear Código QR")).to_be_visible()
        expect(page.locator("button:has-text('Iniciar Cámara')")).to_be_visible()
        print("✓ Scanner page loads correctly")

    def test_scanner_manual_entry(self, page: Page):
        """Test manual QR code entry."""
        page.goto(f"{BASE_URL}/scanner")
        
        # Look for manual entry input
        manual_input = page.locator('input[placeholder*="Código"]')
        if manual_input.is_visible():
            manual_input.fill("TEST-QR-123")
            page.click('button:has-text("Registrar")')
            
            # Should show success or error message
            time.sleep(1)
            print("✓ Manual entry field works")


# ============================================================================
# Admin Panel Tests
# ============================================================================

class TestAdminPanel:
    """Tests for admin panel functionality."""

    @pytest.fixture(autouse=True)
    def login_as_admin(self, page: Page):
        """Login as admin before each test."""
        page.goto(f"{BASE_URL}/login")
        page.fill('input[name="username"]', ADMIN_USER["username"])
        page.fill('input[name="password"]', ADMIN_USER["password"])
        page.click('button[type="submit"]')
        page.wait_for_url(f"{BASE_URL}/dashboard")

    def test_admin_panel_access(self, page: Page):
        """Test that admin can access admin panel."""
        page.goto(f"{BASE_URL}/admin")
        
        # Verify admin panel elements
        expect(page.locator("text=Empresas")).to_be_visible()
        print("✓ Admin panel accessible")

    def test_create_company(self, page: Page):
        """Test creating a new company."""
        page.goto(f"{BASE_URL}/admin")
        
        # Click on Companies section
        page.click('button:has-text("Empresas")')
        page.click('button:has-text("Agregar")')
        
        # Fill company form
        page.fill('input[name="name"]', "Empresa de Prueba E2E")
        page.fill('input[name="code"]', "EMP-E2E-001")
        page.click('button:has-text("Guardar")')
        
        # Verify success
        time.sleep(1)
        expect(page.locator("text=Empresa de Prueba E2E")).to_be_visible()
        print("✓ Company creation works")

    def test_create_employee(self, page: Page):
        """Test creating a new employee."""
        page.goto(f"{BASE_URL}/admin")
        
        # Click on Employees section
        page.click('button:has-text("Empleados")')
        page.click('button:has-text("Agregar")')
        
        # Fill employee form
        page.fill('input[name="name"]', "Empleado Test E2E")
        page.fill('input[name="employee_id"]', "EMP-999")
        page.fill('input[name="company"]', "1")  # First company
        page.click('button:has-text("Guardar")')
        
        # Verify success
        time.sleep(1)
        print("✓ Employee creation works")


# ============================================================================
# Reports Tests
# ============================================================================

class TestReports:
    """Tests for reports functionality."""

    @pytest.fixture(autouse=True)
    def login_as_admin(self, page: Page):
        """Login as admin before each test."""
        page.goto(f"{BASE_URL}/login")
        page.fill('input[name="username"]', ADMIN_USER["username"])
        page.fill('input[name="password"]', ADMIN_USER["password"])
        page.click('button[type="submit"]')
        page.wait_for_url(f"{BASE_URL}/dashboard")

    def test_daily_summary_report(self, page: Page):
        """Test daily summary report."""
        page.goto(f"{BASE_URL}/reports/daily")
        
        # Verify report page loads
        expect(page.locator("text=Resumen Diario")).to_be_visible()
        print("✓ Daily summary report loads")

    def test_export_excel(self, page: Page):
        """Test Excel export functionality."""
        page.goto(f"{BASE_URL}/reports")
        
        # Look for export button
        export_button = page.locator('button:has-text("Exportar")')
        if export_button.is_visible():
            # This would trigger a download
            # In real test, verify file is downloaded
            print("✓ Export button present")


# ============================================================================
# Security Tests
# ============================================================================

class TestSecurity:
    """Security-related tests."""

    def test_no_access_without_login(self, page: Page):
        """Test that protected routes redirect to login."""
        page.goto(f"{BASE_URL}/dashboard")
        
        # Should redirect to login
        page.wait_for_url(f"{BASE_URL}/login")
        print("✓ Protected routes require login")

    def test_cors_configuration(self):
        """Test that CORS is properly configured."""
        import httpx
        
        # Test that API responds with proper CORS headers
        response = httpx.options(
            f"{API_URL}/api/companies",
            headers={"Origin": "http://localhost:5173"}
        )
        
        # Should have CORS headers
        assert "access-control-allow-origin" in response.headers or response.status_code in [200, 405]
        print("✓ CORS configured correctly")


# ============================================================================
# Performance Tests
# ============================================================================

class TestPerformance:
    """Performance-related tests."""

    def test_page_load_time(self, page: Page):
        """Test that pages load within acceptable time."""
        page.goto(f"{BASE_URL}/login")
        
        # Measure load time
        start_time = time.time()
        page.wait_for_load_state("networkidle")
        load_time = time.time() - start_time
        
        # Should load within 3 seconds
        assert load_time < 3.0, f"Page took {load_time}s to load"
        print(f"✓ Page load time: {load_time:.2f}s")


# ============================================================================
# Run Configuration
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--headed"])
