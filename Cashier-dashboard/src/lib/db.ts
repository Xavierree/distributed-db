import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

// 1. Local Database (PostgreSQL) - Primary for Cashier
export const localDb = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'retail_local_pos',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 2. Cloud Database (Supabase) - Sync Target
// Uses the specific project URL for THIS store.
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to check latency
export async function checkLatency() {
    const results: {
        local: { status: 'online' | 'offline'; latency: number };
        cloud: { status: 'online' | 'offline'; latency: number };
    } = {
        local: { status: 'offline', latency: 0 },
        cloud: { status: 'offline', latency: 0 },
    };

    // Check Local
    const startLocal = performance.now();
    try {
        const client = await localDb.connect();
        await client.query('SELECT 1');
        client.release();
        results.local = { status: 'online', latency: Math.round(performance.now() - startLocal) };
    } catch (e) {
        console.error('Local DB Error:', e);
    }

    // Check Cloud (Supabase)
    const startCloud = performance.now();
    try {
        const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (!error) {
            results.cloud = { status: 'online', latency: Math.round(performance.now() - startCloud) };
        }
    } catch (e) {
        console.error('Cloud DB Error:', e);
    }

    return results;
}

// Helper to determine schema based on branch ID (Keep local schemas for isolation if needed)
export function getSchemaForBranch(branchId: string | number): string {
    // In this "Distributed" version, we might just use 'public' in PG if we run separate PG instances per POS.
    // But keeping this logic is fine for backward compatibility.
    const id = String(branchId);
    switch (id) {
        case '101': return 'retail_jakarta';
        case '102': return 'retail_bandung';
        case '103': return 'retail_surabaya';
        default: return 'retail_jakarta';
    }
}
