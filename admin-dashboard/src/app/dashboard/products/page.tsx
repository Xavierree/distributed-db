'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Search, Filter, Plus, Edit, RefreshCw, Trash2, Save, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getGlobalProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus } from '../actions';
import { toast } from 'sonner';

interface Product {
    product_id: number;
    barcode: string;
    name: string;
    category: string;
    price: number;
    tax_rate: number;
    is_active: boolean | number;
}

const CATEGORIES = ['BEVERAGE', 'FOOD', 'SNACK', 'STAPLE', 'BAKERY', 'CIGARETTE', 'DAIRY', 'FRESH', 'PERSONAL_CARE', 'HOUSEHOLD'];

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        barcode: '',
        name: '',
        category: '',
        price: '',
        tax_rate: '11',
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const data = await getGlobalProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data produk');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            barcode: product.barcode || '',
            name: product.name || '',
            category: product.category || '',
            price: String(product.price || ''),
            tax_rate: String(product.tax_rate || '11'),
        });
        setIsEditOpen(true);
    };

    const handleAdd = () => {
        setFormData({
            barcode: '',
            name: '',
            category: 'FOOD',
            price: '',
            tax_rate: '11',
        });
        setIsAddOpen(true);
    };

    const handleDelete = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedProduct) return;

        setIsSaving(true);
        try {
            const result = await updateProduct(selectedProduct.product_id, {
                barcode: formData.barcode,
                name: formData.name,
                category: formData.category,
                price: parseFloat(formData.price),
                tax_rate: parseFloat(formData.tax_rate),
            });

            if (result.success) {
                toast.success('Produk berhasil diperbarui');
                setIsEditOpen(false);
                loadProducts();
            } else {
                toast.error(result.error || 'Gagal memperbarui produk');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAdd = async () => {
        if (!formData.barcode || !formData.name || !formData.price) {
            toast.error('Harap isi semua field yang diperlukan');
            return;
        }

        setIsSaving(true);
        try {
            const result = await createProduct({
                barcode: formData.barcode,
                name: formData.name,
                category: formData.category,
                price: parseFloat(formData.price),
                tax_rate: parseFloat(formData.tax_rate),
            });

            if (result.success) {
                toast.success('Produk berhasil ditambahkan');
                setIsAddOpen(false);
                loadProducts();
            } else {
                toast.error(result.error || 'Gagal menambahkan produk');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedProduct) return;

        setIsSaving(true);
        try {
            const result = await deleteProduct(selectedProduct.product_id);

            if (result.success) {
                toast.success('Produk berhasil dihapus');
                setIsDeleteOpen(false);
                loadProducts();
            } else {
                toast.error(result.error || 'Gagal menghapus produk');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Master Produk</h2>
                    <p className="text-slate-500">Katalog produk global dari TiDB Cloud</p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Produk
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Katalog Produk ({filteredProducts.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Cari produk..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={loadProducts}>
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
                            Loading products...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Barcode</TableHead>
                                    <TableHead>Nama Produk</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead className="text-right">Harga</TableHead>
                                    <TableHead className="text-right">Tax</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => (
                                    <TableRow key={product.product_id}>
                                        <TableCell className="font-mono text-xs text-slate-500">
                                            {product.barcode}
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{product.category || 'Uncategorized'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency(product.price || 0)}
                                        </TableCell>
                                        <TableCell className="text-right">{product.tax_rate || 0}%</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={product.is_active ? "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100" : "text-slate-500 hover:text-slate-700"}
                                                    onClick={async () => {
                                                        const newStatus = !product.is_active;
                                                        await toggleProductStatus(product.product_id, newStatus);
                                                        loadProducts();
                                                        toast.success(`Produk ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
                                                    }}
                                                >
                                                    <Badge className={product.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}>
                                                        {product.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(product)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                                            Tidak ada produk ditemukan
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Product Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Produk</DialogTitle>
                        <DialogDescription>Ubah informasi produk di database TiDB Cloud</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-barcode">Barcode</Label>
                            <Input id="edit-barcode" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Nama Produk</Label>
                            <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category">Kategori</Label>
                            <select
                                id="edit-category"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-price">Harga (Rp)</Label>
                                <Input id="edit-price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-tax">Tax Rate (%)</Label>
                                <Input id="edit-tax" type="number" value={formData.tax_rate} onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            <X className="mr-2 h-4 w-4" /> Batal
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Product Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Produk Baru</DialogTitle>
                        <DialogDescription>Tambahkan produk baru ke katalog global TiDB Cloud</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="add-barcode">Barcode *</Label>
                            <Input id="add-barcode" placeholder="8999999195483" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-name">Nama Produk *</Label>
                            <Input id="add-name" placeholder="Indomie Goreng Original" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-category">Kategori</Label>
                            <select
                                id="add-category"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="add-price">Harga (Rp) *</Label>
                                <Input id="add-price" type="number" placeholder="15000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="add-tax">Tax Rate (%)</Label>
                                <Input id="add-tax" type="number" value={formData.tax_rate} onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                            <X className="mr-2 h-4 w-4" /> Batal
                        </Button>
                        <Button onClick={handleSaveAdd} disabled={isSaving}>
                            <Plus className="mr-2 h-4 w-4" /> {isSaving ? 'Menambahkan...' : 'Tambah Produk'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Produk</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus produk <span className="font-bold">{selectedProduct?.name}</span>?
                            <br /><br />
                            <span className="text-red-600 font-bold">PERINGATAN:</span> Tindakan ini akan <span className="underline">menghapus permanen</span> produk dari database Pusat dan Toko.
                            Jika produk sudah pernah terjual, penghapusan mungkin gagal demi menjaga data transaksi.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving}>
                            <Trash2 className="mr-2 h-4 w-4" /> {isSaving ? 'Menghapus...' : 'Hapus Produk'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
