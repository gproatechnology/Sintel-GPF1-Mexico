"""User Settings API endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any

from app.db.base import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.user_settings import UserSettings

router = APIRouter(prefix="/settings", tags=["Settings"])


# Schemas
class UserSettingsResponse(BaseModel):
    id: int
    user_id: int
    dashboard_layout: Dict[str, Any]
    scanner_settings: Dict[str, Any]
    report_settings: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class UserSettingsUpdate(BaseModel):
    dashboard_layout: Optional[Dict[str, Any]] = None
    scanner_settings: Optional[Dict[str, Any]] = None
    report_settings: Optional[Dict[str, Any]] = None


@router.get("", response_model=UserSettingsResponse)
def get_user_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's settings"""
    settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings


@router.put("", response_model=UserSettingsResponse)
def update_user_settings(
    settings_update: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user's settings"""
    settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create new settings
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
    
    # Update only provided fields
    if settings_update.dashboard_layout is not None:
        settings.dashboard_layout = settings_update.dashboard_layout
    if settings_update.scanner_settings is not None:
        settings.scanner_settings = settings_update.scanner_settings
    if settings_update.report_settings is not None:
        settings.report_settings = settings_update.report_settings
    
    db.commit()
    db.refresh(settings)
    
    return settings


@router.patch("/dashboard/layout", response_model=UserSettingsResponse)
def update_dashboard_layout(
    layout: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update only dashboard layout"""
    settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
    
    settings.dashboard_layout = layout
    db.commit()
    db.refresh(settings)
    
    return settings