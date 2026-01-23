import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration for Distributed Stores
const storeConfigs = [
    {
        id: 'STORE_A',
        name: 'JKT-001',
        url: process.env.NEXT_PUBLIC_STORE_A_URL,
        key: process.env.NEXT_PUBLIC_STORE_A_KEY
    },
    {
        id: 'STORE_B',
        name: 'BDG-001',
        url: process.env.NEXT_PUBLIC_STORE_B_URL,
        key: process.env.NEXT_PUBLIC_STORE_B_KEY
    }
];

// Central HQ DB
const centralConfig = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

// Interface for a Store Connection
export interface StoreConnection {
    id: string;
    name: string;
    client: SupabaseClient;
}

// Create Store Clients
export const stores: StoreConnection[] = storeConfigs
    .filter(cfg => cfg.url && cfg.key)
    .map(cfg => ({
        id: cfg.id,
        name: cfg.name,
        client: createClient(cfg.url!, cfg.key!)
    }));

// Create Central Client (Safe fallback or throw if critical)
export const centralClient: SupabaseClient = createClient(
    centralConfig.url!,
    centralConfig.key!
);

// Helper to check latency for all stores + Central
export async function checkCloudLatency(): Promise<Record<string, { status: string; latency: number }>> {
    const results: Record<string, { status: string; latency: number }> = {};

    // Check Stores
    for (const store of stores) {
        const start = performance.now();
        try {
            const { count, error } = await store.client.from('transactions').select('*', { count: 'exact', head: true });
            if (error) throw error;
            results[store.id] = { status: 'online', latency: Math.round(performance.now() - start) };
        } catch (e) {
            console.error(`Store ${store.id} Error:`, e);
            results[store.id] = { status: 'offline', latency: 0 };
        }
    }

    // Check Central
    const startC = performance.now();
    try {
        const { error } = await centralClient.from('products').select('*', { count: 'exact', head: true });
        results['CENTRAL_HQ'] = { status: error ? 'error' : 'online', latency: Math.round(performance.now() - startC) };
    } catch {
        results['CENTRAL_HQ'] = { status: 'offline', latency: 0 };
    }

    return results;
}
