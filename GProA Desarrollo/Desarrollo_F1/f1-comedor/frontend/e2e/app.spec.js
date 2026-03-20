// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('F1 Comedor - Tests E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ========== FLUJO 1: LOGIN ==========
  test('TC-001: Login exitoso con credenciales de admin', async ({ page }) => {
    // Ir a login
    await page.goto('/login');
    
    // Llenar credenciales
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    
    // Click en botón login
    await page.click('button[type="submit"]');
    
    // Verificar que redirige al dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('TC-002: Login fallido con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Verificar mensaje de error
    await expect(page.locator('text=Credenciales inválidas')).toBeVisible({ timeout: 5000 });
  });

  test('TC-003: Logout exitoso', async ({ page }) => {
    // Login primero
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Hacer logout
    await page.click('button:has-text("Cerrar Sesión")');
    
    // Verificar que redirige a login
    await expect(page).toHaveURL(/\/login/);
  });

  // ========== FLUJO 2: DASHBOARD ==========
  test('TC-010: Dashboard carga correctamente', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Verificar elementos del dashboard
    await expect(page.locator('text=Bienvenido')).toBeVisible();
    await expect(page.locator('text=Consumos de Hoy')).toBeVisible();
  });

  test('TC-011: Dashboard muestra gráficos', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Verificar que existen gráficos (recharts)
    await expect(page.locator('.recharts-wrapper')).toHaveCount(2);
  });

  // ========== FLUJO 3: ESCANEO QR ==========
  test('TC-020: Scanner carga correctamente', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Ir a scanner
    await page.click('a[href="/scanner"]');
    await expect(page).toHaveURL(/\/scanner/);
    
    // Verificar elementos del scanner
    await expect(page.locator('text=Escanear Código QR')).toBeVisible();
  });

  // ========== FLUJO 4: ADMIN (CRUD) ==========
  test('TC-030: Admin carga correctamente', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Ir a admin
    await page.click('a[href="/admin"]');
    await expect(page).toHaveURL(/\/admin/);
    
    // Verificar tabs
    await expect(page.locator('text=Empresas')).toBeVisible();
    await expect(page.locator('text=Categorías')).toBeVisible();
    await expect(page.locator('text=Empleados')).toBeVisible();
  });

  test('TC-031: Crear nueva empresa', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Ir a admin
    await page.click('a[href="/admin"]');
    
    // Click en Empresas
    await page.click('button:has-text("Empresas")');
    
    // Click en agregar
    await page.click('button:has-text("Agregar Empresa")');
    
    // Llenar formulario
    await page.fill('input[name="name"]', 'Empresa Test E2E');
    await page.fill('input[name="code"]', 'ETE-' + Date.now());
    
    // Guardar
    await page.click('button:has-text("Guardar")');
    
    // Verificar que se creó
    await expect(page.locator('text=Empresa Test E2E')).toBeVisible();
  });

  // ========== FLUJO 5: REPORTES ==========
  test('TC-040: Reportes carga correctamente', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Ir a reportes
    await page.click('a[href="/reports"]');
    await expect(page).toHaveURL(/\/reports/);
    
    // Verificar elementos
    await expect(page.locator('text=Reportes')).toBeVisible();
    await expect(page.locator('text=Exportar')).toBeVisible();
  });

  // ========== FLUJO 6: NAVEGACIÓN ==========
  test('TC-050: Navegación entre páginas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Ir a scanner
    await page.click('a[href="/scanner"]');
    await expect(page).toHaveURL(/\/scanner/);
    
    // Ir a reportes
    await page.click('a[href="/reports"]');
    await expect(page).toHaveURL(/\/reports/);
    
    // Ir a admin
    await page.click('a[href="/admin"]');
    await expect(page).toHaveURL(/\/admin/);
    
    // Volver a dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ========== FLUJO 7: ROLES ==========
  test('TC-060: Acceso según rol - Supervisor', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'supervisor');
    await page.fill('input[name="password"]', 'supervisor123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Supervisor NO debe ver admin
    const adminLink = page.locator('a[href="/admin"]');
    await expect(adminLink).not.toBeVisible();
  });

  test('TC-061: Acceso según rol - Cajero', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cajero');
    await page.fill('input[name="password"]', 'cajero123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Cajero solo ve scanner y dashboard
    await expect(page.locator('a[href="/scanner"]')).toBeVisible();
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    
    // No debe ver admin ni reportes
    await expect(page.locator('a[href="/admin"]')).not.toBeVisible();
    await expect(page.locator('a[href="/reports"]')).not.toBeVisible();
  });
});