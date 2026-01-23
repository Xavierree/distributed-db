import { getAllBranches } from '../actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BranchesPage() {
    const branches = await getAllBranches();

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Manajemen Cabang</h2>
                    <p className="text-slate-500">Daftar semua cabang toko dari TiDB Cloud</p>
                </div>
                {/* <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Cabang
                </Button> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{branches.length}</p>
                                <p className="text-sm opacity-80">Total Cabang</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{branches.filter((b: any) => b.is_active).length}</p>
                                <p className="text-sm opacity-80">Cabang Aktif</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{branches.filter((b: any) => !b.is_active).length}</p>
                                <p className="text-sm opacity-80">Cabang Nonaktif</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Cabang</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama Cabang</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Alamat</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {branches.map((branch: any) => (
                                <TableRow key={branch.branch_id}>
                                    <TableCell>{branch.branch_id}</TableCell>
                                    <TableCell className="font-mono">{branch.branch_code}</TableCell>
                                    <TableCell className="font-medium">{branch.branch_name}</TableCell>
                                    <TableCell>{branch.region_name || '-'}</TableCell>
                                    <TableCell className="max-w-xs truncate">{branch.address || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        {branch.is_active ? (
                                            <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                                        ) : (
                                            <Badge variant="destructive">Inactive</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {branches.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                        Tidak ada data cabang
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
