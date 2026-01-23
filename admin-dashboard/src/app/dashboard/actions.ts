'use server';


import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { stores, centralClient, StoreConnection } from '@/lib/db';

// Access vars for local client creation if needed (or just reuse from db.ts import if accessible)
const CENTRAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const CENTRAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ============ HELPER: Get Client based on Filter ============
function getClients(branchId?: number) {
    if (!branchId) return stores;
    const store = stores[branchId - 1];
    return store ? [store] : [];
}

// ============ TYPES ============
interface Transaction {
    transaction_uuid: string;
    branch_id: number;
    created_at: string;
    grand_total: number;
    payment_method: string;
    user_id: number;
    branch_name: string;
    synced?: boolean;
}

// ============ PRODUCT CRUD OPERATIONS (Central HQ) ============
export async function createProduct(productData: any) {
    try {
        // 1. Central HQ
        const { error } = await centralClient
            .from('products')
            .insert([{
                barcode: productData.barcode,
                name: productData.name,
                category: productData.category,
                price: productData.price,
                tax_rate: productData.tax_rate,
                is_active: true
            }]);

        if (error) throw error;

        // 2. Broadcast to Stores
        console.log(`[SYNC] Starting broadcast to ${stores.length} stores...`);
        await Promise.all(stores.map(async (store) => {
            try {
                console.log(`[SYNC] Attempting to insert into ${store.name} (${store.id})...`);
                const { error: storeError } = await store.client.from('products').insert([{
                    barcode: productData.barcode,
                    name: productData.name,
                    category: productData.category,
                    price: productData.price,
                    tax_rate: productData.tax_rate,
                    is_active: true
                }]);
                if (storeError) {
                    console.error(`[SYNC] Failed to create in ${store.name}:`, storeError.message);
                } else {
                    console.log(`[SYNC] Successfully created in ${store.name}`);
                }
            } catch (e) {
                console.error(`[SYNC] Connection failed to ${store.name}`, e);
            }
        }));

        return { success: true };
    } catch (error: any) {
        console.error('Failed to create product:', error);
        return { success: false, error: error.message };
    }
}

export async function updateProduct(productId: number, productData: any) {
    try {
        // 1. Central HQ
        const { error } = await centralClient
            .from('products')
            .update({
                barcode: productData.barcode,
                name: productData.name,
                category: productData.category,
                price: productData.price,
                tax_rate: productData.tax_rate
            })
            .eq('product_id', productId);

        if (error) throw error;

        // 2. Broadcast to Stores (Attempt by ID - Note: requires synced IDs)
        // Fallback strategy: Try updating by barcode if available, or just ID.
        // For now, mirroring ID behavior.
        await Promise.all(stores.map(async (store) => {
            try {
                // Try update by barcode first as it's more reliable across distributed systems than auto-inc ID
                let match: { error: any } = { error: null };

                if (productData.barcode) {
                    const { error: e } = await store.client
                        .from('products')
                        .update({
                            name: productData.name,
                            category: productData.category,
                            price: productData.price,
                            tax_rate: productData.tax_rate,
                            barcode: productData.barcode // Self update
                        })
                        .eq('barcode', productData.barcode);
                    match = { error: e };
                } else {
                    // Fallback to ID
                    const { error: e } = await store.client
                        .from('products')
                        .update({
                            barcode: productData.barcode,
                            name: productData.name,
                            category: productData.category,
                            price: productData.price,
                            tax_rate: productData.tax_rate
                        })
                        .eq('product_id', productId);
                    match = { error: e };
                }

                if (match.error) console.error(`[SYNC] Failed to update in ${store.name}:`, match.error.message);
            } catch (e) {
                console.error(`[SYNC] Connection failed to ${store.name}`, e);
            }
        }));

        return { success: true };
    } catch (error: any) {
        console.error('Failed to update product:', error);
        return { success: false, error: error.message };
    }
}

