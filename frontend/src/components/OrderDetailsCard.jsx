import { formatCurrency, formatDate } from "../utils/formatters";

export default function OrderDetailsCard({ order, loading }) {
  if (loading) {
    return (
      <div className="panel order-details-panel">
        <div className="panel-header">
          <div>
            <h2>Order Details</h2>
            <p>Loading order information.</p>
          </div>
        </div>
        <div className="detail-skeleton-grid" aria-hidden="true">
          <div className="detail-skeleton-card">
            <span className="skeleton-line short" />
            <span className="skeleton-line medium" />
            <span className="skeleton-line short" />
          </div>
          <div className="detail-skeleton-card">
            <span className="skeleton-line short" />
            <span className="skeleton-line medium" />
            <span className="skeleton-line short" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="panel order-details-panel">
        <div className="panel-header">
          <div>
            <h2>Order Details</h2>
            <p>Select an order to inspect its line items and customer details.</p>
          </div>
        </div>
        <div className="empty-state-card">
          <strong>No order selected</strong>
          <span>Pick any order from the ledger to review customer, item, and amount details.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel order-details-panel">
      <div className="panel-header">
        <div>
          <h2>Order #{order.id}</h2>
          <p>
            Placed by {order.customer_name} on {formatDate(order.created_at)}
          </p>
        </div>
        <span className="pill pill-teal">{formatCurrency(order.total_amount)}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Customer</h3>
          <p>{order.customer_name}</p>
          <span>{order.customer_email}</span>
        </div>
        <div className="detail-card">
          <h3>Line Items</h3>
          <p>{order.items.length} product entries</p>
          <span>
            {order.items.reduce((sum, item) => sum + Number(item.quantity), 0)} units
          </span>
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td data-label="Product">{item.product_name}</td>
                <td data-label="SKU">{item.sku}</td>
                <td data-label="Qty">{item.quantity}</td>
                <td data-label="Unit Price">{formatCurrency(item.unit_price)}</td>
                <td data-label="Line Total">{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
