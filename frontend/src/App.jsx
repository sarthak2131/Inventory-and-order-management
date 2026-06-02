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

function ClipboardIcon() {
  return (
    <div className="empty-state-illustration">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: "0 auto 12px" }}>
        <rect x="18" y="12" width="28" height="38" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M26 8h12a2 2 0 0 1 2 2v2H24v-2a2 2 0 0 1 2-2z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="24" y1="22" x2="40" y2="22" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="28" x2="36" y2="28" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="34" x2="32" y2="34" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="44" cy="44" r="8" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
        <line x1="49.5" y1="49.5" x2="54" y2="54" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function AllGoodIcon() {
  return (
    <div className="empty-state-illustration all-good-illustration">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: "0 auto 12px" }}>
        <path d="M32 10L12 18v28l20 8 20-8V18L32 10z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M12 18l20 8 20-8" stroke="#cbd5e1" strokeWidth="2" />
        <line x1="32" y1="26" x2="32" y2="54" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="44" cy="44" r="10" fill="#22c55e" />
        <path d="M39 44l3 3 7-7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function App() {
  const getNavIcon = (id, isActive) => {
    const strokeColor = isActive ? "#3b82f6" : "currentColor";
    const fillColor = "none";
    const size = 18;
    
    switch (id) {
      case "dashboard":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        );
      case "products":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
      case "customers":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "orders":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        );
      default:
        return null;
    }
  };

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

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];

    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevDaysCount = new Date(prevYear, prevMonth + 1, 0).getDate();

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevYear, prevMonth, prevDaysCount - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;

    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(nextYear, nextMonth, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getOrdersForDate = (dateObj) => {
    if (!dateObj) return [];
    return orders.filter((order) => {
      const d = new Date(order.created_at);
      return (
        d.getFullYear() === dateObj.getFullYear() &&
        d.getMonth() === dateObj.getMonth() &&
        d.getDate() === dateObj.getDate()
      );
    });
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

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
              {getNavIcon(item.id, activeSection === item.id)}
              <span>{item.label}</span>
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
              {getNavIcon(item.id, activeSection === item.id)}
              <span>{item.label}</span>
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
          <>
            <section className="overview-grid">
              <div className="panel calendar-panel dashboard-panel">
                <div className="panel-header">
                  <div className="panel-header-icon-group">
                    <div className="header-icon-circle calendar-circle">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <h2>Order Calendar</h2>
                      <p>Track and view orders by date.</p>
                    </div>
                  </div>
                  <span className="panel-chip panel-chip-placeholder" aria-hidden="true">
                    &nbsp;
                  </span>
                </div>

                <div className="calendar-split-container">
                  {/* Left side: Compact Calendar Widget */}
                  <div className="calendar-widget-wrapper">
                    <div className="calendar-widget-header">
                      <button type="button" className="secondary-button icon-button" onClick={handlePrevMonth}>
                        &larr;
                      </button>
                      <span className="calendar-current-month">
                        <strong>{monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</strong>
                      </span>
                      <button type="button" className="secondary-button icon-button" onClick={handleNextMonth}>
                        &rarr;
                      </button>
                    </div>

                    <div className="calendar-body">
                      <div className="calendar-weekdays">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                          <div key={day} className="weekday-label">{day}</div>
                        ))}
                      </div>

                      <div className="calendar-grid">
                        {getCalendarDays().map(({ date, isCurrentMonth }, idx) => {
                          const dayOrders = getOrdersForDate(date);
                          const isSelected = isSameDay(date, selectedCalendarDate);
                          const isToday = isSameDay(date, new Date());
                          
                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`calendar-day${!isCurrentMonth ? " day-outside" : ""}${isSelected ? " day-selected" : ""}${isToday ? " day-today" : ""}${dayOrders.length > 0 ? " day-has-orders" : ""}`}
                              onClick={() => setSelectedCalendarDate(date)}
                            >
                              <span className="day-number">{date.getDate()}</span>
                              {dayOrders.length > 0 ? (
                                <span className="day-badge">{dayOrders.length}</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Selected Date Orders List */}
                  <div className="calendar-selected-orders">
                    <div className="selected-orders-header">
                      <h3>Orders on {selectedCalendarDate ? selectedCalendarDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : ""}</h3>
                      <span className="panel-chip">{getOrdersForDate(selectedCalendarDate).length} orders</span>
                    </div>

                    {getOrdersForDate(selectedCalendarDate).length > 0 ? (
                      <div className="calendar-orders-list">
                        {getOrdersForDate(selectedCalendarDate).map(order => (
                          <div key={order.id} className="calendar-order-card" onClick={() => handleInspectOrder(order.id)} style={{ cursor: "pointer" }}>
                            <div className="order-card-meta">
                              <strong>Order #{order.id}</strong>
                              <span>{order.customer_name.toLowerCase()}</span>
                              <span className="order-card-time">
                                {new Date(order.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="order-card-actions">
                              <span className="order-price-badge">{formatCurrency(order.total_amount)}</span>
                              <span className="chevron-arrow">&rsaquo;</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="calendar-empty-state-container">
                        <ClipboardIcon />
                        <strong>No orders placed on this date.</strong>
                        <p>Select a different date to view orders.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="panel dashboard-panel">
                <div className="panel-header">
                  <div className="panel-header-icon-group">
                    <div className="header-icon-circle activity-circle">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    </div>
                    <div>
                      <h2>Latest Order Activity</h2>
                      <p>Quick access to recently created orders.</p>
                    </div>
                  </div>
                  <span className="panel-chip">{Math.min(orders.length, 5)} shown</span>
                </div>

                {orders.length ? (
                  <div className="watchlist recent-orders-list">
                    {orders.slice(0, 5).map((order) => (
                      <article
                        key={order.id}
                        className="watch-card order-activity-card"
                        onClick={() => handleInspectOrder(order.id)}
                      >
                        <div className="order-card-meta">
                          <strong>Order #{order.id}</strong>
                          <span>{order.customer_name.toLowerCase()}</span>
                        </div>
                        <div className="order-card-actions">
                          <span className="order-price-badge">{formatCurrency(order.total_amount)}</span>
                          <span className="chevron-arrow">&rsaquo;</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No orders created yet.</p>
                )}
              </div>
            </section>

            {/* Bottom Panel: Low Stock Products (Expanding full width!) */}
            <div className="panel low-stock-panel">
              <div className="panel-header">
                <div className="panel-header-icon-group">
                  <div className="header-icon-circle alerts-circle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div>
                    <h2>Stock Alerts</h2>
                    <p>Products at or below the current low-stock threshold.</p>
                  </div>
                </div>
                <span className="panel-chip">{lowStockCount} items</span>
              </div>

              {dashboard.low_stock_products.length ? (
                <div className="watchlist low-stock-full-list">
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
                <div className="calendar-empty-state-container" style={{ margin: "24px 0" }}>
                  <AllGoodIcon />
                  <strong>All good!</strong>
                  <p>No low-stock products right now.</p>
                </div>
              )}
            </div>
          </>
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

      <footer className="app-footer">
        <p>&copy; 2026 Inventory & Order Management System. All rights reserved.</p>
      </footer>

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
