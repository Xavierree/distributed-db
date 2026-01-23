'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    FileText,
    Download,
    Calendar,
    TrendingUp,
    ShoppingCart,
    Package,
    Eye,
    Loader2,
    CheckCircle,
    Table as TableIcon
} from 'lucide-react';
import { toast } from 'sonner';
import {
    exportDailySalesReport,
    exportTransactionReport,
    exportInventoryReport,
    exportMonthlyReport,
    getAllBranches
} from '../actions';
import { formatCurrency } from '@/lib/utils';

interface ReportData {
    type: string;
    data: any[];
}

export default function ReportsPage() {
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<ReportData | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Filter states
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            toast.error('Tidak ada data untuk diexport');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                const val = row[h];
                if (val === null || val === undefined) return '';
                if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        toast.success(`Berhasil download ${filename}.csv`);
    };

    const handleExportDailySales = async (preview: boolean = false) => {
        setIsExporting('daily');
        try {
            const data = await exportDailySalesReport(selectedDate);
            if (preview) {
                setPreviewData({ type: 'Laporan Penjualan Harian', data });
                setIsPreviewOpen(true);
            } else {
                downloadCSV(data, 'laporan_penjualan_harian');
            }
        } catch (error) {
            toast.error('Gagal mengexport laporan');
        } finally {
            setIsExporting(null);
        }
    };

    const handleExportTransactions = async (preview: boolean = false) => {
        setIsExporting('transactions');
        try {
            const data = await exportTransactionReport(startDate, endDate);
            if (preview) {
                setPreviewData({ type: 'Laporan Transaksi', data });
                setIsPreviewOpen(true);
            } else {
                downloadCSV(data, 'laporan_transaksi');
            }
        } catch (error) {
            toast.error('Gagal mengexport laporan');
        } finally {
            setIsExporting(null);
        }
    };

    const handleExportInventory = async (preview: boolean = false) => {
        setIsExporting('inventory');
        try {
            const data = await exportInventoryReport();
            if (preview) {
                setPreviewData({ type: 'Laporan Inventaris', data });
                setIsPreviewOpen(true);
            } else {
                downloadCSV(data, 'laporan_inventaris');
            }
        } catch (error) {
            toast.error('Gagal mengexport laporan');
        } finally {
            setIsExporting(null);
        }
    };

    const handleExportMonthly = async (preview: boolean = false) => {
        setIsExporting('monthly');
        try {
            const data = await exportMonthlyReport(selectedYear, selectedMonth);
            if (preview) {
                setPreviewData({ type: 'Laporan Bulanan', data });
                setIsPreviewOpen(true);
            } else {
                downloadCSV(data, `laporan_bulanan_${selectedYear}_${selectedMonth}`);
            }
        } catch (error) {
            toast.error('Gagal mengexport laporan');
        } finally {
            setIsExporting(null);
        }
    };

    const reports = [
        {
            id: 'daily',
            title: 'Laporan Penjualan Harian',
            desc: 'Ringkasan penjualan per hari dari semua cabang',
            icon: TrendingUp,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50',
            onPreview: () => handleExportDailySales(true),
            onDownload: () => handleExportDailySales(false),
            filter: (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <Label className="text-xs text-muted-foreground">Tanggal</Label>
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="mt-1 h-9"
                    />
                </div>
            )
        },
        {
            id: 'transactions',
            title: 'Laporan Transaksi',
            desc: 'Detail semua transaksi dengan filter tanggal',
            icon: ShoppingCart,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
            onPreview: () => handleExportTransactions(true),
            onDownload: () => handleExportTransactions(false),
            filter: (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs text-muted-foreground">Dari</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="mt-1 h-9"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Sampai</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-1 h-9"
                            />
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'inventory',
            title: 'Laporan Inventaris',
            desc: 'Status stok produk dari katalog global',
            icon: Package,
            color: 'text-orange-500',
            bgColor: 'bg-orange-50',
            onPreview: () => handleExportInventory(true),
            onDownload: () => handleExportInventory(false),
            filter: null
        },
        {
            id: 'monthly',
            title: 'Laporan Bulanan',
            desc: 'Ringkasan performa bisnis bulanan',
            icon: Calendar,
            color: 'text-purple-500',
            bgColor: 'bg-purple-50',
            onPreview: () => handleExportMonthly(true),
            onDownload: () => handleExportMonthly(false),
            filter: (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs text-muted-foreground">Bulan</Label>
                            <Select value={String(selectedMonth)} onValueChange={(v: string) => setSelectedMonth(parseInt(v))}>
                                <SelectTrigger className="mt-1 h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <SelectItem key={i} value={String(i + 1)}>
                                            {new Date(2000, i).toLocaleString('id-ID', { month: 'long' })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Tahun</Label>
                            <Select value={String(selectedYear)} onValueChange={(v: string) => setSelectedYear(parseInt(v))}>
                                <SelectTrigger className="mt-1 h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[2023, 2024, 2025].map((y) => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )
        },
    ];

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Laporan</h2>
                    <p className="text-slate-500">Generate dan download laporan bisnis</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map((report) => (
                    <Card key={report.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${report.bgColor} rounded-xl flex items-center justify-center ${report.color}`}>
                                    <report.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{report.title}</CardTitle>
                                    <CardDescription>{report.desc}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {report.filter}
                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={report.onPreview}
                                    disabled={isExporting === report.id}
                                >
                                    {isExporting === report.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Eye className="mr-2 h-4 w-4" />
                                    )}
                                    Preview
                                </Button>
                                <Button
                                    className="flex-1 bg-primary hover:bg-primary/90"
                                    onClick={report.onDownload}
                                    disabled={isExporting === report.id}
                                >
                                    {isExporting === report.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Download
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TableIcon className="h-5 w-5 text-primary" />
                            Preview: {previewData?.type}
                        </DialogTitle>
                        <DialogDescription>
                            {previewData?.data.length || 0} baris data
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                        {previewData && previewData.data.length > 0 ? (
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-slate-100 sticky top-0">
                                    <tr>
                                        {Object.keys(previewData.data[0]).map((key) => (
                                            <th key={key} className="text-left p-2 border font-medium text-slate-700">
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.data.slice(0, 50).map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            {Object.values(row).map((val: any, i) => (
                                                <td key={i} className="p-2 border text-slate-600">
                                                    {typeof val === 'number' && val > 1000
                                                        ? formatCurrency(val)
                                                        : val?.toString() || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Tidak ada data untuk ditampilkan</p>
                            </div>
                        )}
                        {previewData && previewData.data.length > 50 && (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                                Menampilkan 50 dari {previewData.data.length} baris. Download untuk melihat semua data.
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                            Tutup
                        </Button>
                        <Button onClick={() => {
                            if (previewData) {
                                downloadCSV(previewData.data, previewData.type.toLowerCase().replace(/ /g, '_'));
                                setIsPreviewOpen(false);
                            }
                        }}>
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
