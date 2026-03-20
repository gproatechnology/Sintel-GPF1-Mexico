"""Add new admin user"""
import os
import sys
sys.path.insert(0, '/app')

from app.db.base import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()
try:
    # Check if user exists
    existing = db.query(User).filter(
        (User.email == 'admin@gpproatechnology.com') | 
        (User.username == 'admin@gpproatechnology.com')
    ).first()
    
    if existing:
        print('Usuario ya existe')
    else:
        user = User(
            username='admin@gpproatechnology.com',
            email='admin@gpproatechnology.com',
            hashed_password=get_password_hash('Florida7'),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(user)
        db.commit()
        print('Usuario creado: admin@gpproatechnology.com / Florida7')
except Exception as e:
    db.rollback()
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
finally:
    db.close()