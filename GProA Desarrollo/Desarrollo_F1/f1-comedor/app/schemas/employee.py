"""Employee schemas"""
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from typing import Optional


# Employee schemas
class EmployeeBase(BaseModel):
    employee_number: str = Field(..., json_schema_extra={"example": "EMP001"})
    first_name: str = Field(..., json_schema_extra={"example": "Juan"})
    last_name: str = Field(..., json_schema_extra={"example": "Pérez"})
    company_id: int = Field(..., json_schema_extra={"example": 1})
    category_id: int = Field(..., json_schema_extra={"example": 1})
    email: Optional[EmailStr] = Field(None, json_schema_extra={"example": "juan.perez@empresa.com"})
    phone: Optional[str] = Field(None, json_schema_extra={"example": "+52 55 1234 5678"})


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    employee_number: Optional[str] = Field(None, json_schema_extra={"example": "EMP001"})
    first_name: Optional[str] = Field(None, json_schema_extra={"example": "Juan"})
    last_name: Optional[str] = Field(None, json_schema_extra={"example": "Pérez"})
    company_id: Optional[int] = Field(None, json_schema_extra={"example": 1})
    category_id: Optional[int] = Field(None, json_schema_extra={"example": 1})
    email: Optional[EmailStr] = Field(None, json_schema_extra={"example": "juan.perez@empresa.com"})
    phone: Optional[str] = Field(None, json_schema_extra={"example": "+52 55 1234 5678"})
    is_active: Optional[bool] = Field(None, json_schema_extra={"example": True})


class EmployeeResponse(EmployeeBase):
    id: int = Field(..., json_schema_extra={"example": 1})
    qr_code: str = Field(..., json_schema_extra={"example": "QR_EMP001_2024"})
    is_active: bool = Field(..., json_schema_extra={"example": True})
    created_at: datetime = Field(..., json_schema_extra={"example": "2024-01-15T10:30:00"})

    model_config = ConfigDict(from_attributes=True)


# Employee with relations
class EmployeeWithDetailsResponse(EmployeeResponse):
    company_name: Optional[str] = None
    category_name: Optional[str] = None
    daily_limit: Optional[int] = None
    credit_limit: Optional[float] = None


# Employee scan response
class EmployeeScanResponse(BaseModel):
    id: int
    employee_number: str
    first_name: str
    last_name: str
    company_id: int
    company_name: str
    category_id: int
    category_name: str
    daily_limit: int
    credit_limit: Optional[float]
    is_active: bool
    consumptions_today: int
    total_spent_today: float
    can_consume: bool
    message: Optional[str] = None


# Employee list response
class EmployeeListResponse(BaseModel):
    total: int
    items: list[EmployeeResponse]


# Employee scan request
class EmployeeScanRequest(BaseModel):
    qr_code: str
