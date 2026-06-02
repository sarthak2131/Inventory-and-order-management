# 🌐 Inventory & Order Management System (IOMS)

A high-performance, containerized, and responsive full-stack enterprise application designed to streamline product inventory tracking, customer profiles, and intelligent order processing. 

Built with **FastAPI (Python)**, **React + Vite (JavaScript)**, **PostgreSQL**, and fully orchestrated using **Docker** and **Docker Compose**.

---

## 🚀 Key Features

*   📦 **Robust Product Catalog:** Complete CRUD capabilities, SKU uniqueness enforcement, real-time inventory count tracking, and automatic out-of-stock validation.
*   👥 **Customer Relationship Directory:** Profile creation, comprehensive customer directory, dynamic search/lookups, and unique email integrity.
*   🛒 **Intelligent Order Lifecycle:** Automated stock reduction upon order creation, atomicity with PostgreSQL transactions, total pricing automation, and automatic stock restoration upon order cancellation.
*   📅 **Dynamic Visual Dashboard:**
    *   **Interactive Order Calendar:** Track and visualize daily order volumes on a custom grid. Click dates to instantly fetch orders and display breakdown summaries.
    *   **Latest Activity Log:** A scrollable watchlist panel showcasing the most recent orders for rapid review.
    *   **Smart Stock Alerts:** A full-width bottom panel highlighting low-stock items based on configurable thresholds to prevent shortages.
*   🔔 **Micro-Animations & Toasts:** Graceful transition effects, premium glassmorphism, responsive sidebar drawers, and toast alerts for immediate action when stock drops below threshold levels.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Backend API** | FastAPI, SQLAlchemy, Uvicorn, Pydantic | Asynchronous request handling, automated OpenAPI docs, robust data validation. |
| **Frontend UI** | React (Hooks), Vite, CSS3 Variables, SVGs | Ultra-fast rendering, glassmorphic card elements, custom responsive views. |
| **Database** | PostgreSQL 16 | ACID compliant relational storage, relational integrity, transaction safety. |
| **DevOps** | Docker, Docker Compose, Nginx | Standardized deployments, local environment mirroring, reverse proxy. |

---

## 📂 Project Directory Structure

```text
├── backend/                  # Python FastAPI API codebase
│   ├── app/
│   │   ├── core/             # Application configs & DB engine setups
│   │   ├── database/         # Models, connection session & DB dependencies
│   │   ├── schemas/          # Data schemas (Pydantic models)
│   │   ├── services/         # Core business logic handlers (CRUD, validation)
│   │   └── api/              # API router endpoints
│   ├── Requirements.txt       # Python backend library dependencies
│   └── Dockerfile            # Container build spec for Python app
│
├── frontend/                 # React SPA codebase
│   ├── src/
│   │   ├── components/       # Visual templates, Forms & Tables
│   │   ├── api/              # Fetch adapters & clients
│   │   ├── utils/            # Data formatting & layout utilities
│   │   └── App.jsx           # Parent router, layout shell & dashboard pages
│   ├── index.html            # Application entry template
│   └── Dockerfile            # Nginx static server container build spec
│
├── docker-compose.yml        # Multi-container local production orchestrator
├── .env.example              # Template for environment configuration
└── README.md                 # Project documentation
```

---

## 📦 Local Installation (Docker Compose - Recommended)

To run the entire ecosystem (Frontend, Backend, Database) in a single command using Docker:

### Prerequisites
Make sure you have **Docker Desktop** installed and running on your system.

### Steps
1.  **Clone the Repository & Navigate to Workspace:**
    ```bash
    git clone https://github.com/sarthak2131/Inventory-and-order-management.git
    cd Inventory-and-order-management
    ```

2.  **Configure Environment Variables:**
    Copy the sample configuration file to a live `.env` file:
    ```bash
    cp .env.example .env
    ```

3.  **Spin Up the Docker Containers:**
    ```bash
    docker compose up --build
    ```
    This pulls PostgreSQL, builds the frontend/backend custom images, establishes network boundaries, and runs everything.

