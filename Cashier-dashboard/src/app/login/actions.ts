'use server';

import { createClient } from '@supabase/supabase-js';

// CENTRAL HQ CREDENTIALS (Hardcoded for Login Only)
// In production, these should be separate ENV variables like NEXT_PUBLIC_CENTRAL_URL
const CENTRAL_URL = "https://xtozudafcxzezwnydzsz.supabase.co/";
const CENTRAL_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0b3p1ZGFmY3h6ZXp3bnlkenN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjU1MTIsImV4cCI6MjA4NDE0MTUxMn0.y11kN8LLZfM7DMCMxGEgx8XunWgDNNoiJv1LEFCARgM";

interface LoginResult {
    success?: boolean;
    error?: string;
    user?: {
        id: string;
        username: string;
        fullName: string;
        role: string;
        branchId: number;
        email?: string;
    };
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
    const username = formData.get('username') as string;
    const pin = formData.get('pin') as string;
    const branch = formData.get('branch') as string;

    if (!username || !pin || !branch) {
        return { error: 'Username, PIN, dan Cabang harus diisi' };
    }

    try {
        // Init Supabase Client (Direct to Central HQ)
        const supabase = createClient(CENTRAL_URL, CENTRAL_KEY);

        console.log(`[LOGIN] Attempting login for ${username} at branch ${branch} via Central HQ`);

        // 1. Query Profile from Central DB
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !profile) {
            console.error('[LOGIN] User not found (Central):', error);
            // Fallback: Check local if offline? For now, distributed depends on Central for auth.
            return { error: 'User tidak ditemukan atau tidak terdaftar di sistem pusat.' };
        }

        // 2. Verify PIN
        if (profile.pin !== pin) {
            return { error: 'PIN salah' };
        }

        // 3. Verify Role
        const allowedRoles = ['CASHIER', 'STORE_LEADER', 'STORE_MANAGER', 'STAFF'];
        if (!allowedRoles.includes(profile.role)) {
            return { error: 'Role anda tidak memiliki akses ke POS' };
        }

        const sessionUser = {
            id: profile.id, // UUID
            username: profile.username,
            fullName: profile.full_name || profile.username,
            role: profile.role,
            branchId: parseInt(branch), // Use selected branch (101/102) instead of profile.branch_id (might be legacy 1/2)
            email: profile.email
        };

        return {
            success: true,
            user: sessionUser
        };

    } catch (error) {
        console.error('Login error:', error);
        return { error: 'Gagal login. Terjadi kesalahan sistem pusat.' };
    }
}

export async function logoutAction(): Promise<{ success: boolean }> {
    return { success: true };
}
