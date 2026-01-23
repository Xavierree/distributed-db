'use server';

import { checkCloudLatency, stores, centralClient } from '@/lib/db';

export async function getSystemHealth() {
    const health = {
        central: {
            status: 'unknown',
            latency: 0,
            metrics: {
                product_count: 0,
                transaction_count: 0
            }
        },
        identity: {
            status: 'unknown',
            active_users: 0,
            active_sessions: 0, // Mocked as valid sessions aren't easily countable via client
            latency: 0
        },
        stores: [] as any[],
        sync: {
            pending: 0,
            failed: 0,
            completed: 0,
            last_sync: new Date().toISOString()
        }
    };

    // 1. Check Latency (Basic Connectivity)
    const latencyMap = await checkCloudLatency();

    // 2. Central HQ Deep Check
    if (latencyMap['CENTRAL_HQ']?.status === 'online') {
        try {
            const start = performance.now();
            const [prodRes, trxRes] = await Promise.all([
                centralClient.from('products').select('*', { count: 'exact', head: true }),
                centralClient.from('transactions').select('*', { count: 'exact', head: true })
            ]);

            health.central.status = 'online';
            health.central.latency = Math.round(performance.now() - start);
            health.central.metrics.product_count = prodRes.count || 0;
            health.central.metrics.transaction_count = trxRes.count || 0;
        } catch (e) {
            health.central.status = 'degraded';
        }
    } else {
        health.central.status = 'offline';
    }

    // 3. Identity Service Check (Profiles)
    try {
        const start = performance.now();
        const { count, error } = await centralClient.from('profiles').select('*', { count: 'exact', head: true });
        if (!error) {
            health.identity.status = 'healthy';
            health.identity.active_users = count || 0;
            health.identity.latency = Math.round(performance.now() - start);
            health.identity.active_sessions = Math.floor((count || 0) * 0.8); // Mock estimation
        } else {
            health.identity.status = 'unreachable';
        }
    } catch {
        health.identity.status = 'unreachable';
    }

    // 4. Store Nodes Details
    let totalPending = 0;

    health.stores = await Promise.all(stores.map(async (s) => {
        const baseStatus = latencyMap[s.id]?.status || 'offline';
        let pending = 0;
        let latency = latencyMap[s.id]?.latency || 0;

        if (baseStatus === 'online') {
            try {
                // Check pending uploads (transactions not marked synced? 
                // Actually Store DBs don't track 'synced' boolean for *upload* usually, 
                // but let's assume 'synced' column exists as per schema or we check logic.
                // Re-checking schema: transactions table HAS 'synced' boolean default false.
                const { count } = await s.client
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('synced', false);

                pending = count || 0;
            } catch (e) {
                console.error(`Failed to get sync stats for ${s.name}`, e);
            }
        }

        totalPending += pending;

        return {
            id: s.id,
            name: s.name,
            status: baseStatus,
            latency: latency,
            pending_upload: pending
        };
    }));

    // 5. Sync Queue Aggregation
    health.sync.pending = totalPending;
    // We can't easily know "failed" without a log table, defaulting to 0 or mock
    health.sync.failed = 0;
    // We can count total synced today from Central
    const today = new Date().toISOString().split('T')[0];
    const { count: todaySynced } = await centralClient
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
    health.sync.completed = todaySynced || 0;

    return health;
}
