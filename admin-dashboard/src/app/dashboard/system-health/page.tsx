'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Activity,
    Server,
    Database,
    Cloud,
    Cpu,
    HardDrive,
    AlertTriangle,
    RefreshCw,
    Users,
    Shield,
    Lock,
    Network,
    Zap,
    Layers,
    Clock,
    CheckCircle,
    Monitor,
    Wifi,
    WifiOff,
    UploadCloud
} from 'lucide-react';
import { getSystemHealth } from './actions';
import { getSystemResources } from '../actions';
import { motion } from 'framer-motion';

interface ServerResources {
    cpu: { usage: number; cores: number; model: string };
    memory: { total: number; used: number; free: number; usagePercent: number };
    uptime: string;
    platform: string;
    hostname: string;
    loadAvg: number[];
}

export default function SystemHealthPage() {
    const [health, setHealth] = useState<any>(null);
    const [serverRes, setServerRes] = useState<ServerResources | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [data, resources] = await Promise.all([
                getSystemHealth(),
                getSystemResources()
            ]);
            setHealth(data);
            setServerRes(resources);
        } catch (error) {
            console.error('Failed to fetch health:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Auto refresh every 10s for real-time feel
        return () => clearInterval(interval);
    }, []);

    const formatBytes = (bytes: number) => {
        const gb = bytes / (1024 * 1024 * 1024);
        return `${gb.toFixed(1)} GB`;
    };

    if (loading && !health) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <RefreshCw className="h-12 w-12 animate-spin text-orange-600" />
                <p className="text-lg font-medium text-neutral-600">Connecting to Distributed Network...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-neutral-50/50 min-h-screen">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">System Infrastructure Health</h2>
                    <p className="text-neutral-500">Real-time monitoring of Central HQ & Distributed Stores</p>
                </div>
                <Button onClick={fetchData} disabled={loading} variant="outline" className="border-orange-200 hover:bg-orange-50 text-orange-700">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Diagnostics
                </Button>
            </div>

            {/* Server Resources */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="border-none shadow-md overflow-hidden ring-1 ring-neutral-200">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
                    <CardHeader className="bg-white border-b border-neutral-100 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <Monitor className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Admin Server Container</CardTitle>
                                    <CardDescription>Host: {serverRes?.hostname || 'localhost'} • {serverRes?.platform || 'Unknown'}</CardDescription>
                                </div>
                            </div>
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 px-4 py-1">
                                RUNNING
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><Cpu className="h-4 w-4" /> CPU Usage</span>
                                    <span>{serverRes?.cpu?.usage || 0}%</span>
                                </div>
                                <Progress value={serverRes?.cpu?.usage || 0} className="h-2" />
                                <p className="text-xs text-neutral-400">{serverRes?.cpu?.cores || 0} cores • {serverRes?.cpu?.model?.split('@')[0] || 'Unknown CPU'}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> RAM Usage</span>
                                    <span>{serverRes?.memory?.usagePercent || 0}%</span>
                                </div>
                                <Progress value={serverRes?.memory?.usagePercent || 0} className="h-2" />
                                <p className="text-xs text-neutral-400">{formatBytes(serverRes?.memory?.used || 0)} / {formatBytes(serverRes?.memory?.total || 0)}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Server Uptime</span>
                                </div>
                                <p className="text-2xl font-bold text-emerald-600">{serverRes?.uptime || 'N/A'}</p>
                                <p className="text-xs text-neutral-400">Load Avg: {serverRes?.loadAvg?.map(l => l.toFixed(2)).join(' • ') || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Central HQ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <Card className="border-none shadow-md overflow-hidden ring-1 ring-neutral-200">
                    <div className="h-1 bg-gradient-to-r from-blue-600 to-cyan-500" />
                    <CardHeader className="bg-white border-b border-neutral-100 pb-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Cloud className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Central HQ (Supabase)</CardTitle>
                                    <CardDescription>Primary Data Center • Master Products & Consolidated Sales</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right hidden md:block">
                                    <p className="text-xs text-neutral-400 font-mono">LATENCY: {health?.central?.latency || 0}ms</p>
                                </div>
                                <Badge variant={health?.central?.status === 'online' ? 'default' : 'destructive'} className="bg-blue-600 hover:bg-blue-700 px-4 py-1">
                                    {health?.central?.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard icon={<Database className="h-4 w-4" />} label="Master Products" value={health?.central?.metrics?.product_count || 0} subtext="Global Catalog items" />
                            <MetricCard icon={<Layers className="h-4 w-4" />} label="Total Transactions" value={health?.central?.metrics?.transaction_count || 0} subtext="Consolidated from branches" />
                            <MetricCard icon={<Shield className="h-4 w-4" />} label="Identity Users" value={health?.identity?.active_users || 0} subtext="Registered Accounts" />
                            <MetricCard icon={<Activity className="h-4 w-4" />} label="ID Service Latency" value={`${health?.identity?.latency || 0}ms`} alert={(health?.identity?.latency || 0) > 200} />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Distributed Nodes */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <h3 className="text-lg font-semibold text-neutral-700 mb-3 ml-1">Distributed Store Nodes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {health?.stores?.map((store: any) => (
                        <Card key={store.id} className="border-none shadow-sm ring-1 ring-neutral-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${store.status === 'online' ? 'bg-indigo-50' : 'bg-red-50'}`}>
                                            <StoreNodeIcon className={`h-5 w-5 ${store.status === 'online' ? 'text-indigo-600' : 'text-red-500'}`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{store.name}</CardTitle>
                                            <CardDescription className="text-xs font-mono">{store.id}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={store.status === 'online' ? 'outline' : 'destructive'} className={`${store.status === 'online' ? 'text-indigo-700 border-indigo-200 bg-indigo-50' : ''}`}>
                                        {store.status === 'online' ? 'CONNECTED' : 'UNREACHABLE'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-xs text-neutral-500 flex items-center gap-1">
                                            {store.status === 'online' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                            Latency
                                        </div>
                                        <p className="font-mono font-medium">{store.latency}ms</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-neutral-500 flex items-center gap-1">
                                            <UploadCloud className="h-3 w-3" />
                                            Pending Uploads
                                        </div>
                                        <p className={`font-mono font-medium ${store.pending_upload > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {store.pending_upload || 0} Trx
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </motion.div>

            {/* Sync Queue Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <Card className="border-none shadow-md overflow-hidden ring-1 ring-neutral-200">
                    <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                    <CardHeader className="bg-white border-b border-neutral-100 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <RefreshCw className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Cloud Sync Queue</CardTitle>
                                    <CardDescription>Transactions waiting to reach Central HQ</CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <RefreshCw className={`h-5 w-5 text-blue-600 ${health?.sync?.pending > 0 ? 'animate-spin' : ''}`} />
                                    <span className="font-medium text-blue-900">Total Pending</span>
                                </div>
                                <Badge className="bg-blue-600 text-white text-lg px-3 py-1">{health?.sync?.pending || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <span className="font-medium text-red-900">Failed Retry</span>
                                </div>
                                <Badge variant="destructive" className="text-lg px-3 py-1">{health?.sync?.failed || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-green-900">Synced Today</span>
                                </div>
                                <Badge variant="outline" className="bg-white text-green-700 border-green-200 text-lg px-3 py-1">{health?.sync?.completed || 0}</Badge>
                            </div>
                        </div>
                        {health?.sync?.last_sync && (
                            <div className="mt-4 text-center text-sm text-neutral-500">
                                <Clock className="inline h-4 w-4 mr-1" />
                                Last sync check: {new Date(health.sync.last_sync).toLocaleString('id-ID')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

function MetricCard({ icon, label, value, subtext, alert }: { icon: React.ReactNode, label: string, value: string | number, subtext?: string, alert?: boolean }) {
    return (
        <div className={`p-4 rounded-xl border flex flex-col justify-between h-full transition-all hover:shadow-sm ${alert ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-100'}`}>
            <div className="flex items-start justify-between mb-2">
                <div className={`${alert ? 'text-red-500' : 'text-neutral-400'}`}>{icon}</div>
                {alert && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
            </div>
            <div>
                <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${alert ? 'text-red-600' : 'text-neutral-500'}`}>{label}</p>
                <p className={`text-2xl font-bold tracking-tight ${alert ? 'text-red-700' : 'text-neutral-900'}`}>{value || '0'}</p>
                {subtext && <p className="text-[10px] text-neutral-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}

function StoreNodeIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-5" />
            <path d="M9 22v-5" />
            <path d="M2 7h20" />
        </svg>
    )
}
