'use server';

import { createClient } from '@supabase/supabase-js';
import type { Product, Transaction } from '@/types';

// ==========================================
// DYNAMIC CLIENT FACTORY
// ==========================================
function getStoreClient(branchId: string | number) {
    const bId = String(branchId);

    // Store A: JKT-001 (ID: 101)
    if (bId === '101') {
        const url = process.env.NEXT_PUBLIC_STORE_JKT_URL;
        const key = process.env.NEXT_PUBLIC_STORE_JKT_KEY;
        if (!url || !key) throw new Error('Konfigurasi Store JKT tidak ditemukan di .env');
        return createClient(url, key);
    }

    // Store B: BDG-001 (ID: 102)
    if (bId === '102') {
        const url = process.env.NEXT_PUBLIC_STORE_BDG_URL;
        const key = process.env.NEXT_PUBLIC_STORE_BDG_KEY;
        if (!url || !key) throw new Error('Konfigurasi Store BDG tidak ditemukan di .env');
        return createClient(url, key);
    }

    throw new Error(`Branch ID ${bId} tidak dikenali atau tidak memiliki konfigurasi database.`);
}

// ==========================================
// ACTIONS
// ==========================================

export async function getProductsAction(branchId: string): Promise<Product[]> {
    try {
        const supabase = getStoreClient(branchId);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        console.log(`[getProductsAction] Branch ${branchId}: Found ${data?.length || 0} products`);
        return data || [];
    } catch (error) {
        console.error(`Error fetching products for branch ${branchId}:`, error);
        return [];
    }
}

export async function searchProductsAction(query: string, branchId: string): Promise<Product[]> {
    try {
        const supabase = getStoreClient(branchId);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .or(`name.ilike.%${query}%,barcode.ilike.%${query}%`)
            .limit(20);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error(`Error searching products for branch ${branchId}:`, error);
        return [];
    }
}

export async function saveTransactionAction(transaction: Transaction): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getStoreClient(transaction.branch_id);

        // 1. Insert Transaction Header
        const { error: headerError } = await supabase
            .from('transactions')
            .insert({
                transaction_uuid: transaction.transaction_uuid,
                branch_id: parseInt(String(transaction.branch_id)),
                user_id: transaction.user_id,
                subtotal: transaction.subtotal,
                total_discount: transaction.total_discount,
                tax_amount: transaction.tax_amount,
                grand_total: transaction.grand_total,
                payment_method: transaction.payment_method,
                cash_received: transaction.cash_received || 0,
                change_returned: transaction.change_returned || 0,
                created_at: transaction.created_at
            });

        if (headerError) throw headerError;

        // 2. Insert Transaction Items
        const itemsPayload = transaction.items.map(item => ({
            transaction_uuid: transaction.transaction_uuid,
            product_id: item.product_id,
            qty: item.qty,
            price_at_sale: item.price,
            subtotal: item.subtotal,
            notes: ''
        }));

        const { error: itemsError } = await supabase
            .from('transaction_items')
            .insert(itemsPayload);

        if (itemsError) throw itemsError;

        return { success: true };
    } catch (error: any) {
        console.error(`Error saving transaction:`, error);
        return { success: false, error: 'Gagal menyimpan transaksi ke database toko. Pastikan koneksi aman.' };
    }
}

export async function getTodayTransactionsAction(branchId: string): Promise<any[]> {
    try {
        const supabase = getStoreClient(branchId);
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error(`Error fetching transactions:`, error);
        return [];
    }
}

export async function getTransactionItemsAction(transactionUuid: string, branchId: string): Promise<any[]> {
    try {
        const supabase = getStoreClient(branchId);
        const { data, error } = await supabase
            .from('transaction_items')
            .select(`
                product_id,
                qty,
                price_at_sale,
                subtotal,
                products (
                    name
                )
            `)
            .eq('transaction_uuid', transactionUuid);

        if (error) throw error;

        return data.map((item: any) => ({
            product_id: item.product_id,
            product_name: item.products?.name || 'Unknown',
            qty: item.qty,
            price_at_sale: item.price_at_sale,
            subtotal: item.subtotal
        }));
    } catch (error) {
        console.error(`Error fetching transaction items:`, error);
        return [];
    }
}

export async function verifyAdminPinAction(pin: string): Promise<{ success: boolean; error?: string }> {
    if (pin === '123456') return { success: true };
    return { success: false, error: 'PIN Invalid' };
}

export async function getInventoryWithStockAction(branchId: string): Promise<any[]> {
    try {
        const supabase = getStoreClient(branchId);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name');

        if (error) throw error;

        return data.map(p => ({
            ...p,
            qty_on_hand: p.stock || 0
        }));
    } catch (error) {
        console.error(`Error fetching inventory:`, error);
        return [];
    }
}

export async function updateProductStockAction(productId: number, newQty: number, branchId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getStoreClient(branchId);
        const { error } = await supabase
            .from('products')
            .update({ stock: newQty })
            .eq('product_id', productId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error(`Error updating stock:`, error);
        return { success: false, error: 'Gagal update stock' };
    }
}

export async function getTodayStatsSummaryAction(branchId: string): Promise<any> {
    try {
        const supabase = getStoreClient(branchId);
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('transactions')
            .select('grand_total')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);

        if (error) throw error;

        const totalTransactions = data.length;
        const totalRevenue = data.reduce((sum, t) => sum + t.grand_total, 0);
        const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        return {
            total_transactions: totalTransactions,
            total_revenue: totalRevenue,
            total_items_sold: 0,
            avg_transaction: avgTransaction
        };
    } catch (error) {
        console.error(`Error stats:`, error);
        return { total_transactions: 0, total_revenue: 0, total_items_sold: 0, avg_transaction: 0 };
    }
}
