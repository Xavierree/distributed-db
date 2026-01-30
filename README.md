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

### Running the System

#### On Linux/macOS:
We generally run the entire cluster locally using the start script:

```bash
# Make script executable
chmod +x start-app.sh

# Launch Cluster
./start-app.sh
```

#### On Windows:
**Step 1: Install Prerequisites**
- **Node.js v18+**: Download from [nodejs.org](https://nodejs.org) or use:
  ```powershell
  winget install OpenJS.NodeJS
  ```
- **Python 3.9+**: Download from [python.org](https://python.org) or use:
  ```powershell
  winget install Python.Python.3.12
  ```

**Step 2: Install Python Dependencies**
```powershell
pip install -r requirements-w.txt
```

**Step 3: Install Dashboard Dependencies**
```powershell
cd admin-dashboard
npm install
cd ..

cd Cashier-dashboard
npm install
cd ..
```

**Step 4: Launch the System**
```powershell
# Option A: Using PowerShell script (recommended)
.\start-app.ps1

# Option B: Run with explicit Node.js PATH
$env:Path += ";${env:ProgramFiles}\nodejs"
.\start-app.ps1
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
Developed by Josgiv & Xavierree with love.
