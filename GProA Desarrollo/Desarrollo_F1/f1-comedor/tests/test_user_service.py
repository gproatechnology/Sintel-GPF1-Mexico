"""Tests for user service"""
import pytest

from app.models.user import User, UserRole
from app.models.user_settings import UserSettings
from app.services.user_service import (
    get_users,
    get_user,
    get_user_by_username,
    get_user_by_email,
    create_user,
)


class TestGetUsers:
    """Tests for get_users function"""
    
    def test_get_users_empty(self, db_session):
        """Test getting users when database is empty"""
        items, total = get_users(db_session, skip=0, limit=10)
        assert total == 0
        assert len(items) == 0
    
    def test_get_users_with_data(self, db_session):
        """Test getting users with data"""
        user = User(
            username="testuser",
            email="test@test.com",
            hashed_password="hashed",
            role=UserRole.ADMIN,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        
        items, total = get_users(db_session, skip=0, limit=10)
        assert total == 1
        assert len(items) == 1
        assert items[0].username == "testuser"
    
    def test_get_users_pagination(self, db_session):
        """Test pagination of users"""
        for i in range(5):
            user = User(
                username=f"user{i}",
                email=f"user{i}@test.com",
                hashed_password="hashed",
                role=UserRole.EMPLOYEE,
                is_active=True
            )
            db_session.add(user)
        db_session.commit()
        
        items, total = get_users(db_session, skip=0, limit=2)
        assert total == 5
        assert len(items) == 2
    
    def test_get_users_by_role(self, db_session):
        """Test filtering users by role"""
        admin = User(username="admin", email="admin@test.com", hashed_password="hashed", role=UserRole.ADMIN, is_active=True)
        employee = User(username="employee", email="emp@test.com", hashed_password="hashed", role=UserRole.EMPLOYEE, is_active=True)
        db_session.add(admin)
        db_session.add(employee)
        db_session.commit()
        
        items, total = get_users(db_session, skip=0, limit=10, role=UserRole.ADMIN)
        assert total == 1
        assert items[0].role == UserRole.ADMIN
    
    def test_get_users_by_active_status(self, db_session):
        """Test filtering users by active status"""
        active = User(username="active", email="active@test.com", hashed_password="hashed", role=UserRole.ADMIN, is_active=True)
        inactive = User(username="inactive", email="inactive@test.com", hashed_password="hashed", role=UserRole.ADMIN, is_active=False)
        db_session.add(active)
        db_session.add(inactive)
        db_session.commit()
        
        items, total = get_users(db_session, skip=0, limit=10, is_active=True)
        assert total == 1
        assert items[0].is_active is True


class TestGetUser:
    """Tests for get_user function"""
    
    def test_get_user_exists(self, db_session):
        """Test getting user by ID when exists"""
        user = User(username="testuser", email="test@test.com", hashed_password="hashed", role=UserRole.ADMIN, is_active=True)
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        result = get_user(db_session, user.id)
        assert result is not None
        assert result.username == "testuser"
    
    def test_get_user_not_exists(self, db_session):
        """Test getting user by ID when not exists"""
        result = get_user(db_session, 999)
        assert result is None


class TestGetUserByUsername:
    """Tests for get_user_by_username function"""
    
    def test_get_user_by_username_exists(self, db_session):
        """Test getting user by username when exists"""
        user = User(username="testuser", email="test@test.com", hashed_password="hashed", role=UserRole.ADMIN, is_active=True)
        db_session.add(user)
        db_session.commit()
        
        result = get_user_by_username(db_session, "testuser")
        assert result is not None
        assert result.username == "testuser"
    
    def test_get_user_by_username_not_exists(self, db_session):
        """Test getting user by username when not exists"""
        result = get_user_by_username(db_session, "nonexistent")
        assert result is None


class TestGetUserByEmail:
    """Tests for get_user_by_email function"""
    
    def test_get_user_by_email_exists(self, db_session):
        """Test getting user by email when exists"""
        user = User(username="testuser", email="test@test.com", hashed_password="hashed", role=UserRole.ADMIN, is_active=True)
        db_session.add(user)
        db_session.commit()
        
        result = get_user_by_email(db_session, "test@test.com")
        assert result is not None
        assert result.email == "test@test.com"
    
    def test_get_user_by_email_not_exists(self, db_session):
        """Test getting user by email when not exists"""
        result = get_user_by_email(db_session, "nonexistent@test.com")
        assert result is None


class TestCreateUser:
    """Tests for create_user function"""
    
    def test_create_user_success(self, db_session):
        """Test successful user creation"""
        from app.schemas.user import UserCreate
        
        user_data = UserCreate(
            username="newuser",
            email="new@test.com",
            password="password123",
            role=UserRole.ADMIN
        )
        
        result = create_user(db_session, user_data)
        
        assert result.username == "newuser"
        assert result.email == "new@test.com"
        assert result.role == UserRole.ADMIN
        assert result.hashed_password != "password123"  # Should be hashed