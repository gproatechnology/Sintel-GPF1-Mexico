"""Auth schemas"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum


# Login request
class LoginRequest(BaseModel):
    username: str = Field(..., json_schema_extra={"example": "admin@f1comedor.com"})
    password: str = Field(..., json_schema_extra={"example": "admin123"})


# Token response
class Token(BaseModel):
    access_token: str = Field(..., json_schema_extra={"example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."})
    token_type: str = "bearer"


# Token data (for refresh)
class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None


# Refresh token request
class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., json_schema_extra={"example": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."})
