export type Role = 'SUPER_ADMIN' | 'AREA_MANAGER' | 'STORE_LEADER' | 'CASHIER';

export interface User {
    id: string;
    username: string;
    full_name: string;
    role: Role;
    branch_id: number;
    email?: string;
    isAuthenticated?: boolean;
}

export interface Branch {
    id: number;
    branch_code: string;
    branch_name: string;
    address: string;
    region_name?: string;
    server_ip?: string;
    is_active: boolean;
}

export interface Product {
    product_id: number;
    barcode: string;
    name: string;
    price: number;
    base_price?: number;
    category?: string;
    stock?: number;
}

export interface Transaction {
    transaction_uuid: string;
    global_id?: number;
    branch_id: number;
    branch_name?: string;
    shift_id: number | null;
    user_id: number | string | null;
    cashier_name?: string;
    subtotal: number;
    total_discount: number;
    tax_amount: number;
    grand_total: number;
    total_amount?: number;
    payment_method: 'CASH' | 'QRIS' | 'DEBIT' | 'CREDIT';
    cash_received?: number;
    change_returned?: number;
    created_at: string;
    trx_date_local?: string;
    synced: boolean;
}

export interface TransactionItem {
    item_id?: number;
    transaction_uuid: string;
    product_id: number;
    product_name?: string;
    qty: number;
    price_at_sale?: number;
    final_price?: number;
    subtotal: number;
    category?: string;
}

export interface Employee {
    user_id: number;
    branch_id: number | null;
    username: string;
    role: string;
    full_name?: string;
}

export interface DashboardStats {
    revenue: number;
    transactions: number;
    branches: number;
    products: number;
}

export interface ChartData {
    name: string;
    total: number;
}

export interface BranchPerformance {
    branch_name: string;
    transaction_count: number;
    total_revenue: number;
}

export interface SyncStatus {
    sync_id: number;
    branch_id: number;
    table_name: string;
    last_sync_at: string;
    records_synced: number;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
}
