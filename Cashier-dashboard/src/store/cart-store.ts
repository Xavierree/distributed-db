import { create } from 'zustand';
import type { Product, CartItem, Transaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface CartStore {
    items: CartItem[];
    branchId: number;
    userId: string | null;
    username: string | null;

    // Actions
    addItem: (product: Product) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, qty: number) => void;
    clearCart: () => void;
    setUser: (userId: string, username: string, branchId: number) => void;

    // Computed
    getSubtotal: () => number;
    getTax: () => number;
    getTotal: () => number;
    getItemCount: () => number;

    // Checkout
    prepareTransaction: (paymentMethod: 'CASH' | 'QRIS' | 'DEBIT' | 'CREDIT', cashReceived?: number) => Transaction;
}

// Helper to safely parse price as number
const parsePrice = (price: any): number => {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') return parseFloat(price) || 0;
    return 0;
};

export const useCartStore = create<CartStore>((set, get) => ({
    items: [],
    branchId: 101,
    userId: null,
    username: null,

    addItem: (product: Product) => {
        const price = parsePrice(product.price);
        set((state) => {
            const existingItem = state.items.find(item => item.product_id === product.product_id);
            if (existingItem) {
                return {
                    items: state.items.map(item =>
                        item.product_id === product.product_id
                            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * parsePrice(item.price) }
                            : item
                    )
                };
            }
            return {
                items: [...state.items, { ...product, price, qty: 1, subtotal: price }]
            };
        });
    },

    removeItem: (productId: number) => {
        set((state) => ({
            items: state.items.filter(item => item.product_id !== productId)
        }));
    },

    updateQuantity: (productId: number, qty: number) => {
        if (qty <= 0) {
            get().removeItem(productId);
            return;
        }
        set((state) => ({
            items: state.items.map(item =>
                item.product_id === productId
                    ? { ...item, qty, subtotal: qty * parsePrice(item.price) }
                    : item
            )
        }));
    },

    clearCart: () => set({ items: [] }),

    setUser: (userId: string, username: string, branchId: number) => {
        set({ userId, username, branchId });
    },

    getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + parsePrice(item.subtotal), 0);
    },

    getTax: () => {
        // 11% PPN
        return Math.round(get().getSubtotal() * 0.11);
    },

    getTotal: () => {
        return get().getSubtotal() + get().getTax();
    },

    getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.qty, 0);
    },

    prepareTransaction: (paymentMethod, cashReceived): Transaction => {
        const state = get();
        const subtotal = state.getSubtotal();
        const tax = state.getTax();
        const total = state.getTotal();

        return {
            transaction_uuid: uuidv4(),
            branch_id: state.branchId,
            shift_id: null,
            user_id: state.userId,
            username: state.username || undefined,
            subtotal,
            total_discount: 0,
            tax_amount: tax,
            grand_total: total,
            payment_method: paymentMethod,
            cash_received: cashReceived || total,
            change_returned: (cashReceived || total) - total,
            items: state.items,
            created_at: new Date().toISOString(),
            synced: false
        };
    }
}));
