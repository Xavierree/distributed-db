'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DollarSign,
    ShoppingCart,
    Store,
    Package,
    TrendingUp,
    RefreshCw,
    Clock,
    Bell,
    Calendar,
    BarChart3,
    PieChart,
    Filter,
    CreditCard,
    Banknote,
    QrCode,
    Layers,
    Award,
    Activity
} from 'lucide-react';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    getAdminStats,
    getSalesChartFiltered,
    getBranchPerformance,
    getGlobalTransactions,
    getMonthlySalesData,
    getLifetimeStats,
    getAllBranches,
    getStatsFiltered,
    getTopProducts,
    getCategorySales,
    getPaymentMethodStats,
    getHourlySalesPattern,
    getInventorySummary
} from './actions';

interface MonthlySales {
    month: string;
    month_label: string;
    total: number;
    trx_count: number;
}

interface Branch {
    branch_id: number;
    branch_code: string;
    branch_name: string;
    region_name: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    'BEVERAGE': 'bg-blue-500',
    'FOOD': 'bg-orange-500',
    'SNACK': 'bg-yellow-500',
    'STAPLE': 'bg-emerald-500',
    'BAKERY': 'bg-amber-500',
    'CIGARETTE': 'bg-red-500',
    'DAIRY': 'bg-cyan-500',
    'FRESH': 'bg-green-500',
    'PERSONAL_CARE': 'bg-pink-500',
    'HOUSEHOLD': 'bg-purple-500',
    'UNCATEGORIZED': 'bg-slate-500',
};

const PAYMENT_COLORS: Record<string, string> = {
    'CASH': 'bg-emerald-500',
    'QRIS': 'bg-purple-500',
    'DEBIT': 'bg-blue-500',
    'CREDIT': 'bg-orange-500',
};

const PAYMENT_ICONS: Record<string, any> = {
    'CASH': Banknote,
    'QRIS': QrCode,
    'DEBIT': CreditCard,
    'CREDIT': CreditCard,
};