4.  **Access the Applications:**
    *   **Frontend Dashboard UI:** [http://localhost:3000](http://localhost:3000)
    *   **API Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
    *   **API Health Status:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 🛠️ Local Development (Without Docker)

If you prefer to run the components separately on your local machine for rapid development:

### 🐍 1. Backend Setup
1.  Navigate into the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # macOS/Linux:
    source .venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure `.env` in the root workspace or launch with default database settings.
5.  Start the FastAPI application server:
    ```bash
    uvicorn app.main:app --reload
    ```

### ⚛️ 2. Frontend Setup
1.  Navigate into the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start the Vite local development server:
    ```bash
    npm run dev
    ```
4.  Access the Vite dev server at [http://localhost:5173](http://localhost:5173).

---

## 📡 API Reference Checklist

### Health Status
*   `GET /health` - Heartbeat ping to verify system is up and connected to DB.

### Products Core
*   `POST /api/v1/products` - Register a new product (validates unique SKU).
*   `GET /api/v1/products` - Query all products (supports query parameters).
*   `GET /api/v1/products/{id}` - Retrieve details of a specific product.
*   `PUT /api/v1/products/{id}` - Modify pricing, SKU, or stocks.
*   `DELETE /api/v1/products/{id}` - Deregister product.

### Customers Core
*   `POST /api/v1/customers` - Save a new customer record (validates unique Email).
*   `GET /api/v1/customers` - Fetch customer catalog directory.
*   `GET /api/v1/customers/{id}` - Look up profile details.
*   `DELETE /api/v1/customers/{id}` - Remove customer directory record.

### Orders Ledger
*   `POST /api/v1/orders` - Dispatch new order. Validates stock volumes in atomic transaction and calculates pricing.
*   `GET /api/v1/orders` - Query all order ledger histories.
*   `GET /api/v1/orders/{id}` - Get complete order info and items breakdown.
*   `DELETE /api/v1/orders/{id}` - Cancel order. Automatically refunds items back into product stock inventory.

### Analytics Dashboard
*   `GET /api/v1/dashboard/summary` - Get quick summary stats (Metrics, list of low stock items).

---

## ⚙️ Environment Configuration (`.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `POSTGRES_DB` | `inventory_db` | Name of the default database instance. |
| `POSTGRES_USER` | `inventory_user` | Database master user credential. |
| `POSTGRES_PASSWORD` | `change_me` | Database password credential. |
| `LOW_STOCK_THRESHOLD` | `5` | Inventory level under which a product triggers low-stock alerts. |
| `BACKEND_CORS_ORIGINS` | `http://localhost:3000` | Allowed origin domains to securely interact with the backend API. |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Root endpoint of the backend service used by frontend app. |

---

## 🚢 Cloud Deployment Setup

### ⚙️ Backend Deployment (e.g., Render, Railway, Fly.io)
1. Point your deployment root to the `backend/` folder of this repo.
2. Select **Python** runtime environment.
3. Bind your environment port variables.
4. Set the Start Command to:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
5. Set environment variables: `DATABASE_URL` (points to your cloud PostgreSQL database instance) and `BACKEND_CORS_ORIGINS`.

### ⚛️ Frontend Deployment (e.g., Vercel, Netlify)
1. Point your deployment root to the `frontend/` folder of this repo.
2. Configure build settings:
   *   **Build Command:** `npm run build`
   *   **Output Directory:** `dist`
3. Configure environment variable:
   *   `VITE_API_BASE_URL` = `<your_deployed_backend_api_url>/api/v1`
4. Register the deployed frontend domain in your backend's `BACKEND_CORS_ORIGINS` setting to permit CORS requests.

---

## 🔗 Project Showcase Links

*   **GitHub Code Repository:** [sarthak2131/Inventory-and-order-management](https://github.com/sarthak2131/Inventory-and-order-management)
*   **Docker Hub Backend Image:** [heysarthak/inventory-backend:latest](https://hub.docker.com/r/heysarthak/inventory-backend)
*   **Live Application URL:** `https://inventory-and-order-management-frontend.vercel.app` *(Optional)*
*   **Live API Backend URL:** `https://inventory-and-order-management-backend.railway.app` *(Optional)*
