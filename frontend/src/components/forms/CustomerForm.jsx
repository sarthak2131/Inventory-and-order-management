import { useState } from "react";

const emptyState = {
  full_name: "",
  email: "",
  phone_number: "",
};

export default function CustomerForm({ onSubmit, submitting }) {
  const [formState, setFormState] = useState(emptyState);
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const nextErrors = {};

    if (!formState.full_name.trim()) {
      nextErrors.full_name = "Full name is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formState.phone_number.trim()) {
      nextErrors.phone_number = "Phone number is required.";
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
        full_name: formState.full_name.trim(),
        email: formState.email.trim(),
        phone_number: formState.phone_number.trim(),
      });
      setFormState(emptyState);
      setErrors({});
    } catch {
      // Parent handler manages API error feedback.
    }
  }

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          placeholder="Jordan Lee"
          value={formState.full_name}
          onChange={handleChange}
        />
        {errors.full_name ? <span className="field-error">{errors.full_name}</span> : null}
      </div>

      <div className="form-row">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="jordan@example.com"
          value={formState.email}
          onChange={handleChange}
        />
        {errors.email ? <span className="field-error">{errors.email}</span> : null}
      </div>

      <div className="form-row">
        <label htmlFor="phone_number">Phone number</label>
        <input
          id="phone_number"
          name="phone_number"
          type="tel"
          placeholder="+1 555 0149"
          value={formState.phone_number}
          onChange={handleChange}
        />
        {errors.phone_number ? <span className="field-error">{errors.phone_number}</span> : null}
      </div>

      <button type="submit" className="primary-button" disabled={submitting}>
        {submitting ? "Saving..." : "Add Customer"}
      </button>
    </form>
  );
}
