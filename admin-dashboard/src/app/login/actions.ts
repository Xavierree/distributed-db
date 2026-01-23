'use server';

import { createClient } from '@/utils/supabase/server';

interface LoginResult {
    success?: boolean;
    error?: string;
    user?: {
        id: string;
        username: string;
        fullName: string;
        role: string;
        email: string;
    };
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email dan Password harus diisi' };
    }

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || supabaseUrl.includes('your-project') || supabaseUrl.includes('your_')) {
        return { error: 'Supabase URL belum dikonfigurasi. Periksa file .env (NEXT_PUBLIC_SUPABASE_URL)' };
    }

    if (!supabaseKey || supabaseKey.includes('your_') || supabaseKey.length < 100) {
        return { error: 'Supabase Anon Key belum dikonfigurasi. Periksa file .env (NEXT_PUBLIC_SUPABASE_ANON_KEY)' };
    }

    try {
        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Supabase auth error:', error);
            return { error: error.message };
        }

        if (!data.user) {
            return { error: 'User tidak ditemukan' };
        }

        // Fetch user profile from Supabase
        const { data: profile } = await supabase
            .from('profiles')
            .select('username, role, branch_id')
            .eq('id', data.user.id)
            .single();

        const role = profile?.role || 'SUPER_ADMIN';

        // Admin only - check role
        const adminRoles = ['SUPER_ADMIN', 'AREA_MANAGER', 'DIRECTOR', 'CEO'];
        if (!adminRoles.includes(role)) {
            await supabase.auth.signOut();
            return { error: 'Hanya Admin yang dapat mengakses Dashboard ini' };
        }

        return {
            success: true,
            user: {
                id: data.user.id,
                username: profile?.username || email.split('@')[0],
                fullName: data.user.user_metadata?.full_name || email.split('@')[0],
                role: role,
                email: data.user.email!
            }
        };
    } catch (error) {
        console.error('Login error:', error);
        return { error: 'Gagal login. Periksa koneksi internet dan konfigurasi Supabase.' };
    }
}

export async function logoutAction(): Promise<{ success: boolean }> {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: true };
    }
}

export async function getCurrentUser() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch {
        return null;
    }
}
