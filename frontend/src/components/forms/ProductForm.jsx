import { useEffect, useState } from "react";

const emptyState = {
  name: "",
  sku: "",
  price: "",
  quantity_in_stock: "0",
};

export default function ProductForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [formState, setFormState] = useState(emptyState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setFormState({
        name: initialValues.name,
        sku: initialValues.sku,
        price: String(initialValues.price),
        quantity_in_stock: String(initialValues.quantity_in_stock),
      });
    } else {
      setFormState(emptyState);
    }
    setErrors({});
  }, [initialValues]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const nextErrors = {};

    if (!formState.name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    if (!formState.sku.trim()) {
      nextErrors.sku = "SKU is required.";
    }

    if (formState.price === "" || Number(formState.price) < 0) {
      nextErrors.price = "Price must be zero or greater.";
    }

    if (formState.quantity_in_stock === "" || Number(formState.quantity_in_stock) < 0) {
      nextErrors.quantity_in_stock = "Stock must be zero or greater.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        name: formState.name.trim(),
        sku: formState.sku.trim(),
        price: Number(formState.price),
        quantity_in_stock: Number(formState.quantity_in_stock),
      });

      if (!initialValues) {
        setFormState(emptyState);
      }
    } catch {
      // Parent handler surfaces the backend error through the shared alert.
    }
  }

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="name">Product name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Warehouse Monitor"
          value={formState.name}
          onChange={handleChange}
        />
        {errors.name ? <span className="field-error">{errors.name}</span> : null}
      </div>

      <div className="two-column-inputs">
        <div className="form-row">
          <label htmlFor="sku">SKU</label>
          <input
            id="sku"
            name="sku"
            type="text"
            placeholder="MON-1001"
            value={formState.sku}
            onChange={handleChange}
          />
          {errors.sku ? <span className="field-error">{errors.sku}</span> : null}
        </div>

        <div className="form-row">
          <label htmlFor="price">Price</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="299.99"
            value={formState.price}
            onChange={handleChange}
          />
          {errors.price ? <span className="field-error">{errors.price}</span> : null}
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="quantity_in_stock">Quantity in stock</label>
        <input
          id="quantity_in_stock"
          name="quantity_in_stock"
          type="number"
          min="0"
          step="1"
          value={formState.quantity_in_stock}
          onChange={handleChange}
        />
        {errors.quantity_in_stock ? (
          <span className="field-error">{errors.quantity_in_stock}</span>
        ) : null}
      </div>

      <div className="button-row">
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? "Saving..." : initialValues ? "Update Product" : "Add Product"}
        </button>
        {initialValues ? (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel Edit
          </button>
        ) : null}
      </div>
    </form>
  );
}
