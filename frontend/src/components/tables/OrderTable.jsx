import { formatCurrency, formatDate } from "../../utils/formatters";

export default function OrderTable({ orders, onInspect, onDelete, selectedOrderId }) {
  if (!orders.length) {
    return <p className="empty-state">No orders match this view yet.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Created</th>
            <th className="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className={selectedOrderId === order.id ? "active-row" : ""}
              onClick={() => onInspect(order.id)}
            >
              <td data-label="Order"><span className="sku-tag">#{order.id}</span></td>
              <td className="cell-nowrap row-title" data-label="Customer">
                {order.customer_name}
              </td>
              <td data-label="Items">{order.items.length}</td>
              <td data-label="Total" className="price-cell">{formatCurrency(order.total_amount)}</td>
              <td className="cell-nowrap" data-label="Created">
                {formatDate(order.created_at)}
              </td>
              <td className="table-actions" data-label="Actions">
                <button
                  type="button"
                  className="ghost-button danger-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(order);
                  }}
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
