import { useState } from "react";

import { formatCurrency } from "../../utils/formatters";

const emptyLine = {
  product_id: "",
  quantity: "1",
};

export default function OrderForm({ customers, products, onSubmit, submitting }) {
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ ...emptyLine }]);
  const [formError, setFormError] = useState("");

  const productsById = products.reduce((map, product) => {
    map[product.id] = product;
    return map;
  }, {});

  const estimatedTotal = items.reduce((sum, item) => {
    const product = productsById[Number(item.product_id)];
    const quantity = Number(item.quantity || 0);
    if (!product || quantity <= 0) {
      return sum;
    }
    return sum + Number(product.price) * quantity;
  }, 0);

  function updateLine(index, field, value) {
    setItems((current) =>
      current.map((item, lineIndex) =>
        lineIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addLine() {
    setItems((current) => [...current, { ...emptyLine }]);
  }

  function removeLine(index) {
    setItems((current) => current.filter((_, lineIndex) => lineIndex !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!customerId) {
      setFormError("Choose a customer before placing an order.");
      return;
    }

    if (!items.length) {
      setFormError("Add at least one product line.");
      return;
    }

    const seenProductIds = new Set();
    const normalizedItems = [];

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (!productId) {
        setFormError("Each line item must reference a product.");
        return;
      }

      if (seenProductIds.has(productId)) {
        setFormError("Add each product only once per order.");
        return;
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        setFormError("Quantities must be whole numbers greater than zero.");
        return;
      }

      seenProductIds.add(productId);
      normalizedItems.push({ product_id: productId, quantity });
    }

    try {
      await onSubmit({
        customer_id: Number(customerId),
        items: normalizedItems,
      });
      setCustomerId("");
      setItems([{ ...emptyLine }]);
      setFormError("");
    } catch {
      // Parent handler exposes the backend error in the shared alert.
    }
  }

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="customer_id">Customer</label>
        <select
          id="customer_id"
          name="customer_id"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
        >
          <option value="">Select a customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.full_name} ({customer.email})
            </option>
          ))}
        </select>
      </div>

      <div className="line-items-header">
        <div>
          <h3>Order Lines</h3>
          <p>Only in-stock products are enabled for new orders.</p>
        </div>
        <button type="button" className="secondary-button" onClick={addLine}>
          Add Line
        </button>
      </div>

      {items.map((item, index) => {
        const selectedProduct = productsById[Number(item.product_id)];
        return (
          <div key={`${index}-${item.product_id || "empty"}`} className="line-item-card">
            <div className="form-row">
              <label htmlFor={`product_${index}`}>Product</label>
              <select
                id={`product_${index}`}
                value={item.product_id}
                onChange={(event) => updateLine(index, "product_id", event.target.value)}
              >
                <option value="">Choose a product</option>
                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={product.quantity_in_stock <= 0 && Number(item.product_id) !== product.id}
                  >
                    {product.name} ({product.quantity_in_stock} available)
                  </option>
                ))}
              </select>
            </div>

            <div className="line-item-actions">
              <div className="form-row">
                <label htmlFor={`quantity_${index}`}>Quantity</label>
                <input
                  id={`quantity_${index}`}
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(event) => updateLine(index, "quantity", event.target.value)}
                />
              </div>

              <button
                type="button"
                className="ghost-button"
                onClick={() => removeLine(index)}
                disabled={items.length === 1}
              >
                Remove
              </button>
            </div>

            {selectedProduct ? (
              <div className="line-meta">
                <span>SKU: {selectedProduct.sku}</span>
                <span>Unit price: {formatCurrency(selectedProduct.price)}</span>
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="estimate-card">
        <p>Estimated total</p>
        <strong>{formatCurrency(estimatedTotal)}</strong>
      </div>

      {formError ? <span className="field-error">{formError}</span> : null}

      <button
        type="submit"
        className="primary-button"
        disabled={submitting || !customers.length || !products.length}
      >
        {submitting ? "Submitting..." : "Create Order"}
      </button>
    </form>
  );
}
