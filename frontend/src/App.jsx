import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import toast from "react-hot-toast";

import {
  createCustomer,
  createOrder,
  createProduct,
  deleteCustomer,
  deleteOrder,
  deleteProduct,
  fetchCustomers,
  fetchDashboardSummary,
  fetchOrderById,
  fetchOrders,
  fetchProducts,
  updateProduct,
} from "./api/client";
import OrderDetailsCard from "./components/OrderDetailsCard";
import SummaryCard from "./components/SummaryCard";
import CustomerForm from "./components/forms/CustomerForm";
import OrderForm from "./components/forms/OrderForm";
import ProductForm from "./components/forms/ProductForm";
import CustomerTable from "./components/tables/CustomerTable";
import OrderTable from "./components/tables/OrderTable";
import ProductTable from "./components/tables/ProductTable";
import { formatCurrency } from "./utils/formatters";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Home", kicker: "Overview" },
  { id: "products", label: "Products", shortLabel: "Products", kicker: "Catalog and inventory" },
  { id: "customers", label: "Customers", shortLabel: "Clients", kicker: "Buyer records" },
  { id: "orders", label: "Orders", shortLabel: "Orders", kicker: "Order management" },
];

const emptyDashboard = {
  total_products: 0,
  total_customers: 0,
  total_orders: 0,
  low_stock_products: [],
};

function filterProducts(products, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return products;
  }

  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(normalized) ||
      product.sku.toLowerCase().includes(normalized),
  );
}

function filterCustomers(customers, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return customers;
  }

  return customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(normalized) ||
      customer.email.toLowerCase().includes(normalized) ||
      customer.phone_number.toLowerCase().includes(normalized),
  );
}

function filterOrders(orders, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return orders;
  }

  return orders.filter(
    (order) =>
      String(order.id).includes(normalized) ||
      order.customer_name.toLowerCase().includes(normalized) ||
      order.customer_email.toLowerCase().includes(normalized),
  );
}

