export default function CustomerTable({ customers, onDelete }) {
  if (!customers.length) {
    return <p className="empty-state">No customers match this view yet.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th className="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td data-label="Name" className="row-title">{customer.full_name}</td>
              <td data-label="Email">{customer.email}</td>
              <td data-label="Phone">{customer.phone_number}</td>
              <td className="table-actions" data-label="Actions">
                <button
                  type="button"
                  className="ghost-button danger-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(customer);
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
