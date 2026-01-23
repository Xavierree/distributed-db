'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Store, Lock, User, Info } from 'lucide-react';
import { loginAction } from './actions';

// CONFIG: Available Branches (Matches Database)
const BRANCHES = [
    { id: '101', name: 'JKT-001 (Alfamart Jakarta)' },
    { id: '102', name: 'BDG-001 (Alfamart Bandung)' },
];

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'branch' | 'credentials'>('branch');
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [pin, setPin] = useState('');

    const handleBranchSelect = (value: string) => {
        setSelectedBranch(value);
        // Automatically move to credentials step after selection
        setTimeout(() => setStep('credentials'), 300);
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append('branch', selectedBranch);
        formData.append('pin', pin); // Use state pin

        try {
            const result = await loginAction(formData);

            if (result.success && result.user) {
                // Save session to Local Storage (Client Side Session)
                sessionStorage.setItem('pos_session', JSON.stringify({
                    ...result.user,
                    loginTime: new Date().toISOString()
                }));
                // Also save branch config for other components
                sessionStorage.setItem('selected_branch', selectedBranch);

                toast.success(`Selamat Datang, ${result.user.fullName}!`);
                router.push('/pos');
            } else {
                toast.error(result.error || 'Login gagal');
                setPin(''); // Reset PIN on failure
            }
        } catch (error) {
            toast.error('Terjadi kesalahan sistem');
        } finally {
            setIsLoading(false);
        }
    };

    // Numpad Helper
    const handleNumpad = (num: string) => {
        if (num === 'C') setPin('');
        else if (num === 'back') setPin(prev => prev.slice(0, -1));
        else if (pin.length < 6) setPin(prev => prev + num);
    };

    return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans text-neutral-800">
            <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl overflow-hidden border-0">
                {/* Header */}
                <div className="bg-orange-500 p-8 text-center text-white">
                    <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Alfamart POS</h1>
                    <p className="text-orange-100 mt-1 opacity-90">Sistem Kasir Terdistribusi</p>
                </div>

                <div className="p-8">
                    {/* STEP 1: BRANCH SELECTION */}
                    {step === 'branch' && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-lg font-semibold text-neutral-700">Pilih Lokasi Toko</h2>
                                <p className="text-sm text-neutral-500">Silakan pilih cabang untuk memulai</p>
                            </div>

                            <Select onValueChange={handleBranchSelect} value={selectedBranch}>
                                <SelectTrigger className="h-14 text-lg border-neutral-200 rounded-xl bg-neutral-50">
                                    <SelectValue placeholder="Pilih Cabang..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {BRANCHES.map(b => (
                                        <SelectItem key={b.id} value={b.id} className="text-lg py-3 cursor-pointer">
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="pt-4 text-center">
                                <p className="text-xs text-neutral-400">
                                    V 2.0.0 (Unified)
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: CREDENTIALS */}
                    {step === 'credentials' && (
                        <form onSubmit={handleLogin} className="space-y-6">

                            {/* Branch Display (Read Only) */}
                            <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg border border-orange-100 mb-4">
                                <div className="flex items-center space-x-2 text-orange-700">
                                    <Store className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {BRANCHES.find(b => b.id === selectedBranch)?.name}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-orange-500 hover:text-orange-700 h-6"
                                    onClick={() => setStep('branch')}
                                    type="button"
                                >
                                    Ubah
                                </Button>
                            </div>

                            {/* Username */}
                            <div className="relative group">
                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block ml-1">
                                    Username Kasir
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                    <Input
                                        name="username"
                                        placeholder="Contoh: kasir1"
                                        className="pl-12 h-14 text-lg bg-neutral-50 border-neutral-200 rounded-xl focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* PIN (Virtual Numpad) */}
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block ml-1">
                                        PIN Keamanan
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                        <Input
                                            type="password"
                                            name="pin_display"
                                            value={pin}
                                            readOnly
                                            placeholder="Masukkan PIN"
                                            className="pl-12 h-14 text-lg bg-neutral-50 border-neutral-200 rounded-xl font-mono tracking-widest"
                                        />
                                    </div>
                                </div>

                                {/* Numpad Grid */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                        <Button
                                            key={num}
                                            type="button"
                                            variant="outline"
                                            className="h-12 text-lg font-medium border-neutral-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors rounded-xl"
                                            onClick={() => handleNumpad(num.toString())}
                                        >
                                            {num}
                                        </Button>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="h-12 text-lg font-medium bg-red-500 hover:bg-red-600 border-0 rounded-xl"
                                        onClick={() => handleNumpad('C')}
                                    >
                                        C
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 text-lg font-medium border-neutral-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 rounded-xl"
                                        onClick={() => handleNumpad('0')}
                                    >
                                        0
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 text-lg font-medium border-neutral-200 bg-neutral-100 hover:bg-neutral-200 rounded-xl"
                                        onClick={() => handleNumpad('back')}
                                    >
                                        ←
                                    </Button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30 rounded-xl transition-all active:scale-[0.98]"
                                disabled={isLoading || !selectedBranch || !pin}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Memverifikasi...
                                    </>
                                ) : 'Masuk ke POS'}
                            </Button>

                            {/* Help Text */}
                            <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100/50">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Info className="w-4 h-4 text-yellow-600" />
                                    <span className="text-xs font-bold text-yellow-700">Info Login Demo</span>
                                </div>
                                <p className="text-xs text-yellow-600/80">
                                    User: <strong>kasir1</strong> &bull; PIN: <strong>123456</strong>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </Card>
        </div>
    );
}