function LoadingSkeleton() {
  return (
    <section className="skeleton-dashboard" aria-hidden="true">
      <div className="skeleton-row">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton-card skeleton-metric">
            <span className="skeleton-line short" />
            <span className="skeleton-line large" />
            <span className="skeleton-line medium" />
          </div>
        ))}
      </div>

      <div className="skeleton-layout">
        <div className="skeleton-card skeleton-panel">
          <span className="skeleton-line short" />
          <span className="skeleton-line medium" />
          <div className="skeleton-list">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="skeleton-card skeleton-panel">
          <span className="skeleton-line short" />
          <span className="skeleton-line medium" />
          <div className="skeleton-list">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [pageError, setPageError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [customerSubmitting, setCustomerSubmitting] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const lowStockSignatureRef = useRef("");
  const readyToastShownRef = useRef(false);

  const deferredProductQuery = useDeferredValue(productQuery);
  const deferredCustomerQuery = useDeferredValue(customerQuery);
  const deferredOrderQuery = useDeferredValue(orderQuery);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  function requestConfirmation({ title, message, onConfirm }) {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  }

  function notifySuccess(message) {
    toast.success(message);
  }

  function notifyError(message) {
    toast.error(message);
  }

  function notifyInfo(message) {
    toast(message, {
      icon: "🔔",
    });
  }

  function showLowStockToast(lowStockProducts) {
    toast.custom(
      (toastInstance) => (
        <div className="inventory-toast">
          <div className="inventory-toast-head">
            <div className="inventory-toast-icon">!</div>
            <div>
              <strong>Low stock detected</strong>
              <p>
                {lowStockProducts.length} product
                {lowStockProducts.length > 1 ? "s are" : " is"} below the safe level.
              </p>
            </div>
          </div>

          <div className="inventory-toast-list">
            {lowStockProducts.slice(0, 3).map((product) => (
              <div key={product.id} className="inventory-toast-item">
                <span>{product.name}</span>
                <strong>{product.quantity_in_stock} left</strong>
              </div>
            ))}
          </div>

          <div className="inventory-toast-actions">
            <button
              type="button"
              className="toast-button toast-button-primary"
              onClick={() => {
                handleNavigate("products");
                toast.dismiss(toastInstance.id);
              }}
            >
              Review products
            </button>
            <button
              type="button"
              className="toast-button toast-button-secondary"
              onClick={() => toast.dismiss(toastInstance.id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ),
      {
        id: "low-stock-alert",
        duration: 5200,
      },
    );
  }

  async function refreshData({ keepSelection = true, selectedOrderId = null } = {}) {
    setPageError("");
    setRefreshing(true);

    try {
      const currentSelectedOrderId = keepSelection ? selectedOrderId ?? selectedOrder?.id : null;
      const [summaryPayload, productsPayload, customersPayload, ordersPayload, selectedOrderPayload] =
        await Promise.all([
          fetchDashboardSummary(),
          fetchProducts(),
          fetchCustomers(),
          fetchOrders(),
          currentSelectedOrderId
            ? fetchOrderById(currentSelectedOrderId).catch(() => null)
            : Promise.resolve(null),
        ]);

      startTransition(() => {
        setDashboard(summaryPayload);
        setProducts(productsPayload);
        setCustomers(customersPayload);
        setOrders(ordersPayload);
        setSelectedOrder(selectedOrderPayload);
      });
    } catch (error) {
      const message = error.message || "Unable to load dashboard data.";
      setPageError(message);
      notifyError(message);
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function handleNavigate(sectionId) {
    setActiveSection(sectionId);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (initialLoading) {
      return;
    }

    if (!readyToastShownRef.current) {
      readyToastShownRef.current = true;
      if (dashboard.low_stock_products.length) {
        notifyInfo("Notifications are active. Low-stock products need attention.");
      } else {
        notifyInfo("Notifications are active. Add or update data to see live alerts.");
      }
    }

    const signature = dashboard.low_stock_products
      .map((product) => `${product.id}:${product.quantity_in_stock}`)
      .join("|");

    if (!signature) {
      lowStockSignatureRef.current = "";
      toast.dismiss("low-stock-alert");
      return;
    }

    if (lowStockSignatureRef.current === signature) {
      return;
    }

    lowStockSignatureRef.current = signature;
    showLowStockToast(dashboard.low_stock_products);
  }, [dashboard.low_stock_products, initialLoading]);

  async function handleProductSubmit(payload) {
    setProductSubmitting(true);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        notifySuccess("Product updated successfully.");
      } else {
        await createProduct(payload);
        notifySuccess("Product added successfully.");
      }

      setEditingProduct(null);
      await refreshData();
    } catch (error) {
      notifyError(error.message || "Unable to save product.");
      throw error;
    } finally {
      setProductSubmitting(false);
    }
  }

  async function handleCustomerSubmit(payload) {
    setCustomerSubmitting(true);

    try {
      await createCustomer(payload);
      notifySuccess("Customer added successfully.");
      await refreshData();
    } catch (error) {
      notifyError(error.message || "Unable to save customer.");
      throw error;
    } finally {
      setCustomerSubmitting(false);
    }
  }

  async function handleOrderSubmit(payload) {
    setOrderSubmitting(true);

    try {
      const createdOrder = await createOrder(payload);
      setSelectedOrder(createdOrder);
      setActiveSection("orders");
      notifySuccess("Order created and inventory updated.");
      await refreshData({ selectedOrderId: createdOrder.id });
    } catch (error) {
      notifyError(error.message || "Unable to create order.");
      throw error;
    } finally {
      setOrderSubmitting(false);
    }
  }

  async function handleInspectOrder(orderId) {
    setDetailLoading(true);
    setPageError("");

    try {
      const order = await fetchOrderById(orderId);
      setSelectedOrder(order);
      setActiveSection("orders");
    } catch (error) {
      notifyError(error.message || "Unable to load order details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDeleteProduct(product) {
    requestConfirmation({
      title: "Delete Product",
      message: `Are you sure you want to delete product "${product.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteProduct(product.id);
          if (editingProduct?.id === product.id) {
            setEditingProduct(null);
          }
          notifySuccess("Product deleted successfully.");
          await refreshData();
        } catch (error) {
          notifyError(error.message || "Unable to delete product.");
        }
      },
    });
  }

  async function handleDeleteCustomer(customer) {
    requestConfirmation({
      title: "Delete Customer",
      message: `Are you sure you want to delete customer "${customer.full_name}"? All history for this customer will be removed.`,
      onConfirm: async () => {
        try {
          await deleteCustomer(customer.id);
          notifySuccess("Customer deleted successfully.");
          await refreshData();
        } catch (error) {
          notifyError(error.message || "Unable to delete customer.");
        }
      },
    });
  }

  async function handleDeleteOrder(order) {
    requestConfirmation({
      title: "Cancel Order",
      message: `Are you sure you want to cancel order #${order.id}? This will restock all its items back into the inventory.`,
      onConfirm: async () => {
        try {
          await deleteOrder(order.id);
          if (selectedOrder?.id === order.id) {
            setSelectedOrder(null);
          }
          notifySuccess("Order canceled and stock restored.");
          await refreshData({ keepSelection: false });
        } catch (error) {
          notifyError(error.message || "Unable to cancel order.");
        }
      },
    });
  }

  const filteredProducts = filterProducts(products, deferredProductQuery);
  const filteredCustomers = filterCustomers(customers, deferredCustomerQuery);
  const filteredOrders = filterOrders(orders, deferredOrderQuery);
  const lowStockCount = dashboard.low_stock_products.length;
  const totalInventoryValue = products.reduce(
    (sum, product) => sum + Number(product.price) * Number(product.quantity_in_stock),
    0,
  );

  const summaryItems = [
    {
      label: "Products",
      value: dashboard.total_products,
      helper: "total products",
      tag: `${products.length} listed`,
      accent: "teal",
    },
    {
      label: "Customers",
      value: dashboard.total_customers,
      helper: "saved customers",
      tag: `${customers.length} records`,
      accent: "blue",
    },
    {
      label: "Orders",
      value: dashboard.total_orders,
      helper: "processed orders",
      tag: `${orders.length} created`,
      accent: "violet",
    },
    {
      label: "Inventory Value",
      value: formatCurrency(totalInventoryValue),
      helper: "current stock value",
      tag: refreshing || isPending ? "syncing" : "updated",
      accent: "mint",
    },
  ];

  const getHeroContent = () => {
    switch (activeSection) {
      case "products":
        return {
          eyebrow: "Catalog",
          title: "Product Catalog & Inventory",
          description: "Create, search, and update your products. Keep track of stock levels and ensure SKU uniqueness.",
          metrics: [
            summaryItems[0],
            {
              label: "Low Stock Alert",
              value: lowStockCount,
              helper: "items needing restock",
              tag: lowStockCount > 0 ? "needs attention" : "all safe",
              accent: lowStockCount > 0 ? "amber" : "teal",
            }
          ]
        };
      case "customers":
        return {
          eyebrow: "Buyers",
          title: "Customer Records & Directory",
          description: "Manage customer profiles, emails, and contact details. Check history and look up records.",
          metrics: [
            summaryItems[1],
            {
              label: "Active Buyers",
              value: customers.length,
              helper: "registered accounts",
              tag: "database synced",
              accent: "blue",
            }
          ]
        };
      case "orders":
        return {
          eyebrow: "Ledger",
          title: "Order Placement & Tracking",
          description: "Dispatch new orders with automated stock validation. Review details or cancel and restore stock.",
          metrics: [
            summaryItems[2],
            {
              label: "Total Sales",
              value: formatCurrency(orders.reduce((sum, order) => sum + Number(order.total_amount), 0)),
              helper: "order sales total",
              tag: `${orders.length} sales`,
              accent: "violet",
            }
          ]
        };
      case "dashboard":
      default:
        return {
          eyebrow: "Inventory & Order Management System",
          title: "Dashboard Overview",
          description: "Manage products, customers, orders, and stock levels from one clean dashboard.",
          metrics: summaryItems
        };
    }
  };

  const heroContent = getHeroContent();

  return (
    <div className={`app-shell${menuOpen ? " menu-open" : ""}`}>
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <nav
        id="app-sidebar"
        className={`floating-nav app-sidebar${menuOpen ? " is-open" : ""}`}
        aria-label="Primary"
      >
        <div className="sidebar-brand">
          <div className="brand-text">
            <strong>Inventory & Order Management System</strong>
          </div>
        </div>

        <div className="sidebar-links">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeSection === item.id ? "nav-pill nav-pill-active" : "nav-pill"}
              onClick={() => handleNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="app-chrome">
        <header className="app-header">
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="visually-hidden">{menuOpen ? "Close menu" : "Open menu"}</span>
            <span className="menu-bars" aria-hidden="true">
              <span className="menu-bar" />
              <span className="menu-bar" />
              <span className="menu-bar" />
            </span>
          </button>

          <div className="brand-mark">
            <div className="brand-text">
              <h1>Inventory & Order Management System</h1>
            </div>
          </div>

        </header>

        <nav className="floating-nav desktop-nav" aria-label="Primary">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeSection === item.id ? "nav-pill nav-pill-active" : "nav-pill"}
              onClick={() => handleNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="content-shell">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">{heroContent.eyebrow}</span>
            <h2>{heroContent.title}</h2>
            <p>{heroContent.description}</p>
          </div>

          <div className="hero-metrics">
            {heroContent.metrics.map((item) => (
              <SummaryCard
                key={item.label}
                label={item.label}
                value={item.value}
                helper={item.helper}
                tag={item.tag}
                accent={item.accent}
              />
            ))}
          </div>
        </section>

        {pageError ? <div className="page-error">{pageError}</div> : null}

        {initialLoading ? <LoadingSkeleton /> : null}

        {!initialLoading && activeSection === "dashboard" ? (
          <section className="overview-grid">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="panel-kicker">Low Stock Products</span>
                  <h2>Stock alerts</h2>
                  <p>Products at or below the current low-stock threshold.</p>
                </div>
                <span className="panel-chip">{lowStockCount} items</span>
              </div>

              {dashboard.low_stock_products.length ? (
                <div className="watchlist">
                  {dashboard.low_stock_products.map((product) => (
                    <article key={product.id} className="watch-card">
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.sku}</span>
                      </div>
                      <span className="pill pill-amber">{product.quantity_in_stock} left</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No low-stock products right now.</p>
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="panel-kicker">Recent Orders</span>
                  <h2>Latest order activity</h2>
                  <p>Quick access to recently created orders.</p>
                </div>
                <span className="panel-chip">{Math.min(orders.length, 5)} shown</span>
              </div>

              {orders.length ? (
                <div className="watchlist">
                  {orders.slice(0, 5).map((order) => (
                    <article key={order.id} className="watch-card">
                      <div>
                        <strong>Order #{order.id}</strong>
                        <span>{order.customer_name}</span>
                      </div>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => handleInspectOrder(order.id)}
                      >
                        {formatCurrency(order.total_amount)}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No orders created yet.</p>
              )}
            </div>
          </section>
        ) : null}

        {!initialLoading && activeSection === "products" ? (
          <section className="workspace-section">
            <div className="section-heading">
              <div>
                <span className="panel-kicker">Products</span>
                <h2>Catalog and inventory</h2>
                <p>Create, update, search, and manage available stock.</p>
              </div>
              <span className="panel-chip">{products.length} products</span>
            </div>

            <div className="management-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>{editingProduct ? "Update Product" : "Add Product"}</h2>
                    <p>Maintain product details, SKU uniqueness, price, and stock.</p>
                  </div>
                </div>
                <ProductForm
                  initialValues={editingProduct}
                  onSubmit={handleProductSubmit}
                  onCancel={() => setEditingProduct(null)}
                  submitting={productSubmitting}
                />
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Product List</h2>
                    <p>Search, edit, or remove products.</p>
                  </div>
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Search by product name or SKU"
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                  />
                </div>
                <ProductTable
                  products={filteredProducts}
                  onEdit={(product) => setEditingProduct(product)}
                  onDelete={handleDeleteProduct}
                />
              </div>
            </div>
          </section>
        ) : null}

        {!initialLoading && activeSection === "customers" ? (
          <section className="workspace-section">
            <div className="section-heading">
              <div>
                <span className="panel-kicker">Customers</span>
                <h2>Customer records</h2>
                <p>Add customers, search the list, and keep contact data organized.</p>
              </div>
              <span className="panel-chip">{customers.length} customers</span>
            </div>

            <div className="management-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Add Customer</h2>
                    <p>Create a customer record for future orders.</p>
                  </div>
                </div>
                <CustomerForm onSubmit={handleCustomerSubmit} submitting={customerSubmitting} />
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Customer List</h2>
                    <p>Search by name, email, or phone number.</p>
                  </div>
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Search by name, email, or phone"
                    value={customerQuery}
                    onChange={(event) => setCustomerQuery(event.target.value)}
                  />
                </div>
                <CustomerTable customers={filteredCustomers} onDelete={handleDeleteCustomer} />
              </div>
            </div>
          </section>
        ) : null}

        {!initialLoading && activeSection === "orders" ? (
          <section className="workspace-section">
            <div className="section-heading">
              <div>
                <span className="panel-kicker">Orders</span>
                <h2>Order placement and tracking</h2>
                <p>Create new orders, inspect details, and cancel orders when needed.</p>
              </div>
              <span className="panel-chip">{orders.length} orders</span>
            </div>

            <div className="orders-layout">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Create Order</h2>
                    <p>Inventory is validated and reduced automatically by the backend.</p>
                  </div>
                </div>
                <OrderForm
                  customers={customers}
                  products={products}
                  onSubmit={handleOrderSubmit}
                  submitting={orderSubmitting}
                />
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Order List</h2>
                    <p>Search orders and inspect full details.</p>
                  </div>
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Search by order ID or customer"
                    value={orderQuery}
                    onChange={(event) => setOrderQuery(event.target.value)}
                  />
                </div>
                <OrderTable
                  orders={filteredOrders}
                  onInspect={handleInspectOrder}
                  onDelete={handleDeleteOrder}
                  selectedOrderId={selectedOrder?.id}
                />
              </div>

              <OrderDetailsCard order={selectedOrder} loading={detailLoading} />
            </div>
          </section>
        ) : null}
      </main>

      {confirmModal.isOpen ? (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-card">
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              >
                No, Keep It
              </button>
              <button
                type="button"
                className="primary-button danger-button"
                onClick={confirmModal.onConfirm}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
