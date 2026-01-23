'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Home,
    ShoppingCart,
    Package,
    Store,
    Users,
    FileText,
    Settings,
    LogOut,
    BarChart3,
    ChevronLeft,
    Menu,
    Activity
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/transactions', icon: ShoppingCart, label: 'Transaksi' },
    { href: '/dashboard/products', icon: Package, label: 'Produk' },
    { href: '/dashboard/branches', icon: Store, label: 'Cabang' },
    { href: '/dashboard/employees', icon: Users, label: 'Karyawan' },
    { href: '/dashboard/reports', icon: FileText, label: 'Laporan' },
    { href: '/dashboard/system-health', icon: Activity, label: 'System Health' },
    { href: '/dashboard/settings', icon: Settings, label: 'Pengaturan' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem('admin_user');
        if (stored) {
            setUser(JSON.parse(stored));
        } else {
            router.push('/login');
        }
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem('admin_user');
        router.push('/');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <aside className={cn(
                "bg-slate-900 text-white flex flex-col transition-all duration-300",
                collapsed ? "w-20" : "w-64"
            )}>
                {/* Logo */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    {!collapsed && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="font-bold">Alfamart</h1>
                                <p className="text-xs text-slate-400">Admin Portal</p>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left",
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                                    collapsed && "justify-center px-2"
                                )}
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {!collapsed && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* User */}
                <div className="p-4 border-t border-slate-700">
                    {!collapsed && (
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.fullName}</p>
                                <p className="text-xs text-slate-400">{user.role}</p>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        className={cn(
                            "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white",
                            collapsed ? "w-full p-2" : "w-full"
                        )}
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        {!collapsed && <span className="ml-2">Keluar</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
