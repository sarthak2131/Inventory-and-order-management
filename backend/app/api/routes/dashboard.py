from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Customer, Order, Product
from app.schemas.dashboard import DashboardSummaryResponse, LowStockProductResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    low_stock_threshold: int = Query(default=5, ge=1, le=100),
    db: Session = Depends(get_db),
) -> DashboardSummaryResponse:
    total_products = db.scalar(select(func.count(Product.id))) or 0
    total_customers = db.scalar(select(func.count(Customer.id))) or 0
    total_orders = db.scalar(select(func.count(Order.id))) or 0

    low_stock_products = db.scalars(
        select(Product)
        .where(Product.quantity_in_stock <= low_stock_threshold)
        .order_by(Product.quantity_in_stock.asc(), Product.name.asc())
    ).all()

    return DashboardSummaryResponse(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=[
            LowStockProductResponse(
                id=product.id,
                name=product.name,
                sku=product.sku,
                quantity_in_stock=product.quantity_in_stock,
            )
            for product in low_stock_products
        ],
    )
