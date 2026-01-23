'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    LogOut,
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    QrCode,
    Wifi,
    WifiOff,
    Clock,
    User,
    Package,
    CheckCircle2,
    Loader2,
    X,
    History,
    Boxes,
    Lock,
    Eye,
    Edit2,
    AlertCircle,
    CloudUpload,
    Check
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import {
    searchProductsAction,
    saveTransactionAction,
    getProductsAction,
    getTodayTransactionsAction,
    getTransactionItemsAction,
    verifyAdminPinAction,
    getInventoryWithStockAction,
    updateProductStockAction,
    getTodayStatsSummaryAction
} from './actions';
import type { Product } from '@/types';

interface UserData {
    id: string;
    username: string;
    fullName: string;
    role: string;
    branchId: number;
}

export default function POSPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isOnline, setIsOnline] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'DEBIT' | 'CREDIT'>('CASH');
    const [cashReceived, setCashReceived] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Transaction History Modal
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [todayTransactions, setTodayTransactions] = useState<any[]>([]);
    const [todayStats, setTodayStats] = useState<any>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedTrx, setSelectedTrx] = useState<any>(null);
    const [trxItems, setTrxItems] = useState<any[]>([]);

    // Inventory Modal
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [inventoryUnlocked, setInventoryUnlocked] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [editQty, setEditQty] = useState('');
    const [updatingStock, setUpdatingStock] = useState(false);
    const [inventorySearch, setInventorySearch] = useState('');

    const {
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setUser: setCartUser,
        getSubtotal,
        getTax,
        getTotal,
        getItemCount,
        prepareTransaction
    } = useCartStore();

    // Load user and products
    useEffect(() => {
        const storedUser = sessionStorage.getItem('pos_session');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setCartUser(userData.id, userData.username, userData.branchId);
            loadAllProducts(userData.branchId);
        } else {
            router.push('/login');
        }
    }, [router, setCartUser]);

    // Load all products on mount
    const loadAllProducts = async (branchId: number) => {
        try {
            const products = await getProductsAction(String(branchId));
            setAllProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    // Update time
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOnline(navigator.onLine);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search products with live dropdown
    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (query.length === 0) {
            // Show all products if empty
            setSearchResults(allProducts.slice(0, 10));
            setShowDropdown(true);
            return;
        }

        if (query.length < 1) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowDropdown(true);

        try {
            const results = await searchProductsAction(query, String(user?.branchId || '101'));
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle input focus - show all products
    const handleFocus = () => {
        if (searchQuery.length === 0) {
            setSearchResults(allProducts.slice(0, 10));
        }
        setShowDropdown(true);
    };

    // Handle product selection from dropdown
    const handleSelectProduct = (product: Product) => {
        addItem(product);
        toast.success(`${product.name} ditambahkan ke keranjang`);
        setSearchQuery('');
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    // Handle barcode scan (enter key)
    const handleBarcodeSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.length > 0) {
            const results = await searchProductsAction(searchQuery, String(user?.branchId || '101'));
            if (results.length === 1) {
                handleSelectProduct(results[0]);
            } else if (results.length > 1) {
                setSearchResults(results);
                setShowDropdown(true);
            } else {
                toast.error('Produk tidak ditemukan');
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    // Process checkout
    const handleCheckout = async () => {
        if (items.length === 0) {
            toast.error('Keranjang kosong');
            return;
        }

        setIsProcessing(true);
        try {
            const cash = paymentMethod === 'CASH' ? parseFloat(cashReceived) || getTotal() : undefined;
            const transaction = prepareTransaction(paymentMethod, cash);

            const result = await saveTransactionAction(transaction);

            if (result.success) {
                toast.success('Transaksi berhasil! ✅', {
                    description: 'Data tersimpan dan di-sync ke cloud'
                });
                clearCart();
                setCashReceived('');
            } else {
                toast.error(result.error || 'Gagal menyimpan transaksi');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Terjadi kesalahan');
        } finally {
            setIsProcessing(false);
        }
    };

    // Logout
    const handleLogout = () => {
        sessionStorage.removeItem('pos_session');
        router.push('/');
    };

    const formatTime = (date: Date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // ========== TRANSACTION HISTORY HANDLERS ==========
    const openHistoryModal = async () => {
        setShowHistoryModal(true);
        setLoadingHistory(true);
        setSelectedTrx(null);
        setTrxItems([]);
        try {
            const [trx, stats] = await Promise.all([
                getTodayTransactionsAction(String(user?.branchId || '101')),
                getTodayStatsSummaryAction(String(user?.branchId || '101'))
            ]);
            setTodayTransactions(trx);
            setTodayStats(stats);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat riwayat transaksi');
        } finally {
            setLoadingHistory(false);
        }
    };

    const viewTransactionDetails = async (trx: any) => {
        setSelectedTrx(trx);
        try {
            const items = await getTransactionItemsAction(trx.transaction_uuid, String(user?.branchId || '101'));
            setTrxItems(items);
        } catch (error) {
            console.error(error);
        }
    };

    // ========== INVENTORY MANAGEMENT HANDLERS ==========
    const openInventoryModal = () => {
        if (!inventoryUnlocked) {
            setShowPinModal(true);
            setPinInput('');
            setPinError('');
        } else {
            loadInventory();
        }
    };

    const verifyPin = async () => {
        const result = await verifyAdminPinAction(pinInput);
        if (result.success) {
            setInventoryUnlocked(true);
            setShowPinModal(false);
            setPinInput('');
            setPinError('');
            loadInventory();
            toast.success('PIN terverifikasi - Akses Inventory diberikan');
        } else {
            setPinError(result.error || 'PIN tidak valid');
        }
    };

    const loadInventory = async () => {
        setShowInventoryModal(true);
        setLoadingInventory(true);
        try {
            const inv = await getInventoryWithStockAction(String(user?.branchId || '101'));
            setInventoryItems(inv);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat inventory');
        } finally {
            setLoadingInventory(false);
        }
    };

    const startEditStock = (product: any) => {
        setEditingProduct(product);
        setEditQty(String(product.qty_on_hand));
    };

    const saveStockUpdate = async () => {
        if (!editingProduct) return;
        setUpdatingStock(true);
        try {
            const result = await updateProductStockAction(
                editingProduct.product_id,
                parseInt(editQty),
                String(user?.branchId || '101'),
                'Manual adjustment by cashier'
            );
            if (result.success) {
                toast.success(`Stok ${editingProduct.name} diupdate ke ${editQty}`, {
                    description: 'Tersinkron ke TiDB Cloud'
                });
                // Refresh inventory
                const inv = await getInventoryWithStockAction(String(user?.branchId || '101'));
                setInventoryItems(inv);
                setEditingProduct(null);
            } else {
                toast.error(result.error || 'Gagal update stok');
            }
        } catch (error) {
            console.error(error);
            toast.error('Terjadi kesalahan');
        } finally {
            setUpdatingStock(false);
        }
    };

    const filteredInventory = inventoryItems.filter(item =>
        item.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.barcode?.includes(inventorySearch) ||
        item.category?.toLowerCase().includes(inventorySearch.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            {/* Header */}
            <header className="bg-card border-b px-6 py-3 flex justify-between items-center shadow-sm z-30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Alfamart POS</h1>
                            <p className="text-xs text-muted-foreground">Store #{user.branchId}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Connection Status */}
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                        isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                        {isOnline ? 'Online' : 'Offline'}
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono font-bold">{formatTime(currentTime)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 border-l pl-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openHistoryModal}
                            className="flex items-center gap-2"
                        >
                            <History className="h-4 w-4" />
                            <span className="hidden md:inline">Riwayat</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openInventoryModal}
                            className="flex items-center gap-2"
                        >
                            <Boxes className="h-4 w-4" />
                            <span className="hidden md:inline">Inventori</span>
                            {inventoryUnlocked && <Check className="h-3 w-3 text-green-500" />}
                        </Button>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 border-l pl-4">
                        <div className="text-right">
                            <p className="font-semibold text-sm">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">{user.role}</p>
                        </div>
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Products & Search */}
                <div className="flex-1 p-6 overflow-auto">
                    {/* Search Bar with Dropdown */}
                    <div ref={searchRef} className="relative mb-6">
                        <Card className="overflow-visible">
                            <CardContent className="p-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        ref={inputRef}
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        onKeyDown={handleBarcodeSubmit}
                                        onFocus={handleFocus}
                                        placeholder="🔍 Scan barcode atau ketik nama produk..."
                                        className="pl-12 pr-10 h-14 text-lg rounded-xl border-2 focus:border-primary"
                                        autoFocus
                                    />
                                    {(searchQuery || isSearching) && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setShowDropdown(false);
                                                inputRef.current?.focus();
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                                        </button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dropdown Results */}
                        <AnimatePresence>
                            {showDropdown && searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-50 w-full mt-2 bg-card border rounded-xl shadow-2xl overflow-hidden"
                                >
                                    <div className="p-2 border-b bg-muted/50">
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {searchQuery ? `Hasil pencarian "${searchQuery}"` : 'Semua Produk'} ({searchResults.length})
                                        </p>
                                    </div>
                                    <div className="max-h-[280px] overflow-y-auto">
                                        {searchResults.slice(0, 10).map((product, index) => (
                                            <motion.div
                                                key={product.product_id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="flex items-center gap-4 p-3 hover:bg-primary/5 cursor-pointer border-b last:border-0 transition-colors"
                                                onClick={() => handleSelectProduct(product)}
                                            >
                                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                                    <Package className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm truncate">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {product.barcode} • {product.category || 'Uncategorized'}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-bold text-primary text-lg">{formatCurrency(product.price)}</p>
                                                    <p className="text-xs text-muted-foreground">Stok: {product.stock || '-'}</p>
                                                </div>
                                                <Button size="sm" className="shrink-0">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Cart Items */}
                    <Card className="shadow-lg">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5 text-primary" />
                                    Daftar Belanjaan
                                </span>
                                <Badge className="bg-primary">{getItemCount()} item</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <AnimatePresence>
                                {items.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                        <p className="text-lg font-medium">Keranjang kosong</p>
                                        <p className="text-sm">Scan barcode atau cari produk untuk memulai</p>
                                    </div>
                                ) : (
                                    <div className="divide-y max-h-[400px] overflow-y-auto">
                                        {items.map((item, index) => (
                                            <motion.div
                                                key={item.product_id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="p-4 flex items-center gap-4 hover:bg-muted/30"
                                            >
                                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                                    <Package className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatCurrency(item.price)} × {item.qty}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-full"
                                                        onClick={() => updateQuantity(item.product_id, item.qty - 1)}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-10 text-center font-bold text-lg">{item.qty}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-full"
                                                        onClick={() => updateQuantity(item.product_id, item.qty + 1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeItem(item.product_id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <p className="w-28 text-right font-bold text-primary text-lg">
                                                    {formatCurrency(item.subtotal)}
                                                </p>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel - Checkout */}
                <div className="w-[380px] bg-card border-l flex flex-col shadow-xl">
                    <div className="p-6 border-b bg-gradient-to-br from-primary to-orange-600 text-white">
                        <h2 className="text-lg font-bold mb-4">Ringkasan Pembayaran</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-white/80">
                                <span>Subtotal</span>
                                <span>{formatCurrency(getSubtotal())}</span>
                            </div>
                            <div className="flex justify-between text-white/80">
                                <span>PPN (11%)</span>
                                <span>{formatCurrency(getTax())}</span>
                            </div>
                            <div className="h-px bg-white/20" />
                            <div className="flex justify-between text-2xl font-bold">
                                <span>Total</span>
                                <span className="text-white">{formatCurrency(getTotal())}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-6 space-y-4">
                        <p className="text-sm font-medium text-muted-foreground">Metode Pembayaran</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'CASH', icon: Banknote, label: 'Tunai' },
                                { id: 'QRIS', icon: QrCode, label: 'QRIS' },
                                { id: 'DEBIT', icon: CreditCard, label: 'Debit' },
                                { id: 'CREDIT', icon: CreditCard, label: 'Kredit' },
                            ].map(({ id, icon: Icon, label }) => (
                                <Button
                                    key={id}
                                    variant={paymentMethod === id ? 'default' : 'outline'}
                                    className={cn(
                                        "h-16 flex-col gap-1 transition-all",
                                        paymentMethod === id && "bg-primary hover:bg-primary/90 ring-2 ring-primary/30"
                                    )}
                                    onClick={() => setPaymentMethod(id as any)}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-xs">{label}</span>
                                </Button>
                            ))}
                        </div>

                        {paymentMethod === 'CASH' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-2"
                            >
                                <p className="text-sm font-medium text-muted-foreground">Uang Diterima</p>
                                <Input
                                    type="number"
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    placeholder="Masukkan jumlah..."
                                    className="h-14 text-xl text-right font-bold"
                                />
                                {parseFloat(cashReceived) >= getTotal() && getTotal() > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 bg-green-50 border border-green-200 rounded-xl"
                                    >
                                        <p className="text-sm text-green-700">
                                            Kembalian: <span className="font-bold text-lg">{formatCurrency(parseFloat(cashReceived) - getTotal())}</span>
                                        </p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    <div className="p-6 border-t space-y-3">
                        <Button
                            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                            disabled={items.length === 0 || isProcessing || (paymentMethod === 'CASH' && parseFloat(cashReceived || '0') < getTotal())}
                            onClick={handleCheckout}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-6 w-6 mr-2" />
                                    Proses Pembayaran
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={clearCart}
                            disabled={items.length === 0}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Kosongkan Keranjang
                        </Button>
                    </div>
                </div>
            </div>

            {/* Transaction History Modal */}
            <AnimatePresence>
                {showHistoryModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowHistoryModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <History className="h-6 w-6" />
                                        <div>
                                            <h2 className="text-xl font-bold">Riwayat Transaksi Hari Ini</h2>
                                            <p className="text-sm opacity-80">Store #{user?.branchId} • {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setShowHistoryModal(false)} className="text-white hover:bg-white/20">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Stats Summary */}
                                {todayStats && (
                                    <div className="grid grid-cols-4 gap-4 mt-6">
                                        <div className="bg-white/10 rounded-xl p-3">
                                            <p className="text-xs opacity-70">Total Transaksi</p>
                                            <p className="text-2xl font-bold">{todayStats.total_transactions}</p>
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-3">
                                            <p className="text-xs opacity-70">Total Revenue</p>
                                            <p className="text-2xl font-bold">{formatCurrency(todayStats.total_revenue)}</p>
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-3">
                                            <p className="text-xs opacity-70">Items Sold</p>
                                            <p className="text-2xl font-bold">{todayStats.total_items_sold}</p>
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-3">
                                            <p className="text-xs opacity-70">Rata-rata</p>
                                            <p className="text-2xl font-bold">{formatCurrency(todayStats.avg_transaction)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex h-[50vh]">
                                {/* Transaction List */}
                                <div className="w-1/2 border-r overflow-y-auto">
                                    {loadingHistory ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : todayTransactions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                            <ShoppingCart className="h-12 w-12 mb-3 opacity-40" />
                                            <p>Belum ada transaksi hari ini</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {todayTransactions.map((trx) => (
                                                <div
                                                    key={trx.transaction_uuid}
                                                    className={cn(
                                                        "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                                                        selectedTrx?.transaction_uuid === trx.transaction_uuid && "bg-primary/5 border-l-4 border-primary"
                                                    )}
                                                    onClick={() => viewTransactionDetails(trx)}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="font-mono text-xs text-muted-foreground">{trx.transaction_uuid.slice(0, 8)}...</p>
                                                            <p className="font-bold text-lg">{formatCurrency(trx.grand_total)}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="text-xs">{trx.payment_method}</Badge>
                                                                {trx.synced ? (
                                                                    <Badge className="bg-green-100 text-green-700 text-xs">Synced</Badge>
                                                                ) : (
                                                                    <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{new Date(trx.created_at).toLocaleTimeString('id-ID')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Transaction Detail */}
                                <div className="w-1/2 p-6 bg-muted/30">
                                    {selectedTrx ? (
                                        <div>
                                            <h3 className="font-bold text-lg mb-4">Detail Transaksi</h3>
                                            <div className="space-y-2 mb-6">
                                                <p className="text-sm"><span className="text-muted-foreground">ID:</span> {selectedTrx.transaction_uuid}</p>
                                                <p className="text-sm"><span className="text-muted-foreground">Waktu:</span> {new Date(selectedTrx.created_at).toLocaleString('id-ID')}</p>
                                                <p className="text-sm"><span className="text-muted-foreground">Pembayaran:</span> {selectedTrx.payment_method}</p>
                                            </div>
                                            <h4 className="font-semibold text-sm mb-2">Items:</h4>
                                            <div className="space-y-2">
                                                {trxItems.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between p-2 bg-white rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-sm">{item.product_name || `Product #${item.product_id}`}</p>
                                                            <p className="text-xs text-muted-foreground">{item.qty} x {formatCurrency(item.price_at_sale)}</p>
                                                        </div>
                                                        <p className="font-bold text-sm">{formatCurrency(item.subtotal)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 pt-4 border-t">
                                                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(selectedTrx.subtotal)}</span></div>
                                                <div className="flex justify-between text-sm"><span>Pajak</span><span>{formatCurrency(selectedTrx.tax_amount)}</span></div>
                                                <div className="flex justify-between font-bold text-lg mt-2"><span>Total</span><span>{formatCurrency(selectedTrx.grand_total)}</span></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                            <Eye className="h-10 w-10 mb-3 opacity-40" />
                                            <p>Pilih transaksi untuk melihat detail</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PIN Modal */}
            <AnimatePresence>
                {showPinModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowPinModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="h-8 w-8 text-orange-600" />
                                </div>
                                <h2 className="text-xl font-bold">Verifikasi PIN SPV</h2>
                                <p className="text-sm text-muted-foreground mt-1">Masukkan PIN untuk akses inventory</p>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    type="password"
                                    value={pinInput}
                                    onChange={(e) => setPinInput(e.target.value)}
                                    placeholder="Masukkan PIN..."
                                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                                    maxLength={6}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
                                />
                                {pinError && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm justify-center">
                                        <AlertCircle className="h-4 w-4" />
                                        {pinError}
                                    </div>
                                )}
                                <Button className="w-full h-12" onClick={verifyPin} disabled={pinInput.length < 4}>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Verifikasi
                                </Button>
                                <Button variant="ghost" className="w-full" onClick={() => setShowPinModal(false)}>
                                    Batal
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inventory Modal */}
            <AnimatePresence>
                {showInventoryModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => { setShowInventoryModal(false); setEditingProduct(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card rounded-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Boxes className="h-6 w-6" />
                                        <div>
                                            <h2 className="text-xl font-bold">Manajemen Inventory</h2>
                                            <p className="text-sm opacity-80">Store #{user?.branchId} • {inventoryItems.length} produk</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-white/20 text-white">
                                            <CloudUpload className="h-3 w-3 mr-1" />
                                            Synced to Supabase
                                        </Badge>
                                        <Button variant="ghost" size="icon" onClick={() => { setShowInventoryModal(false); setEditingProduct(null); }} className="text-white hover:bg-white/20">
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="mt-4 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                                    <Input
                                        value={inventorySearch}
                                        onChange={(e) => setInventorySearch(e.target.value)}
                                        placeholder="Cari produk..."
                                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                    />
                                </div>
                            </div>

                            <div className="h-[55vh] overflow-y-auto p-4">
                                {loadingInventory ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : filteredInventory.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <Package className="h-12 w-12 mb-3 opacity-40" />
                                        <p>Tidak ada produk ditemukan</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredInventory.map((item) => {
                                            const isLowStock = item.qty_on_hand <= item.min_stock;
                                            const isEditing = editingProduct?.product_id === item.product_id;
                                            return (
                                                <Card key={item.product_id} className={cn("overflow-hidden", isLowStock && "border-red-200")}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <p className="font-bold text-sm">{item.name}</p>
                                                                <p className="text-xs text-muted-foreground">{item.barcode}</p>
                                                            </div>
                                                            <Badge variant="outline" className="text-xs">{item.category}</Badge>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Stok</p>
                                                                {isEditing ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Input
                                                                            type="number"
                                                                            value={editQty}
                                                                            onChange={(e) => setEditQty(e.target.value)}
                                                                            className="w-20 h-8 text-center"
                                                                            min={0}
                                                                        />
                                                                        <Button size="sm" className="h-8" onClick={saveStockUpdate} disabled={updatingStock}>
                                                                            {updatingStock ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingProduct(null)}>
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <p className={cn("text-2xl font-bold", isLowStock ? "text-red-600" : "text-foreground")}>
                                                                        {item.qty_on_hand}
                                                                        {isLowStock && <AlertCircle className="inline h-4 w-4 ml-1 text-red-500" />}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {!isEditing && (
                                                                <Button size="sm" variant="outline" onClick={() => startEditStock(item)}>
                                                                    <Edit2 className="h-3 w-3 mr-1" />
                                                                    Edit
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <p className="text-xs text-muted-foreground mt-2">Min. stok: {item.min_stock}</p>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

