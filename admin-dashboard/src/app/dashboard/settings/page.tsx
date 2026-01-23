import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Database, Cloud, Users, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="p-8 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Pengaturan</h2>
                <p className="text-slate-500">Konfigurasi sistem dan preferensi</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-blue-500" />
                            <div>
                                <CardTitle>Database</CardTitle>
                                <CardDescription>Konfigurasi koneksi database</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>TiDB Host</Label>
                            <Input value="gateway01.xxx.prod.aws.tidbcloud.com" disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Database Name</Label>
                            <Input value="retail_cloud_hq" disabled />
                        </div>
                        <Button variant="outline">Test Connection</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Cloud className="h-5 w-5 text-cyan-500" />
                            <div>
                                <CardTitle>Supabase</CardTitle>
                                <CardDescription>Konfigurasi authentication</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Project URL</Label>
                            <Input value="https://xxx.supabase.co" disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                <span className="text-sm text-emerald-600">Connected</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-orange-500" />
                            <div>
                                <CardTitle>Notifikasi</CardTitle>
                                <CardDescription>Pengaturan notifikasi sistem</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-slate-400">
                            <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Pengaturan notifikasi akan segera tersedia</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-purple-500" />
                            <div>
                                <CardTitle>Keamanan</CardTitle>
                                <CardDescription>Pengaturan keamanan dan akses</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-slate-400">
                            <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Pengaturan keamanan akan segera tersedia</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