// ============ TOGGLE STATUS ============
export async function toggleProductStatus(productId: number, isActive: boolean) {
    try {
        // 1. Central HQ
        const { error } = await centralClient
            .from('products')
            .update({ is_active: isActive })
            .eq('product_id', productId);

        if (error) throw error;

        // 2. Broadcast to Stores
        await Promise.all(stores.map(async (store) => {
            try {
                const { error: storeError } = await store.client
                    .from('products')
                    .update({ is_active: isActive })
                    .eq('product_id', productId);

                if (storeError) console.error(`[SYNC] Failed to toggle status in ${store.name}:`, storeError.message);
            } catch (e) {
                console.error(`[SYNC] Connection failed to ${store.name}`, e);
            }
        }));

        return { success: true };
    } catch (error: any) {
        console.error('Failed to toggle product status:', error);
        return { success: false, error: error.message };
    }
}

// ============ HARD DELETE ============
export async function deleteProduct(productId: number) {
    try {
        // 1. Central HQ
        const { error } = await centralClient
            .from('products')
            .delete()
            .eq('product_id', productId);

        if (error) throw error;

        // 2. Broadcast to Stores
        await Promise.all(stores.map(async (store) => {
            try {
                const { error: storeError } = await store.client
                    .from('products')
                    .delete()
                    .eq('product_id', productId);

                if (storeError) console.error(`[SYNC] Failed to delete in ${store.name}:`, storeError.message);
            } catch (e) {
                console.error(`[SYNC] Connection failed to ${store.name}`, e);
            }
        }));

        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete product:', error);
        // Handle FK constraint error gracefully
        if (error.code === '23503') { // Postgres FK violation code
            return { success: false, error: 'Tidak dapat menghapus produk yang sudah memiliki riwayat transaksi.' };
        }
        return { success: false, error: error.message };
    }
}

// ============ EMPLOYEES ============
export async function getAllEmployees() {
    try {
        const { data, error } = await centralClient
            .from('profiles')
            .select(`
                id,
                username,
                email,
                full_name,
                role,
                branch_id,
                created_at,
                branches (
                    name,
                    branch_code
                )
            `);

        if (error) throw error;

        return data.map((p: any) => ({
            user_id: p.id,
            username: p.username,
            full_name: p.full_name,
            email: p.email,
            role: p.role,
            branch_id: p.branch_id,
            branch_name: p.branches?.name || null,
            branch_code: p.branches?.branch_code || null,
            created_at: p.created_at,
            is_active: true
        }));
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        return [];
    }
}

