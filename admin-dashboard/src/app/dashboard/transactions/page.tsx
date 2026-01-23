'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Filter, Download, Eye, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getGlobalTransactions, getTransactionDetails } from '../actions';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedTrx, setSelectedTrx] = useState<any>(null);
    const [details, setDetails] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        setIsLoading(true);
        try {
            const data = await getGlobalTransactions(100);
            setTransactions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = async (trx: any) => {
        setSelectedTrx(trx);
        setIsModalOpen(true);
        setIsDetailsLoading(true);
        try {
            const items = await getTransactionDetails(trx.transaction_uuid);
            setDetails(items);
        } catch (error) {
            console.error(error);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(trx =>
        trx.transaction_uuid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trx.branch_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Transaksi Global</h2>
                    <p className="text-slate-500">Data transaksi real-time dari semua cabang (TiDB Cloud)</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Daftar Transaksi ({filteredTransactions.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Cari ID transaksi atau cabang..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={loadTransactions}>
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-12 text-center text-slate-400">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                            Loading transactions...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Transaksi</TableHead>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead>Cabang</TableHead>
                                    <TableHead>Metode</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((trx) => (
                                    <TableRow key={trx.transaction_uuid} className="cursor-pointer" onClick={() => handleViewDetails(trx)}>
                                        <TableCell className="font-mono text-xs text-slate-500">
                                            {trx.transaction_uuid?.slice(0, 8)}...
                                        </TableCell>
                                        <TableCell>{new Date(trx.created_at).toLocaleString('id-ID')}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{trx.branch_name || `Branch ${trx.branch_id}`}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{trx.payment_method}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-emerald-600">
                                            {formatCurrency(trx.grand_total || 0)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Cloud</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewDetails(trx); }}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredTransactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                                            Tidak ada transaksi ditemukan
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Transaction Detail Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detail Transaksi</DialogTitle>
                    </DialogHeader>
                    {selectedTrx && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <p className="text-xs text-slate-500 font-mono mb-2">ID: {selectedTrx.transaction_uuid}</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-slate-500 text-xs">Waktu</p>
                                        <p className="font-medium">{new Date(selectedTrx.created_at).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Cabang</p>
                                        <p className="font-medium">{selectedTrx.branch_name || `Branch ${selectedTrx.branch_id}`}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Metode Pembayaran</p>
                                        <Badge variant="outline">{selectedTrx.payment_method}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Status</p>
                                        <Badge className="bg-blue-100 text-blue-700">Synced</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-slate-100 p-3 text-xs font-semibold flex justify-between">
                                    <span>ITEM</span>
                                    <span>TOTAL</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {isDetailsLoading ? (
                                        <div className="p-4 text-center">
                                            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-slate-400" />
                                        </div>
                                    ) : details.length > 0 ? (
                                        details.map((item, idx) => (
                                            <div key={idx} className="p-3 border-b last:border-0 flex justify-between items-center text-sm">
                                                <div>
                                                    <p className="font-medium">{item.product_name || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500">{item.qty} x {formatCurrency(item.price_at_sale)}</p>
                                                </div>
                                                <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-slate-400">Tidak ada detail item</div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-emerald-600">{formatCurrency(selectedTrx.grand_total || 0)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
