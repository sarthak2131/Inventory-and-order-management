import { formatCurrency } from "../../utils/formatters";

export default function ProductTable({ products, onEdit, onDelete }) {
  if (!products.length) {
    return <p className="empty-state">No products match this view yet.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
            <th className="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} onClick={() => onEdit(product)}>
              <td data-label="Product" className="row-title">{product.name}</td>
              <td data-label="SKU"><span className="sku-tag">{product.sku}</span></td>
              <td data-label="Price" className="price-cell">{formatCurrency(product.price)}</td>
              <td data-label="Stock">
                <span
                  className={`pill ${
                    product.quantity_in_stock <= 5 ? "pill-amber" : "pill-teal"
                  }`}
                >
                  {product.quantity_in_stock}
                </span>
              </td>
              <td className="table-actions" data-label="Actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(product);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="ghost-button danger-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(product);
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
