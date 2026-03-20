"""Tests for consumptions API endpoints"""
import pytest
from fastapi import status
from datetime import datetime, timezone
from decimal import Decimal

from app.models.consumption import Consumption, MealType
from app.models.employee import Employee
from app.models.category import Category
from app.models.company import Company


class TestConsumptionAPI:
    """Tests for consumption API endpoints"""
    
    def test_create_consumption_api(self, client, auth_headers, sample_company, sample_category):
        """Test creating consumption via API"""
        # Create employee first
        emp_response = client.post(
            "/api/employees",
            json={
                "employee_number": "EMP001",
                "first_name": "John",
                "last_name": "Doe",
                "company_id": sample_company.id,
                "category_id": sample_category.id
            },
            headers=auth_headers
        )
        employee_id = emp_response.json()["id"]
        
        # Create consumption
        response = client.post(
            "/api/consumptions",
            json={
                "employee_id": employee_id,
                "meal_type": "LUNCH",
                "items": [{"menu_item_id": 1, "name": "Pizza", "price": "25.50", "quantity": 1}],
                "total_amount": "25.50"
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["total_amount"] == "25.50"
    
    def test_list_consumptions(self, client, auth_headers, sample_company, sample_category):
        """Test listing consumptions"""
        # Create employee
        emp_response = client.post(
            "/api/employees",
            json={
                "employee_number": "EMP001",
                "first_name": "John",
                "last_name": "Doe",
                "company_id": sample_company.id,
                "category_id": sample_category.id
            },
            headers=auth_headers
        )
        employee_id = emp_response.json()["id"]
        
        # Create consumption
        client.post(
            "/api/consumptions",
            json={
                "employee_id": employee_id,
                "meal_type": "LUNCH",
                "items": [{"menu_item_id": 1, "name": "Pizza", "price": "25.50", "quantity": 1}],
                "total_amount": "25.50"
            },
            headers=auth_headers
        )
        
        # List consumptions
        response = client.get("/api/consumptions", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert "items" in response.json()
    
    def test_list_consumptions_with_filters(self, client, auth_headers, sample_company, sample_category):
        """Test listing consumptions with filters"""
        # Create employee
        emp_response = client.post(
            "/api/employees",
            json={
                "employee_number": "EMP001",
                "first_name": "John",
                "last_name": "Doe",
                "company_id": sample_company.id,
                "category_id": sample_category.id
            },
            headers=auth_headers
        )
        employee_id = emp_response.json()["id"]
        
        # Create consumption
        client.post(
            "/api/consumptions",
            json={
                "employee_id": employee_id,
                "meal_type": "LUNCH",
                "items": [{"menu_item_id": 1, "name": "Pizza", "price": "25.50", "quantity": 1}],
                "total_amount": "25.50"
            },
            headers=auth_headers
        )
        
        # Filter by employee
        response = client.get(f"/api/consumptions?employee_id={employee_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["total"] >= 1
    
    def test_get_consumption_by_id(self, client, auth_headers, sample_company, sample_category):
        """Test getting consumption by ID"""
        # Create employee
        emp_response = client.post(
            "/api/employees",
            json={
                "employee_number": "EMP001",
                "first_name": "John",
                "last_name": "Doe",
                "company_id": sample_company.id,
                "category_id": sample_category.id
            },
            headers=auth_headers
        )
        employee_id = emp_response.json()["id"]
        
        # Create consumption
        cons_response = client.post(
            "/api/consumptions",
            json={
                "employee_id": employee_id,
                "meal_type": "LUNCH",
                "items": [{"menu_item_id": 1, "name": "Pizza", "price": "25.50", "quantity": 1}],
                "total_amount": "25.50"
            },
            headers=auth_headers
        )
        consumption_id = cons_response.json()["id"]
        
        # Get consumption
        response = client.get(f"/api/consumptions/{consumption_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == consumption_id
    
    @pytest.mark.skip(reason="DELETE endpoint not implemented")
    def test_delete_consumption(self, client, auth_headers, sample_company, sample_category):
        """Test deleting consumption"""
        # Create employee
        emp_response = client.post(
            "/api/employees",
            json={
                "employee_number": "EMP001",
                "first_name": "John",
                "last_name": "Doe",
                "company_id": sample_company.id,
                "category_id": sample_category.id
            },
            headers=auth_headers
        )
        employee_id = emp_response.json()["id"]
        
        # Create consumption
        cons_response = client.post(
            "/api/consumptions",
            json={
                "employee_id": employee_id,
                "meal_type": "LUNCH",
                "items": [{"menu_item_id": 1, "name": "Pizza", "price": "25.50", "quantity": 1}],
                "total_amount": "25.50"
            },
            headers=auth_headers
        )
        consumption_id = cons_response.json()["id"]
        
        # Delete consumption
        response = client.delete(f"/api/consumptions/{consumption_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT