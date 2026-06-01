from pydantic import BaseModel


class LowStockProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    quantity_in_stock: int


class DashboardSummaryResponse(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: list[LowStockProductResponse]
