# Production-Ready Inventory & Order Management System

A full-stack technical assessment project built with FastAPI, React, PostgreSQL, Docker, and Docker Compose.

## Stack

- Backend: FastAPI + SQLAlchemy
- Frontend: React + Vite
- Database: PostgreSQL
- Containerization: Docker
- Orchestration: Docker Compose

## Features

- Product CRUD with unique SKU enforcement
- Customer creation, listing, lookup, and deletion with unique email enforcement
- Order creation with inventory validation and automatic total calculation
- Inventory reduction on order creation
- Inventory restoration on order cancellation/deletion
- Dashboard summary with low-stock visibility
- Responsive React UI with validation and feedback states

## Project Structure

```text
backend/
  app/
frontend/
docker-compose.yml
README.md
```

## API Overview

Base URL: `http://localhost:8000/api/v1`

- `POST /products`
- `GET /products`
- `GET /products/{id}`
- `PUT /products/{id}`
- `DELETE /products/{id}`
- `POST /customers`
- `GET /customers`
- `GET /customers/{id}`
- `DELETE /customers/{id}`
- `POST /orders`
- `GET /orders`
- `GET /orders/{id}`
- `DELETE /orders/{id}`
- `GET /dashboard/summary`

Health check: `GET /health`

## Local Run With Docker

1. Copy `.env.example` to `.env` and update the values.
2. Start the stack:

```bash
docker compose up --build
```

3. Open the apps:

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

## Local Development Without Docker

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Business Rules Implemented

- Product SKU must be unique
- Customer email must be unique
- Product stock cannot be negative
- Orders fail when stock is insufficient
- Order totals are calculated by the backend
- Stock levels are updated within the order transaction
- Order deletion restocks the affected products

## Deployment Guide

### Backend

Suggested free hosts:

- Render
- Railway
- Fly.io

Use the backend folder as the deploy root and configure:

- Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- `DATABASE_URL`
- `BACKEND_CORS_ORIGINS`
- `LOW_STOCK_THRESHOLD`

Provision a PostgreSQL instance on the chosen platform and point `DATABASE_URL` to it.

### Frontend

Suggested free hosts:

- Vercel
- Netlify

Use the frontend folder as the deploy root and configure:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=<your deployed backend url>/api/v1`

Also add the deployed frontend origin to `BACKEND_CORS_ORIGINS`.

## Submission Checklist

After publishing the project, fill in these deliverables:

- GitHub repository URL: `TODO`
- Docker Hub backend image URL: `TODO`
- Live frontend URL: `TODO`
- Live backend API URL: `TODO`