export default function DashboardPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [stats, setStats] = useState({ revenue: 0, transactions: 0, avg_transaction: 0, products: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
    const [branchPerformance, setBranchPerformance] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [categorySales, setCategorySales] = useState<any[]>([]);
    const [paymentStats, setPaymentStats] = useState<any[]>([]);
    const [hourlySales, setHourlySales] = useState<any[]>([]);
    const [inventorySummary, setInventorySummary] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const getBranchId = useCallback(() => {
        return selectedBranch === 'all' ? undefined : parseInt(selectedBranch);
    }, [selectedBranch]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const branchId = getBranchId();
        try {
            const [br, s, c, b, t, m, tp, cs, ps, hs, inv] = await Promise.all([
                getAllBranches(),
                getStatsFiltered(branchId),
                getSalesChartFiltered(branchId),
                getBranchPerformance(),
                getGlobalTransactions(10),
                getMonthlySalesData(),
                getTopProducts(branchId, 10),
                getCategorySales(branchId),
                getPaymentMethodStats(branchId),
                getHourlySalesPattern(branchId),
                getInventorySummary(branchId)
            ]);
            setBranches(br);
            setStats(s);
            setChartData(c);
            setBranchPerformance(b);
            setTransactions(t);
            setMonthlySales(m);
            setTopProducts(tp);
            setCategorySales(cs);
            setPaymentStats(ps);
            setHourlySales(hs);
            setInventorySummary(inv);
            setLastUpdated(new Date());
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data');
        } finally {
            setIsLoading(false);
        }
    }, [getBranchId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleBranchChange = (value: string) => {
        setSelectedBranch(value);
    };

    useEffect(() => {
        if (branches.length > 0) {
            loadData();
        }
    }, [selectedBranch]);

    const selectedBranchName = selectedBranch === 'all'
        ? 'Semua Cabang'
        : branches.find(b => String(b.branch_id) === selectedBranch)?.branch_name || 'Unknown';

    return (
        <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Dashboard Analytics</h2>
                    <p className="text-sm text-muted-foreground">Monitoring performa bisnis real-time • {selectedBranchName}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Branch Filter */}
                    <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-1.5">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={selectedBranch} onValueChange={handleBranchChange}>
                            <SelectTrigger className="w-[180px] border-0 shadow-none focus:ring-0 h-8">
                                <SelectValue placeholder="Pilih Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <div className="flex items-center gap-2">
                                        <Store className="h-4 w-4" />
                                        <span>Semua Cabang</span>
                                    </div>
                                </SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.branch_id} value={String(branch.branch_id)}>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">{branch.branch_code}</Badge>
                                            <span>{branch.branch_name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('id-ID')}` : 'Loading...'}
                    </div>
                    <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats.revenue)}
                    icon={DollarSign}
                    gradient="from-emerald-500 to-teal-600"
                    delay={0}
                />
                <StatCard
                    title="Total Transaksi"
                    value={formatNumber(stats.transactions)}
                    icon={ShoppingCart}
                    gradient="from-blue-500 to-indigo-600"
                    delay={0.1}
                />
                <StatCard
                    title="Rata-rata / Transaksi"
                    value={formatCurrency(stats.avg_transaction)}
                    icon={BarChart3}
                    gradient="from-orange-500 to-amber-600"
                    delay={0.2}
                />
                <StatCard
                    title="Total Produk Aktif"
                    value={formatNumber(stats.products)}
                    icon={Package}
                    gradient="from-purple-500 to-pink-600"
                    delay={0.3}
                />
            </div>

            {/* Row 1: Monthly Chart + Branch Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Monthly Sales Chart */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Calendar className="h-5 w-5 text-primary" />
                            Penjualan 12 Bulan Terakhir
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {monthlySales.length > 0 ? (
                            <div className="h-56 flex items-end gap-1 pb-6 relative">
                                {monthlySales.map((item, idx) => {
                                    const maxVal = Math.max(...monthlySales.map(d => d.total), 1);
                                    const height = (item.total / maxVal) * 100;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap text-xs shadow-lg">
                                                <p className="font-bold">{formatCurrency(item.total)}</p>
                                                <p className="text-slate-300">{item.trx_count} trx</p>
                                            </div>
                                            <div
                                                className="w-full bg-gradient-to-t from-primary to-orange-400 rounded-t transition-all hover:from-primary/80 cursor-pointer"
                                                style={{ height: `${Math.max(height, 3)}%`, minHeight: '6px' }}
                                            />
                                            <span className="text-[9px] text-muted-foreground leading-tight">
                                                {item.month_label.split(' ')[0].slice(0, 3)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-56 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Belum ada data</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Branch Performance */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Store className="h-5 w-5 text-primary" />
                            Performa Cabang
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {branchPerformance.length > 0 ? branchPerformance.map((branch, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs",
                                            idx === 0 ? "bg-yellow-400 text-yellow-900" : "bg-slate-100 text-slate-600"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{branch.branch_name}</p>
                                            <p className="text-xs text-muted-foreground">{branch.transaction_count} trx</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-sm text-emerald-600">{formatCurrency(branch.total_revenue)}</span>
                                </div>
                            )) : (
                                <div className="text-center text-muted-foreground py-6 text-sm">No data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Top Products + Category Sales + Payment Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Top 10 Products */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Award className="h-5 w-5 text-yellow-500" />
                            Top 10 Produk Terlaris
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {topProducts.length > 0 ? topProducts.map((product, idx) => {
                                const maxQty = Math.max(...topProducts.map(p => parseInt(p.total_qty) || 0), 1);
                                const width = ((parseInt(product.total_qty) || 0) / maxQty) * 100;
                                return (
                                    <div key={idx} className="relative">
                                        <div className="absolute inset-0 bg-primary/10 rounded-lg" style={{ width: `${width}%` }} />
                                        <div className="relative flex items-center justify-between p-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                                                <span className="text-sm font-medium truncate">{product.product_name}</span>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <Badge variant="secondary" className="text-xs">{product.total_qty} pcs</Badge>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center text-muted-foreground py-6 text-sm">No data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Category Sales */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Layers className="h-5 w-5 text-blue-500" />
                            Penjualan per Kategori
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {categorySales.length > 0 ? categorySales.map((cat, idx) => {
                                const maxRev = Math.max(...categorySales.map(c => parseFloat(c.total_revenue) || 0), 1);
                                const width = ((parseFloat(cat.total_revenue) || 0) / maxRev) * 100;
                                return (
                                    <div key={idx} className="relative">
                                        <div
                                            className={cn("absolute inset-0 rounded-lg opacity-20", CATEGORY_COLORS[cat.category] || 'bg-slate-500')}
                                            style={{ width: `${width}%` }}
                                        />
                                        <div className="relative flex items-center justify-between p-2">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-3 h-3 rounded-full", CATEGORY_COLORS[cat.category] || 'bg-slate-500')} />
                                                <span className="text-sm font-medium">{cat.category}</span>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-600">{formatCurrency(cat.total_revenue)}</span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center text-muted-foreground py-6 text-sm">No data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-5 w-5 text-purple-500" />
                            Metode Pembayaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {paymentStats.length > 0 ? paymentStats.map((pm, idx) => {
                                const Icon = PAYMENT_ICONS[pm.payment_method] || CreditCard;
                                const totalRev = paymentStats.reduce((sum, p) => sum + parseFloat(p.total_revenue || 0), 0);
                                const percentage = totalRev > 0 ? ((parseFloat(pm.total_revenue) / totalRev) * 100).toFixed(1) : 0;
                                return (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", PAYMENT_COLORS[pm.payment_method] || 'bg-slate-500')}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{pm.payment_method}</p>
                                                <p className="text-xs text-muted-foreground">{pm.trx_count} transaksi</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">{formatCurrency(pm.total_revenue)}</p>
                                            <p className="text-xs text-muted-foreground">{percentage}%</p>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center text-muted-foreground py-6 text-sm">No data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Daily Sales + Hourly Pattern + Inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Daily Sales Chart */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Penjualan 7 Hari Terakhir
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartData.length > 0 ? (
                            <div className="h-44 flex items-end gap-1">
                                {chartData.map((item, idx) => {
                                    const maxVal = Math.max(...chartData.map(d => d.total), 1);
                                    const height = (item.total / maxVal) * 100;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                                            <div className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-primary transition-opacity">
                                                {formatCurrency(item.total)}
                                            </div>
                                            <div
                                                className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all hover:opacity-80 cursor-pointer"
                                                style={{ height: `${Math.max(height, 5)}%`, minHeight: '4px' }}
                                            />
                                            <span className="text-[9px] text-muted-foreground">{item.name.split('-').slice(1).join('/')}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">No data</div>
                        )}
                    </CardContent>
                </Card>

                {/* Hourly Sales Pattern */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-5 w-5 text-green-500" />
                            Pola Penjualan per Jam
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {hourlySales.length > 0 ? (
                            <div className="h-44 flex items-end gap-[2px]">
                                {Array.from({ length: 24 }).map((_, hour) => {
                                    const data = hourlySales.find(h => h.hour === hour);
                                    const maxVal = Math.max(...hourlySales.map(h => parseFloat(h.total_revenue) || 0), 1);
                                    const height = data ? ((parseFloat(data.total_revenue) || 0) / maxVal) * 100 : 0;
                                    return (
                                        <div key={hour} className="flex-1 flex flex-col items-center gap-1 group">
                                            <div
                                                className={cn(
                                                    "w-full rounded-t transition-all cursor-pointer",
                                                    height > 0 ? "bg-gradient-to-t from-green-500 to-emerald-400 hover:opacity-80" : "bg-slate-200"
                                                )}
                                                style={{ height: `${Math.max(height, 2)}%`, minHeight: '2px' }}
                                            />
                                            {hour % 4 === 0 && (
                                                <span className="text-[8px] text-muted-foreground">{hour}h</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">No data</div>
                        )}
                    </CardContent>
                </Card>

                {/* Inventory Summary */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Package className="h-5 w-5 text-orange-500" />
                            Ringkasan Inventori
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-44 overflow-y-auto">
                            {inventorySummary.length > 0 ? inventorySummary.map((inv, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-3 h-3 rounded-full", CATEGORY_COLORS[inv.category] || 'bg-slate-500')} />
                                        <span className="text-sm">{inv.category || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">{inv.product_count} produk</Badge>
                                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">{inv.active_count} aktif</Badge>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-muted-foreground py-6 text-sm">No data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        Transaksi Terbaru
                    </CardTitle>
                    <CardDescription>10 transaksi terakhir dari {selectedBranchName}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Cabang</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Metode</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((trx, i) => (
                                    <tr key={i} className="border-b hover:bg-muted/50">
                                        <td className="p-3 font-mono text-xs">{trx.transaction_uuid?.slice(0, 8)}...</td>
                                        <td className="p-3">{trx.branch_name || `Branch ${trx.branch_id}`}</td>
                                        <td className="p-3 font-semibold text-emerald-600">{formatCurrency(trx.grand_total || 0)}</td>
                                        <td className="p-3"><Badge variant="outline">{trx.payment_method}</Badge></td>
                                        <td className="p-3 text-muted-foreground">{new Date(trx.created_at || '').toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No transactions</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, gradient, delay }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className={cn("p-6 text-white relative", `bg-gradient-to-br ${gradient}`)}>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex-1">
                            <p className="text-sm font-semibold opacity-90 uppercase tracking-wider">{title}</p>
                            <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
                        </div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                            <Icon className="h-7 w-7" />
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
