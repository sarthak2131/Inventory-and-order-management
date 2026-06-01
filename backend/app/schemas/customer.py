from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CustomerCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone_number: str = Field(min_length=7, max_length=50)

    @field_validator("full_name", "phone_number")
    @classmethod
    def reject_blank_strings(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Field cannot be blank.")
        return value


class CustomerResponse(CustomerCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
