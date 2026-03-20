"""User Settings Model"""
from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class UserSettings(Base):
    """User-specific dashboard settings"""
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Dashboard configuration
    dashboard_layout = Column(JSON, default=lambda: {
        "widgets": [
            {"id": "stats", "visible": True, "order": 1},
            {"id": "consumptions_chart", "visible": True, "order": 2},
            {"id": "company_chart", "visible": True, "order": 3},
            {"id": "category_chart", "visible": True, "order": 4},
            {"id": "recent_consumptions", "visible": True, "order": 5}
        ],
        "refresh_interval": 60,
        "theme": "light"
    })
    
    # Scanner preferences
    scanner_settings = Column(JSON, default=lambda: {
        "sound_enabled": True,
        "vibration_enabled": True,
        "auto_submit": False
    })
    
    # Report preferences
    report_settings = Column(JSON, default=lambda: {
        "default_date_range": 7,
        "default_format": "excel"
    })

    # User relationship
    user = relationship("User", back_populates="settings")

    def __repr__(self):
        return f"<UserSettings user_id={self.user_id}>"