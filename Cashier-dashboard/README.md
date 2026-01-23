# Alfamart Cashier POS

Local-first Point of Sale system for Alfamart store terminals.

## Quick Start

```bash
bun install
bun dev      # Development (http://localhost:3000)
bun build && bun start  # Production
```

## Login Credentials

Login uses 4-digit PIN authentication:

| Username | PIN | Role |
|----------|-----|------|
| `cashier_andi` | `1234` | Cashier |
| `cashier_siti` | `1234` | Cashier |
| `supervisor_budi` | `1234` | Store Supervisor |

## Tech Stack

- Next.js 16 (App Router, Server Actions)
- React 19, TypeScript
- PostgreSQL (local), TiDB Cloud (sync)
- Tailwind CSS v4, Shadcn/UI, Framer Motion, Zustand

## Pages & Features

### `/login` - PIN Authentication
- Username + 4-digit PIN
- Offline-first (works without internet)
- PIN verified against local PostgreSQL
- Session stored in cookies

### `/pos` - Point of Sale Interface

#### Header Section
- Store name and user info
- Connection status (Online/Offline)
- Current time
- **Riwayat** button - View today's transactions
- **Inventori** button - Inventory management (PIN protected)
- Logout button

#### Product Search
- Search by product name
- Barcode input field
- Search results dropdown
- Click to add to cart

#### Cart Display
- Product list with quantities
- Increment/decrement buttons
- Delete item button
- Per-item subtotal
- Grand total calculation

#### Payment Section
- Payment method selection: Cash, QRIS, Debit, Credit
- Cash received input
- Change calculation
- Checkout button

#### Transaction History Modal
- Today's transactions list
- Summary stats: total transactions, revenue, items sold, avg value
- Sync status indicator (Synced/Pending)
- Click to view transaction details

#### Inventory Management Modal
- PIN verification required (default: `123456`)
- Product grid with stock levels
- Low stock alerts (red highlight)
- Inline stock editing
- Search by name, barcode, category
- Stock updates sync to TiDB Cloud

## Project Structure

```
src/
├── app/
│   ├── globals.css         # Tailwind styles
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # POS home (redirects)
│   ├── login/
│   │   ├── page.tsx        # Login form
│   │   └── actions.ts      # PIN verification
│   └── pos/
│       ├── page.tsx        # Main POS interface
│       └── actions.ts      # Transaction & inventory actions
├── components/ui/          # Shadcn components
├── lib/
│   ├── db.ts               # PostgreSQL + TiDB connections
│   └── utils.ts            # Currency formatting, helpers
├── store/                  # Zustand state
└── types/                  # TypeScript definitions
```

## Environment Variables

```env
NEXT_PUBLIC_BRANCH_ID=101
NEXT_PUBLIC_BRANCH_CODE=JKT-001
NEXT_PUBLIC_BRANCH_NAME=Alfamart Jakarta Timur

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=retail_local_pos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

TIDB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_USER=your_user
TIDB_PASSWORD=your_password
TIDB_DATABASE=retail_cloud_hq
```

## Database Tables (Local PostgreSQL)

| Table | Purpose |
|-------|---------|
| `users_local` | Staff with PIN hashes |
| `products_local` | Product catalog |
| `inventory_local` | Stock levels |
| `transactions` | Transaction headers |
| `transaction_items` | Transaction line items |
| `cash_shifts` | Shift management |
| `upload_queue` | Cloud sync queue |

## Server Actions

### Transaction
- `saveTransactionAction()` - Save transaction + sync to cloud
- `getTodayTransactionsAction()` - Get today's transactions
- `getTransactionItemsAction()` - Get items for a transaction

### Products
- `searchProductsAction()` - Search products by name
- `getProductByBarcodeAction()` - Lookup by barcode

### Inventory
- `verifyAdminPinAction()` - PIN verification
- `getInventoryWithStockAction()` - Get products with stock
- `updateProductStockAction()` - Update stock level

### Sync
- `syncTransactionToCloud()` - Push to TiDB Cloud
- `checkConnectionAction()` - Check DB connectivity

## Offline Mode

The POS works offline:
1. Transactions saved to local PostgreSQL
2. Added to `upload_queue` for later sync
3. When online, background sync to TiDB Cloud
4. Status marked as synced after successful upload

---
© 2024 Alfamart Retail System