export async function createEmployee(data: {
    username: string;
    fullName: string;
    role: string;
    pin: string;
    branchId: number;
}) {
    try {
        // 1. Create Auth User (using fresh client to avoid global session side-effects)
        const tempClient = createSupabaseClient(CENTRAL_URL, CENTRAL_KEY);
        // Sanitize username: lowercase, remove spaces/special chars
        const safeUsername = data.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `${safeUsername}@pos-system.com`; // Changed from .local to .com for validation
        const password = `${data.pin}pos123`; // Simple default password strategy

        const { data: authData, error: authError } = await tempClient.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        // 2. Insert Profile
        // Note: Using centralClient (global) might fail if RLS requires "own" user.
        // But since we just signed up, maybe we use tempClient?
        // Actually, 'profiles' usually allows insert if id matches auth.uid().
        // So we MUST use the client that is logged in (tempClient).

        const { error: profileError } = await tempClient
            .from('profiles')
            .insert([{
                id: authData.user.id,
                username: data.username,
                full_name: data.fullName,
                email: email,
                role: data.role,
                branch_id: data.branchId > 0 ? data.branchId : null, // Handle 0 or null
                pin: data.pin
            }]);

        if (profileError) throw profileError;

        return { success: true };
    } catch (error: any) {
        console.error('Failed to create employee:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteEmployee(userId: string) {
    try {
        // Only delete from profiles. Auth user remains but is orphaned/disabled effectively.
        // (Deleting auth user requires Service Role key which we might not have in env)
        const { error } = await centralClient
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete employee:', error);
        return { success: false, error: error.message };
    }
}

// ============ REPORTS ============
export async function exportDailySalesReport(date: string) {
    const reportData: any[] = [];
    try {
        await Promise.all(stores.map(async (store) => {
            const { data } = await store.client
                .from('transactions')
                .select(`
                    transaction_uuid,
                    created_at,
                    grand_total,
                    payment_method,
                    user_id
                `)
                .gte('created_at', `${date}T00:00:00`)
                .lte('created_at', `${date}T23:59:59`);

            if (data) {
                data.forEach(t => {
                    reportData.push({
                        Tanggal: t.created_at.split('T')[0],
                        Waktu: t.created_at.split('T')[1].slice(0, 8),
                        Cabang: store.name,
                        Total: t.grand_total,
                        Metode: t.payment_method,
                        Kasir_ID: t.user_id,
                        No_Struk: t.transaction_uuid
                    });
                });
            }
        }));
        return reportData.sort((a, b) => a.Waktu.localeCompare(b.Waktu));
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function exportTransactionReport(startDate: string, endDate: string) {
    const reportData: any[] = [];
    try {
        await Promise.all(stores.map(async (store) => {
            const { data } = await store.client
                .from('transactions')
                .select('*')
                .gte('created_at', `${startDate}T00:00:00`)
                .lte('created_at', `${endDate}T23:59:59`);

            if (data) {
                data.forEach(t => {
                    reportData.push({
                        Tanggal: new Date(t.created_at).toLocaleString('id-ID'),
                        Cabang: store.name,
                        Struk: t.transaction_uuid,
                        Total: t.grand_total,
                        Bayar: t.payment_method,
                    });
                });
            }
        }));
        return reportData.sort((a, b) => new Date(b.Tanggal).getTime() - new Date(a.Tanggal).getTime());
    } catch (e) {
        return [];
    }
}

export async function exportInventoryReport() {
    try {
        const { data } = await centralClient.from('products').select('*');
        return data?.map(p => ({
            Barcode: p.barcode,
            Nama: p.name,
            Kategori: p.category,
            Harga: p.price,
            Stock: 100,
            Status: p.is_active ? 'Aktif' : 'Non-aktif'
        })) || [];
    } catch (e) {
        return [];
    }
}

export async function exportMonthlyReport(year: number, month: number) {
    return [];
}

// ============ SYSTEM HEALTH RESOURCES (New) ============
export async function getSystemResources() {
    // Mock data for distributed cloud environment
    return {
        cpu: {
            usage: Math.floor(Math.random() * 30) + 10,
            cores: 8,
            model: 'Distributed Virtual CPU'
        },
        memory: {
            total: 16 * 1024 * 1024 * 1024,
            used: 4 * 1024 * 1024 * 1024,
            free: 12 * 1024 * 1024 * 1024,
            usagePercent: 25
        },
        uptime: '99.9%',
        platform: 'Linux (Container)',
        hostname: 'admin-dashboard-v1',
        loadAvg: [0.5, 0.4, 0.3]
    };
}


// ============ STATS ============
export async function getAdminStats() {
    return getStatsFiltered(undefined);
}

export async function getStatsFiltered(branchId?: number) {
    let revenue = 0;
    let transactions = 0;
    let products = 0;
    let avg_transaction = 0;

    try {
        const clients = getClients(branchId);

        // 1. Aggregate Sales
        const results = await Promise.all(clients.map(async (store) => {
            const { data: trxData, error: trxError } = await store.client
                .from('transactions')
                .select('grand_total');

            if (trxError) throw trxError;

            const storeRevenue = trxData?.reduce((acc, curr) => acc + (curr.grand_total || 0), 0) || 0;
            const storeTrxC = trxData?.length || 0;

            return { revenue: storeRevenue, transactions: storeTrxC };
        }));

        results.forEach(res => {
            revenue += res.revenue;
            transactions += res.transactions;
        });

        if (transactions > 0) avg_transaction = revenue / transactions;

        // 2. Count Products (Always Global)
        const { count: prodCount } = await centralClient
            .from('products')
            .select('*', { count: 'exact', head: true });
        products = prodCount || 0;

        return { revenue, transactions, avg_transaction, products };
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return { revenue: 0, transactions: 0, avg_transaction: 0, products: 0 };
    }
}

// ============ CHARTS (Monthly Sales 12 Months) ============
export async function getMonthlySalesData() {
    try {
        const months: Record<string, { total: number, count: number, label: string }> = {};

        // Init last 12 months
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toISOString().slice(0, 7); // YYYY-MM
            const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
            months[key] = { total: 0, count: 0, label };
        }

        await Promise.all(stores.map(async (store) => {
            const { data } = await store.client
                .from('transactions')
                .select('created_at, grand_total')
                .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString()); // approx

            data?.forEach(t => {
                const key = t.created_at.slice(0, 7);
                if (months[key]) {
                    months[key].total += (t.grand_total || 0);
                    months[key].count += 1;
                }
            });
        }));

        return Object.values(months).map(m => ({
            month: m.label,
            month_label: m.label,
            total: m.total,
            trx_count: m.count
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
}

// ============ CHARTS (Daily Sales 7 Days) ============
export async function getSalesChartFiltered(branchId?: number) {
    try {
        const clients = getClients(branchId);
        const days: Record<string, number> = {};

        // Init last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
            days[key] = 0;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        await Promise.all(clients.map(async (store) => {
            const { data } = await store.client
                .from('transactions')
                .select('created_at, grand_total')
                .gte('created_at', startDate.toISOString());

            data?.forEach(t => {
                const key = t.created_at.slice(0, 10);
                if (days[key] !== undefined) {
                    days[key] += (t.grand_total || 0);
                }
            });
        }));

        return Object.entries(days).map(([date, total]) => ({
            name: date,
            total
        }));
    } catch (e) {
        return [];
    }
}

// ============ BRANCH PERFORMANCE ============
export async function getBranchPerformance() {
    try {
        const results = await Promise.all(stores.map(async (store) => {
            const { data } = await store.client.from('transactions').select('grand_total');
            const total = data?.reduce((acc, curr) => acc + (curr.grand_total || 0), 0) || 0;
            const count = data?.length || 0;
            return {
                branch_name: store.name,
                total_revenue: total,
                transaction_count: count
            };
        }));
        return results;
    } catch (e) {
        return [];
    }
}

// ============ LIFETIME STATS ============
export async function getLifetimeStats() {
    const s = await getAdminStats();
    return {
        total_revenue: s.revenue,
        total_transactions: s.transactions
    };
}

// ============ TOP PRODUCTS ============
export async function getTopProducts(branchId?: number, limit: number = 10) {
    try {
        const clients = getClients(branchId);
        const productsMap: Record<string, number> = {};

        await Promise.all(clients.map(async (store) => {
            const { data } = await store.client
                .from('transaction_items')
                .select(`
                    qty,
                    products!inner(name)
                `)
                .order('created_at', { ascending: false })
                .limit(500);

            data?.forEach((item: any) => {
                const name = item.products?.name || 'Unknown';
                productsMap[name] = (productsMap[name] || 0) + (item.qty || 0);
            });
        }));

        return Object.entries(productsMap)
            .map(([name, qty]) => ({ product_name: name, total_qty: qty }))
            .sort((a, b) => b.total_qty - a.total_qty)
            .slice(0, limit);
    } catch (e) {
        console.error(e);
        return [];
    }
}

// ============ CATEGORY SALES ============
export async function getCategorySales(branchId?: number) {
    try {
        const clients = getClients(branchId);
        const catsMap: Record<string, number> = {};

        await Promise.all(clients.map(async (store) => {
            const { data } = await store.client
                .from('transaction_items')
                .select(`
                    subtotal,
                    products!inner(category)
                `)
                .limit(1000);

            data?.forEach((item: any) => {
                const cat = item.products?.category || 'UNCATEGORIZED';
                catsMap[cat] = (catsMap[cat] || 0) + (item.subtotal || 0);
            });
        }));

        return Object.entries(catsMap)
            .map(([cat, total]) => ({ category: cat, total_revenue: total }))
            .sort((a, b) => b.total_revenue - a.total_revenue);
    } catch (e) {
        return [];
    }
}

// ============ PAYMENT METHOD STATS ============
export async function getPaymentMethodStats(branchId?: number) {
    const clients = getClients(branchId);
    const methods: Record<string, { total: number, count: number }> = {};

    try {
        await Promise.all(clients.map(async (store) => {
            const { data } = await store.client.from('transactions').select('payment_method, grand_total');
            data?.forEach(t => {
                const pm = t.payment_method || 'CASH';
                if (!methods[pm]) methods[pm] = { total: 0, count: 0 };
                methods[pm].total += (t.grand_total || 0);
                methods[pm].count += 1;
            });
        }));

        return Object.entries(methods).map(([method, stats]) => ({
            payment_method: method,
            total_revenue: stats.total,
            trx_count: stats.count
        }));
    } catch {
        return [];
    }
}

// ============ HOURLY SALES ============
export async function getHourlySalesPattern(branchId?: number) {
    try {
        const clients = getClients(branchId);
        const hours: Record<number, number> = {};

        // Initialize 0-23
        for (let i = 0; i < 24; i++) hours[i] = 0;

        await Promise.all(clients.map(async (store) => {
            const { data } = await store.client
                .from('transactions')
                .select('created_at, grand_total')
                .limit(2000);

            data?.forEach(t => {
                const h = new Date(t.created_at).getHours();
                hours[h] += (t.grand_total || 0);
            });
        }));

        return Object.entries(hours).map(([h, total]) => ({
            hour: parseInt(h),
            total_revenue: total
        }));
    } catch {
        return [];
    }
}

// ============ INVENTORY SUMMARY ============
export async function getInventorySummary(branchId?: number) {
    try {
        // Fetch All products from Central
        const { data } = await centralClient.from('products').select('category, is_active');

        const summary: Record<string, { total: number, active: number }> = {};

        data?.forEach(p => {
            const cat = p.category || 'Uncategorized';
            if (!summary[cat]) summary[cat] = { total: 0, active: 0 };
            summary[cat].total += 1;
            if (p.is_active) summary[cat].active += 1;
        });

        return Object.entries(summary).map(([cat, s]) => ({
            category: cat,
            product_count: s.total,
            active_count: s.active
        }));
    } catch {
        return [];
    }
}


// ============ LEGACY EXPORTS (Refactored) ============
export async function getGlobalTransactions(limit: number = 100) {
    try {
        const allTrx: any[] = [];
        await Promise.all(stores.map(async (store) => {
            const { data, error } = await store.client
                .from('transactions')
                .select(`
                    transaction_uuid,
                    created_at,
                    grand_total,
                    payment_method,
                    branch_id,
                    user_id
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (data) {
                const enriched = data.map(t => ({
                    ...t,
                    trx_date_local: t.created_at,
                    total_amount: t.grand_total,
                    branch_name: store.name,
                    synced: true
                }));
                allTrx.push(...enriched);
            }
        }));
        allTrx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return allTrx.slice(0, limit);
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return [];
    }
}

export async function getTransactionDetails(transactionUuid: string) {
    for (const store of stores) {
        const { data } = await store.client
            .from('transaction_items')
            .select(`
                qty,
                price_at_sale,
                subtotal,
                products (
                    name,
                    category
                )
            `)
            .eq('transaction_uuid', transactionUuid);

        if (data && data.length > 0) {
            return data.map((item: any) => ({
                qty: item.qty,
                price_at_sale: item.price_at_sale,
                subtotal: item.subtotal,
                product_name: item.products?.name || 'Unknown',
                category: item.products?.category || 'Uncategorized'
            }));
        }
    }
    return [];
}


export async function getAllBranches() {
    return stores.map((s, idx) => ({
        branch_id: idx + 1,
        branch_code: s.id,
        branch_name: s.name,
        region_name: 'Distributed',
        is_active: 1
    }));
}

export async function getGlobalProducts() {
    try {
        const { data } = await centralClient.from('products').select('*').order('name');
        return data || [];
    } catch (error) {
        console.error('Failed to fetch global products:', error);
        return [];
    }
}
