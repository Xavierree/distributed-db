'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Mail, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { loginAction } from "./actions";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        const result = await loginAction(formData);
        setLoading(false);

        if (result?.error) {
            toast.error(result.error);
        } else if (result?.success && result.user) {
            toast.success(`Selamat datang, ${result.user.fullName}!`);
            sessionStorage.setItem('admin_user', JSON.stringify(result.user));
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />

            {/* Back Button */}
            <Button
                variant="ghost"
                className="absolute top-6 left-6 gap-2 text-slate-400 hover:text-white"
                onClick={() => router.push('/')}
            >
                <ArrowLeft className="h-4 w-4" />
                Kembali
            </Button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
            >
                <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-800/90 backdrop-blur-xl rounded-3xl overflow-hidden">
                    {/* Header Gradient */}
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600" />

                    <CardHeader className="text-center pt-10 pb-6">
                        <div className="mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
                            <ShieldCheck className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">
                            Admin Dashboard
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Masuk ke Panel Administrasi
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-10">
                        <form action={handleSubmit} className="space-y-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <Input
                                        name="email"
                                        type="email"
                                        placeholder="admin@alfamart.id"
                                        className="pl-12 h-14 text-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <Input
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-12 h-14 text-lg bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Forgot Password */}
                            <div className="flex justify-end">
                                <Button type="button" variant="link" className="text-blue-400 hover:text-blue-300 p-0 h-auto">
                                    Lupa Password?
                                </Button>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        Memverifikasi...
                                    </>
                                ) : (
                                    'Masuk ke Dashboard'
                                )}
                            </Button>

                            {/* Demo Credentials */}
                            <div className="text-center p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                                <p className="text-xs text-slate-400 mb-2">Demo Admin Credentials:</p>
                                <p className="text-xs text-slate-300">
                                    Email: <code className="bg-slate-600 px-2 py-1 rounded">rodsubm@gmail.com</code>
                                </p>
                                <p className="text-xs text-slate-300 mt-1">
                                    Password: <code className="bg-slate-600 px-2 py-1 rounded">himads</code>
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
