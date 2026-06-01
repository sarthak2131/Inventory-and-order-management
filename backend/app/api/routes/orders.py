from collections import defaultdict
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db
from app.models import Customer, Order, OrderItem, Product
from app.schemas.order import OrderCreate, OrderItemResponse, OrderResponse

router = APIRouter(prefix="/orders", tags=["Orders"])


def serialize_order(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        customer_id=order.customer.id,
        customer_name=order.customer.full_name,
        customer_email=order.customer.email,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product.id,
                product_name=item.product.name,
                sku=item.product.sku,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total,
            )
            for item in order.items
        ],
    )


def get_order_with_relations(db: Session, order_id: int) -> Order | None:
    statement = (
        select(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .where(Order.id == order_id)
    )
    return db.execute(statement).unique().scalar_one_or_none()


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> OrderResponse:
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    quantities_by_product: dict[int, int] = defaultdict(int)
    for item in payload.items:
        quantities_by_product[item.product_id] += item.quantity

    product_ids = list(quantities_by_product.keys())
    products = db.scalars(
        select(Product)
        .where(Product.id.in_(product_ids))
        .order_by(Product.id.asc())
        .with_for_update()
    ).all()

    if len(products) != len(product_ids):
        found_product_ids = {product.id for product in products}
        missing_product_ids = sorted(set(product_ids) - found_product_ids)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Products not found: {missing_product_ids}",
        )

    products_by_id = {product.id: product for product in products}
    insufficient_stock: list[str] = []
    for product_id, quantity_requested in quantities_by_product.items():
        product = products_by_id[product_id]
        if product.quantity_in_stock < quantity_requested:
            insufficient_stock.append(
                f"{product.name} (available {product.quantity_in_stock}, requested {quantity_requested})"
            )

    if insufficient_stock:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Insufficient inventory for: " + ", ".join(insufficient_stock),
        )

    order = Order(customer_id=customer.id, total_amount=Decimal("0.00"))
    db.add(order)
    db.flush()

    running_total = Decimal("0.00")
    for product_id, quantity_requested in quantities_by_product.items():
        product = products_by_id[product_id]
        line_total = product.price * quantity_requested
        product.quantity_in_stock -= quantity_requested
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity_requested,
            unit_price=product.price,
            line_total=line_total,
        )
        db.add(order_item)
        running_total += line_total

    order.total_amount = running_total
    db.add(order)
    db.commit()

    order_with_relations = get_order_with_relations(db, order.id)
    if not order_with_relations:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Order was created but could not be reloaded.",
        )

    return serialize_order(order_with_relations)


@router.get("", response_model=list[OrderResponse])
def list_orders(db: Session = Depends(get_db)) -> list[OrderResponse]:
    statement = select(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product),
    ).order_by(Order.created_at.desc())
    orders = db.execute(statement).unique().scalars().all()
    return [serialize_order(order) for order in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)) -> OrderResponse:
    order = get_order_with_relations(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return serialize_order(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)) -> Response:
    order = get_order_with_relations(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    for item in order.items:
        item.product.quantity_in_stock += item.quantity

    db.delete(order)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
