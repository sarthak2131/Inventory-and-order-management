from fastapi import APIRouter

from app.api.routes.customers import router as customers_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.orders import router as orders_router
from app.api.routes.products import router as products_router

api_router = APIRouter()
api_router.include_router(dashboard_router)
api_router.include_router(products_router)
api_router.include_router(customers_router)
api_router.include_router(orders_router)
