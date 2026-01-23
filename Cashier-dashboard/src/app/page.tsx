'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Store,
    Database,
    Wifi,
    WifiOff,
    ShoppingCart,
    Clock,
    Zap,
    CheckCircle2,
    Monitor,
    HardDrive,
    MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ConnectionStatus {
    local: boolean;
    cloud: boolean;
    localLatency: number;
    cloudLatency: number;
}

interface Branch {
    id: number;
    code: string;
    name: string;
    region: string;
    address: string;
}

// Available branches - matches database
const BRANCHES: Branch[] = [
    { id: 101, code: 'JKT-001', name: 'Alfamart Jakarta Timur', region: 'JABODETABEK', address: 'Jl. Pemuda No. 1, Rawamangun' },
    { id: 102, code: 'BDG-001', name: 'Alfamart Dago Atas', region: 'JAWA BARAT', address: 'Jl. Ir. H. Juanda No. 88, Bandung' },
];

const STORAGE_KEY = 'alfamart_selected_branch';

export default function CashierLandingPage() {
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>({
        local: true,
        cloud: typeof window !== 'undefined' ? navigator.onLine : true,
        localLatency: 1,
        cloudLatency: 45
    });

    // Branch selection state
    const [selectedBranch, setSelectedBranch] = useState<Branch>(BRANCHES[0]);

    // Load saved branch from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const branchId = parseInt(saved);
            const branch = BRANCHES.find(b => b.id === branchId);
            if (branch) {
                setSelectedBranch(branch);
            }
        }
    }, []);

    // Save branch selection to localStorage
    const handleBranchChange = (branchId: string) => {
        const branch = BRANCHES.find(b => b.id === parseInt(branchId));
        if (branch) {
            setSelectedBranch(branch);
            localStorage.setItem(STORAGE_KEY, branchId);
        }
    };

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const checkStatus = () => {
            setStatus(prev => ({
                ...prev,
                cloud: navigator.onLine
            }));
        };

        window.addEventListener('online', checkStatus);
        window.addEventListener('offline', checkStatus);

        return () => {
            window.removeEventListener('online', checkStatus);
            window.removeEventListener('offline', checkStatus);
        };
    }, []);

    const formatTime = (date: Date | null) => {
        if (!date) return '00:00:00';
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Loading...';
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Navigate to login with branch info stored
    const handleStartTransaction = () => {
        // Store branch info for POS page to use
        localStorage.setItem(STORAGE_KEY, String(selectedBranch.id));
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Store className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-neutral-900">Alfamart POS</h1>
                            <p className="text-xs text-neutral-500">Point of Sale Terminal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Connection Status */}
                        <div className="flex items-center gap-4">
                            <StatusIndicator
                                label="Local DB"
                                status={status.local}
                                latency={status.localLatency}
                                icon={HardDrive}
                            />
                            <StatusIndicator
                                label="Cloud Sync"
                                status={status.cloud}
                                latency={status.cloudLatency}
                                icon={status.cloud ? Wifi : WifiOff}
                            />
                        </div>

                        {/* Time Display */}
                        <div className="text-right border-l pl-6 border-neutral-200">
                            <div className="text-2xl font-bold text-neutral-900 tabular-nums">
                                {formatTime(currentTime)}
                            </div>
                            <div className="text-xs text-neutral-500">{formatDate(currentTime)}</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-6 py-12 flex items-center">
                <div className="grid lg:grid-cols-2 gap-12 w-full items-center">
                    {/* Left Side - Store Info & Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        {/* Store Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                            <Monitor className="h-4 w-4" />
                            Terminal Kasir Aktif
                        </div>

                        {/* Store Title */}
                        <div className="space-y-4">
                            <h2 className="text-5xl font-extrabold text-neutral-900 leading-tight">
                                Selamat Datang di
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                                    {selectedBranch.name}
                                </span>
                            </h2>
                            <p className="text-lg text-neutral-600 max-w-md">
                                Sistem kasir dengan sinkronisasi data otomatis. Transaksi tetap berjalan meski koneksi internet terputus.
                            </p>
                        </div>

                        {/* Branch Selector Card */}
                        <Card className="bg-white/90 backdrop-blur border-2 border-orange-200 shadow-xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-orange-600" />
                                    Pilih Cabang
                                </CardTitle>
                                <CardDescription>
                                    Semua transaksi akan disimpan untuk cabang ini
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Select value={String(selectedBranch.id)} onValueChange={handleBranchChange}>
                                    <SelectTrigger className="w-full h-12 text-base">
                                        <SelectValue placeholder="Pilih cabang..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BRANCHES.map((branch) => (
                                            <SelectItem key={branch.id} value={String(branch.id)}>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs font-bold">
                                                        {branch.code}
                                                    </Badge>
                                                    <span>{branch.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Selected Branch Info */}
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                            <Store className="h-6 w-6 text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs font-bold bg-orange-100 text-orange-700 border-orange-200">
                                                    {selectedBranch.code}
                                                </Badge>
                                                <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                                    {selectedBranch.region}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-neutral-600">{selectedBranch.address}</p>
                                            <p className="text-xs text-neutral-400 mt-1">Branch ID: {selectedBranch.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                size="lg"
                                onClick={handleStartTransaction}
                                className="h-16 px-8 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl shadow-xl shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <ShoppingCart className="mr-3 h-6 w-6" />
                                Mulai Transaksi
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => router.push('/pos/transactions')}
                                className="h-16 px-8 text-lg font-semibold border-2 border-neutral-200 hover:bg-neutral-50 rounded-2xl"
                            >
                                <Clock className="mr-3 h-5 w-5" />
                                Riwayat Hari Ini
                            </Button>
                        </div>
                    </motion.div>

                    {/* Right Side - System Status Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Card className="bg-white/80 backdrop-blur-xl border-neutral-200/50 shadow-2xl shadow-neutral-200/50 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-6">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <Zap className="h-6 w-6 text-yellow-400" />
                                    Status Sistem
                                </CardTitle>
                                <CardDescription className="text-neutral-300">
                                    Monitoring real-time koneksi database
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-neutral-100">
                                    <SystemStatusRow
                                        icon={Database}
                                        label="Database Master"
                                        status={status.local}
                                        detail={`Latency: ${status.localLatency}ms`}
                                        statusText={status.local ? 'TERHUBUNG' : 'OFFLINE'}
                                    />
                                    <SystemStatusRow
                                        icon={Wifi}
                                        label="Database JKT-001"
                                        status={status.cloud}
                                        detail={status.cloud ? `Latency: ${status.cloudLatency}ms` : 'Koneksi Terputus'}
                                        statusText={status.cloud ? 'ONLINE' : 'OFFLINE'}
                                    />
                                    <div className="p-5 bg-neutral-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-neutral-900">Mode Offline Aktif</p>
                                                <p className="text-sm text-neutral-500">Data akan tersimpan lokal dan sync otomatis</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <QuickStatCard
                                label="Hari Ini"
                                value="Rp 0"
                                subtext="Total Penjualan"
                                gradient="from-green-500 to-emerald-600"
                            />
                            <QuickStatCard
                                label="Transaksi"
                                value="0"
                                subtext="Total Hari Ini"
                                gradient="from-blue-500 to-indigo-600"
                            />
                            <QuickStatCard
                                label="Antrian"
                                value="0"
                                subtext="Belum Sync"
                                gradient="from-orange-500 to-red-600"
                            />
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white/50 border-t border-neutral-200/50 py-4">
                <div className="container mx-auto px-6 flex items-center justify-between text-sm text-neutral-500">
                    <div>© 2024 Alfamart Retail System - POS Terminal v1.0</div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Sistem Berjalan Normal • {selectedBranch.code}
                    </div>
                </div>
            </footer>
        </div>
    );
}

function StatusIndicator({
    label,
    status,
    latency,
    icon: Icon
}: {
    label: string;
    status: boolean;
    latency: number;
    icon: React.ElementType;
}) {
    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                status ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            )}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
                <p className="text-xs font-medium text-neutral-700">{label}</p>
                <p className={cn(
                    "text-xs",
                    status ? "text-green-600" : "text-red-600"
                )}>
                    {status ? `${latency}ms` : 'Offline'}
                </p>
            </div>
        </div>
    );
}

function SystemStatusRow({
    icon: Icon,
    label,
    status,
    detail,
    statusText
}: {
    icon: React.ElementType;
    label: string;
    status: boolean;
    detail: string;
    statusText: string;
}) {
    return (
        <div className="flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    status ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="font-semibold text-neutral-900">{label}</p>
                    <p className="text-sm text-neutral-500">{detail}</p>
                </div>
            </div>
            <Badge
                variant={status ? "default" : "destructive"}
                className={cn(
                    "px-3 py-1 font-bold",
                    status ? "bg-green-500 hover:bg-green-600" : ""
                )}
            >
                {statusText}
            </Badge>
        </div>
    );
}

function QuickStatCard({
    label,
    value,
    subtext,
    gradient
}: {
    label: string;
    value: string;
    subtext: string;
    gradient: string;
}) {
    return (
        <Card className="overflow-hidden border-0 shadow-lg">
            <div className={cn("p-4 bg-gradient-to-br text-white", gradient)}>
                <p className="text-xs font-medium opacity-80">{label}</p>
                <p className="text-xl font-bold mt-1">{value}</p>
                <p className="text-xs opacity-70">{subtext}</p>
            </div>
        </Card>
    );
}
