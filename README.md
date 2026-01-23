# 🌐 Distributed Retail POS System

A production-grade, offline-first distributed Point of Sale system designed for retailers with multiple branches.
The system ensures 100% uptime for cashiers even when the internet is down, automatically syncing data to a Central HQ when connectivity is restored.


## 🏗️ Architecture

The system follows a resilient **star topology (Hub-and-Spoke)**:

1.  **Central HQ (Supabase)**:
    *   **Role**: Source of Truth & Analytics Engine.
    *   **Data**: Master Product Catalog, Employee Profiles, Aggregated Sales.
    *   **Services**: Identity Provider (Auth), Dashboard Backend.

2.  **Edge Nodes (Store Databases)**:
    *   **Role**: Local Persistence Layer.
    *   **Location**: Each branch (e.g., JKT-001, BDG-001) runs its own lightweight Supabase/Postgres instance.
    *   **Behavior**: Zero-latency writes for POS; pulls updates from Central asynchronously.

3.  **Sync Engine (Python Middleware)**:
    *   **Role**: Bi-directional Data Bridge.
    *   **Processes**: `store_node_a.py` and `store_node_b.py` run continuously.
    *   **Traffic**:
        *   ⬇️ **Downstream**: Syncs Products/Employees from Central to Store.
        *   ⬆️ **Upstream**: Syncs completed Transactions from Store to Central.

## 📦 Project Structure

```bash
├── admin-dashboard/     # 📊 HQ Control Panel (Next.js 14 App Router)
│   ├── src/app/dashboard # Analytics, Employee Mgmt, System Health
│   └── ...
├── Cashier-dashboard/   # 🛒 Unified POS App for Stores (Next.js 14)
│   ├── src/app/pos      # Offline-capable Point of Sale Interface
│   └── ...
├── nodes/               # 🔄 Sync Workers (Python)
│   ├── store_node_a.py  # Worker for Store JKT-001
│   ├── store_node_b.py  # Worker for Store BDG-001
│   └── requirements.txt # Python dependencies
├── schema_central.sql   # 🗄️ SQL Schema for HQ Database
├── schema_store.sql     # 🗄️ SQL Schema for Store Databases
└── start-app.sh         # 🚀 One-click orchestration script
```

## ⚡ Quick Start Guide

### 1. Prerequisites
*   **Node.js** v18+ (for Dashboards)
*   **Python** 3.9+ (for Sync Engine)
*   **Supabase** (3 projects required: Central, Store A, Store B)

### 2. Database Setup
Execute the SQL scripts in the Supabase SQL Editor for each project:

*   **Central HQ Project**: Run `schema_central.sql`.
*   **Store A Project**: Run `schema_store.sql`.
*   **Store B Project**: Run `schema_store.sql`.

> **Important**: Ensure Row Level Security (RLS) policies in `schema_store.sql` allow the service role (or public in dev) to insert data, otherwise sync will fail.

### 3. Environment Configuration
Create `.env` files in the following directories.

**`admin-dashboard/.env`**:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Store Connections for System Health Check
NEXT_PUBLIC_STORE_A_URL=...
NEXT_PUBLIC_STORE_A_KEY=...
NEXT_PUBLIC_STORE_B_URL=...
NEXT_PUBLIC_STORE_B_KEY=...
```

**`Cashier-dashboard/.env`**:
```env
# Point this to the LOCAL Store DB (e.g., Store A)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Central connection for specific lookups if needed
NEXT_PUBLIC_CENTRAL_URL=...
NEXT_PUBLIC_CENTRAL_KEY=...
```

**`nodes/.env`** (or hardcode in `.py` for dev):
```env
CENTRAL_URL=...
CENTRAL_KEY=...
STORE_A_URL=...
STORE_A_KEY=...
```

### 4. Running the System
We generally run the entire cluster locally using the start script:

```bash
# Make script executable
chmod +x start-app.sh

# Launch Cluster
./start-app.sh
```

**What happens next?**
1.  Dependencies installed via `pip` and `npm`.
2.  **Sync Nodes** start in background (logs: `nodes/*.log`).
3.  **Admin Dashboard** starts at `http://localhost:3001`.
4.  **Cashier POS** starts at `http://localhost:3000`.

## 🛠️ Operational Guide

### Employee Management
1.  Go to Admin Dashboard > **Manajemen Karyawan**.
2.  Click **"Tambah Karyawan"**.
3.  Create a user (e.g., `kasir1`, PIN `123456`).
4.  This creates a Global Identity that can log in to ANY store if authorized.

### Conducting Sales (Offline Mode)
1.  Open Cashier POS (`localhost:3000`).
2.  Login with the PIN created above.
3.  Add items to cart.
4.  Checkout (Cash/QRIS). The transaction saves locally immediately.
5.  Watch the **Sync Queue** in Admin Dashboard to see it upload to HQ.

### Troubleshooting Not-Syncing Data
*   **Check Logs**: Look at `nodes/solar.log` or `nodes/gyu.log`.
*   **Common Error**: `new row violates row-level security policy`.
    *   *Fix**: detailed in `schema_store.sql` comments (Update Policy).
*   **Common Error**: `FK constraint violation`.
    *   *Fix*: Ensure Product Master data exists in Store DB (Downstream sync must run first).

## 🛡️ Security Features
*   **RLS-Enabled**: Database tables are protected by Row-Level Security.
*   **PIN Hashing**: User PINs are combined with salt before verification (basic implementation).
*   **Isolated Failures**: If HQ goes down, Stores continue operating 100%.

## 👥 Contributors
Developed by Xavierree with love.
