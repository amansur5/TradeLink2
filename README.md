# TradeLink B2B Trading Platform

## Overview
TradeLink is a B2B trading platform connecting producers and buyers, with real-time messaging, product catalog, order management, commissions, and financial tracking. It features a modern Next.js/React frontend and a robust Flask/MySQL backend.

---

## Features
- User registration/login (buyers, producers, admin)
- Product catalog with images, specifications, and categories
- Orders with commission and payment tracking
- Real-time messaging (inquiries, chat, notifications)
- Producer and admin bank details management
- Commissions and financials dashboard
- Responsive, mobile-friendly UI
- Admin panel for user and product management

---

## Tech Stack
- **Frontend:** Next.js (React), TypeScript, Tailwind CSS, Socket.IO client
- **Backend:** Flask, Flask-SocketIO, MySQL, JWT, bcrypt, python-socketio
- **Database:** MySQL (see `backend/schema.sql`)

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repo-url>
cd TradeLink
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

- Copy `.env.example` to `.env` and set your environment variables (DB credentials, SECRET_KEY, etc).
- Initialize the database:
  - Create the database and tables:
    ```bash
    mysql -u <user> -p < backend/schema.sql
    ```
  - (Optional) Run any migration scripts in `backend/` if upgrading an existing DB.

- Start the backend server:
```bash
python app.py
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
- The frontend will be available at `http://localhost:3000`

---

## Environment Variables
- See `.env.example` in `backend/` for required variables (DB connection, JWT secret, etc).
- Frontend may use `.env.local` for API base URL if needed.

---

## Database
- All tables and relationships are defined in `backend/schema.sql`.
- Supports all features: users, products, orders, inquiries, messages, commissions, bank details, etc.

---

## Usage
- Register as a buyer or producer, or log in as admin.
- Producers can add products, manage bank details, and view commissions.
- Buyers can browse products, place orders, and message producers.
- All users can use real-time chat for inquiries and order discussions.
- Admin can manage users, products, and view platform financials.

---

## Scripts & Utilities
- **Backend migrations:** See scripts in `backend/` (e.g., `run_commission_migration.py`, `run_bank_details_migration.py`).
- **Frontend requirements:** See `frontend/requirements.txt` for a reference list.

---

## License
This project is for demonstration and internal use. Contact the author for licensing details. 