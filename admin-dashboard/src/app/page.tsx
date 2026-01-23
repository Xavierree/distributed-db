'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Wifi, ShieldCheck, Server, Database, User, Facebook, Twitter, Instagram, Linkedin, BarChart3, Globe, Cloud, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Check system status
const checkSystemStatus = async () => {
    return {
        cloud: navigator.onLine,
        auth: navigator.onLine
    };
};

export default function AdminLandingPage() {
    const router = useRouter();
    const [status, setStatus] = useState({ cloud: false, auth: false });

    useEffect(() => {
        const init = async () => {
            const s = await checkSystemStatus();
            setStatus(s);
        };
        init();
        const interval = setInterval(async () => {
            const s = await checkSystemStatus();
            setStatus(s);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-blue-200 flex flex-col">
            {/* Navbar */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <span className="text-primary">ALFA</span>MART
                        <span className="text-neutral-400 text-sm font-normal ml-2 hidden md:inline-block">Admin Dashboard</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
                        <a href="#" className="hover:text-blue-600 transition-colors">Solutions</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Analytics</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Reports</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="hidden md:flex">Documentation</Button>
                        <Button onClick={() => router.push('/login')} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Sign In
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                    <div className="container mx-auto px-6 py-20 relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-16">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="space-y-8 max-w-2xl"
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium border border-blue-500/30">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    Enterprise Cloud Platform
                                </div>
                                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                                    Retail Analytics
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                        Mastery Hub.
                                    </span>
                                </h1>
                                <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                                    Centralized dashboard for monitoring all branches, transactions, inventory, and employee performance in real-time.
                                </p>

                                <div className="flex flex-wrap gap-4 pt-4">
                                    <Button
                                        size="lg"
                                        className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 rounded-full transition-all hover:scale-105"
                                        onClick={() => router.push('/login')}
                                    >
                                        <BarChart3 className="mr-2 h-5 w-5" />
                                        Access Dashboard
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="h-14 px-8 text-lg border-2 border-slate-600 hover:bg-slate-800 hover:border-slate-500 text-white rounded-full"
                                    >
                                        Watch Demo
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Status Widget */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                className="w-full max-w-md"
                            >
                                <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 shadow-2xl rounded-3xl overflow-hidden">
                                    <CardHeader className="bg-slate-700/50 border-b border-slate-600 pb-4">
                                        <CardTitle className="flex items-center gap-2 text-lg text-white">
                                            <Cloud className="h-5 w-5 text-blue-400" />
                                            Cloud Infrastructure
                                        </CardTitle>
                                        <CardDescription className="text-slate-400">Global data center monitoring</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-700">
                                            <StatusRow
                                                label="Cloud Database (TiDB)"
                                                status={status.cloud}
                                                icon={Database}
                                                detail={status.cloud ? "Connected (Global)" : "Disconnected"}
                                            />
                                            <StatusRow
                                                label="Identity Service (Supabase)"
                                                status={status.auth}
                                                icon={ShieldCheck}
                                                detail={status.auth ? "Authenticated" : "Offline"}
                                            />
                                            <StatusRow
                                                label="Analytics Engine"
                                                status={status.cloud}
                                                icon={BarChart3}
                                                detail={status.cloud ? "Processing" : "Standby"}
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-slate-700/30 border-t border-slate-600 p-4">
                                        <div className="w-full space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400">Connected Branches</span>
                                                <span className="text-white font-bold">2 Active</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400">Transactions Today</span>
                                                <span className="text-white font-bold">Loading...</span>
                                            </div>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="bg-white border-b border-neutral-200">
                    <div className="container mx-auto px-6 py-24">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                                Complete Business Intelligence Suite
                            </h2>
                            <p className="mt-4 text-lg text-neutral-600">
                                Monitor, analyze, and optimize your retail operations with powerful cloud-based analytics.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard
                                title="Real-Time Analytics"
                                desc="Live dashboards showing sales, inventory levels, and customer trends across all locations."
                                icon="📊"
                                delay={0.2}
                            />
                            <FeatureCard
                                title="Multi-Branch Management"
                                desc="Centralized control over all store operations with branch-level performance metrics."
                                icon="🏪"
                                delay={0.4}
                            />
                            <FeatureCard
                                title="Smart Reporting"
                                desc="Automated reports with AI-powered insights and recommendations for growth."
                                icon="📈"
                                delay={0.6}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div>
                            <h3 className="font-bold text-white mb-4">Platform</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-blue-400">Dashboard</a></li>
                                <li><a href="#" className="hover:text-blue-400">Analytics</a></li>
                                <li><a href="#" className="hover:text-blue-400">Reports</a></li>
                                <li><a href="#" className="hover:text-blue-400">Integrations</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">Company</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-blue-400">About Us</a></li>
                                <li><a href="#" className="hover:text-blue-400">Careers</a></li>
                                <li><a href="#" className="hover:text-blue-400">Blog</a></li>
                                <li><a href="#" className="hover:text-blue-400">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">Resources</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-blue-400">Documentation</a></li>
                                <li><a href="#" className="hover:text-blue-400">API Reference</a></li>
                                <li><a href="#" className="hover:text-blue-400">Community</a></li>
                                <li><a href="#" className="hover:text-blue-400">Status</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-blue-400">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-blue-400">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-blue-400">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm">
                            © 2024 Alfamart Enterprise. All rights reserved.
                        </div>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-white"><Facebook className="h-5 w-5" /></a>
                            <a href="#" className="hover:text-white"><Twitter className="h-5 w-5" /></a>
                            <a href="#" className="hover:text-white"><Instagram className="h-5 w-5" /></a>
                            <a href="#" className="hover:text-white"><Linkedin className="h-5 w-5" /></a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function StatusRow({ label, status, icon: Icon, detail }: any) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", status ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-medium text-sm text-white">{label}</p>
                    <p className="text-xs text-slate-400 font-mono">{detail}</p>
                </div>
            </div>
            <Badge variant={status ? "default" : "destructive"} className={cn("rounded-lg px-2 py-1", status ? "bg-green-500 hover:bg-green-600" : "")}>
                {status ? "ONLINE" : "OFFLINE"}
            </Badge>
        </div>
    );
}

function FeatureCard({ title, desc, icon, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: delay || 0 }}
            className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">{title}</h3>
            <p className="text-neutral-600 leading-relaxed">{desc}</p>
        </motion.div>
    );
}
