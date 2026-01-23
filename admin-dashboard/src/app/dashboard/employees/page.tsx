'use client';

import { useEffect, useState } from 'react';
import { getAllEmployees, getAllBranches } from '../actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus, Users, RefreshCw, Filter, UserCog, Shield, Store as StoreIcon, Banknote, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createEmployee, deleteEmployee } from '../actions';

interface Employee {
    user_id: number;
    branch_id: number | null;
    username: string;
    role: string;
    created_at: string;
    branch_name?: string;
    branch_code?: string;
    region_name?: string;
    full_name: string;
    is_active: boolean;
    email: string;
}

interface Branch {
    branch_id: number;
    branch_code: string;
    branch_name: string;
}

const roleColors: Record<string, string> = {
    'CEO': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'DIRECTOR': 'bg-purple-100 text-purple-800 border-purple-300',
    'AREA_MANAGER': 'bg-blue-100 text-blue-800 border-blue-300',
    'STORE_SUPERVISOR': 'bg-orange-100 text-orange-800 border-orange-300',
    'CASHIER': 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const roleIcons: Record<string, any> = {
    'CEO': Shield,
    'DIRECTOR': Shield,
    'AREA_MANAGER': UserCog,
    'STORE_SUPERVISOR': StoreIcon,
    'CASHIER': Banknote,
};

const roleLabels: Record<string, string> = {
    'CEO': 'Chief Executive Officer',
    'DIRECTOR': 'Director',
    'AREA_MANAGER': 'Area Manager',
    'STORE_SUPERVISOR': 'Store Supervisor',
    'CASHIER': 'Cashier',
};

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [selectedBranch, setSelectedBranch] = useState<string>('all');

    const [isLoading, setIsLoading] = useState(true);

    // Add Modal State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        role: 'CASHIER',
        pin: '',
        branchId: '0'
    });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [emp, br] = await Promise.all([
                getAllEmployees(),
                getAllBranches()
            ]);
            setEmployees(emp);
            setBranches(br);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data karyawan');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredEmployees = employees.filter(emp => {
        const roleMatch = selectedRole === 'all' || emp.role === selectedRole;
        const branchMatch = selectedBranch === 'all' ||
            String(emp.branch_id) === selectedBranch ||
            (selectedBranch === 'hq' && emp.branch_id === null);
        return roleMatch && branchMatch;
    });

    const uniqueRoles = [...new Set(employees.map(e => e.role))];

    const getRoleCounts = () => {
        const counts: Record<string, number> = {};
        employees.forEach(e => {
            counts[e.role] = (counts[e.role] || 0) + 1;
        });
        return counts;
    };

    const roleCounts = getRoleCounts();

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Manajemen Karyawan</h2>
                    <p className="text-slate-500">Daftar semua karyawan dari TiDB Cloud</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setIsAddOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Karyawan
                    </Button>
                </div>
            </div>

            {/* Add Employee Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Karyawan Baru</DialogTitle>
                        <DialogDescription>
                            Buat akun untuk kasir atau supervisor. PIN digunakan untuk login di POS.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username (Login ID)</Label>
                            <Input
                                id="username"
                                placeholder="kasir2"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fullname">Nama Lengkap</Label>
                            <Input
                                id="fullname"
                                placeholder="Budi Santoso"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pin">PIN (6 Digit Angka)</Label>
                            <Input
                                id="pin"
                                placeholder="123456"
                                maxLength={6}
                                value={formData.pin}
                                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({ ...formData, role: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASHIER">Kasir</SelectItem>
                                    <SelectItem value="STORE_SUPERVISOR">Supervisor Toko</SelectItem>
                                    <SelectItem value="AREA_MANAGER">Area Manager</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="branch">Cabang</Label>
                            <Select
                                value={formData.branchId}
                                onValueChange={(val) => setFormData({ ...formData, branchId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">HQ (Pusat)</SelectItem>
                                    {branches.map(b => (
                                        <SelectItem key={b.branch_id} value={String(b.branch_id)}>
                                            {b.branch_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                        <Button onClick={async () => {
                            if (!formData.username || !formData.fullName || !formData.pin) {
                                toast.error('Mohon lengkapi semua data');
                                return;
                            }
                            setIsSaving(true);
                            const res = await createEmployee({
                                ...formData,
                                branchId: parseInt(formData.branchId)
                            });
                            setIsSaving(false);
                            if (res.success) {
                                toast.success('Karyawan berhasil ditambahkan');
                                setIsAddOpen(false);
                                loadData();
                                setFormData({ username: '', fullName: '', role: 'CASHIER', pin: '', branchId: '0' });
                            } else {
                                toast.error(res.error || 'Gagal menambahkan karyawan');
                            }
                        }} disabled={isSaving}>
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-slate-700 to-slate-900 text-white border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{employees.length}</p>
                                <p className="text-xs opacity-80">Total Karyawan</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {['CEO', 'AREA_MANAGER', 'STORE_SUPERVISOR', 'CASHIER'].map(role => {
                    const Icon = roleIcons[role] || Users;
                    return (
                        <Card key={role}>
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${roleColors[role]?.split(' ').slice(0, 2).join(' ')}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{roleCounts[role] || 0}</p>
                                        <p className="text-xs text-slate-500">{role.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filter:</span>
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Semua Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Role</SelectItem>
                        {uniqueRoles.map(role => (
                            <SelectItem key={role} value={role}>{roleLabels[role] || role}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Semua Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Cabang</SelectItem>
                        <SelectItem value="hq">HQ (Pusat)</SelectItem>
                        {branches.map(branch => (
                            <SelectItem key={branch.branch_id} value={String(branch.branch_id)}>
                                {branch.branch_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Badge variant="outline" className="ml-auto">
                    {filteredEmployees.length} karyawan
                </Badge>
            </div>

            {/* Table */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Daftar Karyawan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Nama Lengkap</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Cabang</TableHead>
                                <TableHead>Cabang</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.map((emp) => {
                                const Icon = roleIcons[emp.role] || Users;
                                return (
                                    <TableRow key={emp.user_id}>
                                        <TableCell className="font-mono text-sm">{emp.user_id}</TableCell>
                                        <TableCell className="font-mono text-sm text-slate-600">{emp.username}</TableCell>
                                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                                        <TableCell className="text-sm text-slate-500">{emp.email}</TableCell>
                                        <TableCell>
                                            <Badge className={`${roleColors[emp.role] || 'bg-slate-100 text-slate-700'} border`}>
                                                <Icon className="h-3 w-3 mr-1" />
                                                {emp.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {emp.branch_name ? (
                                                <div>
                                                    <span className="text-sm">{emp.branch_name}</span>
                                                    <span className="text-xs text-slate-400 block">{emp.branch_code}</span>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="bg-slate-50">HQ</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {emp.is_active ? (
                                                <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                                            ) : (
                                                <Badge variant="destructive">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={async () => {
                                                    if (confirm(`Yakin ingin menghapus ${emp.full_name}?`)) {
                                                        const res = await deleteEmployee(String(emp.user_id));
                                                        if (res.success) {
                                                            toast.success('Karyawan dihapus');
                                                            loadData();
                                                        } else {
                                                            toast.error(res.error || 'Gagal menghapus');
                                                        }
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredEmployees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                                        {isLoading ? 'Memuat data...' : 'Tidak ada data karyawan'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
