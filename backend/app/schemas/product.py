from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator


MoneyValue = Annotated[Decimal, Field(max_digits=10, decimal_places=2, ge=0)]


class ProductBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=100)
    price: MoneyValue
    quantity_in_stock: int = Field(ge=0)

    @field_validator("name", "sku")
    @classmethod
    def reject_blank_strings(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Field cannot be blank.")
        return value


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=255)
    sku: str | None = Field(default=None, min_length=1, max_length=100)
    price: MoneyValue | None = None
    quantity_in_stock: int | None = Field(default=None, ge=0)

    @field_validator("name", "sku")
    @classmethod
    def reject_blank_optional_strings(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Field cannot be blank.")
        return value


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True, json_encoders={Decimal: float})

    id: int
    created_at: datetime
    updated_at: datetime
