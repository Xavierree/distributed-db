import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
    { email: 'ceo@retail.id', password: 'Retail123!', name: 'Budi Santoso' },
    { email: 'director@retail.id', password: 'Retail123!', name: 'Siti Aminah' },
    { email: 'am.jkt@retail.id', password: 'Retail123!', name: 'Joko Anwar' },
    { email: 'am.bdg@retail.id', password: 'Retail123!', name: 'Ridwan Kamil KW' },
    { email: 'spv.jkt@retail.id', password: 'Retail123!', name: 'Rina Nose' },
    { email: 'spv.bdg@retail.id', password: 'Retail123!', name: 'Sule Prikitiw' },
    { email: 'kasir1.jkt@retail.id', password: 'Retail123!', name: 'Agus Kotak' },
    { email: 'kasir2.jkt@retail.id', password: 'Retail123!', name: 'Dewi Persik' },
    { email: 'kasir1.bdg@retail.id', password: 'Retail123!', name: 'Andre Taulany' },
    { email: 'kasir2.bdg@retail.id', password: 'Retail123!', name: 'Nunung' },
];

async function registerUsers() {
    console.log('Starting user registration...');

    for (const user of users) {
        console.log(`Registering ${user.email}...`);
        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                data: {
                    full_name: user.name,
                },
            },
        });

        if (error) {
            console.error(`Failed to register ${user.email}:`, error.message);
        } else {
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                console.log(`User ${user.email} already exists.`);
            } else {
                console.log(`Successfully registered ${user.email}. Please check if email confirmation is required.`);
            }
        }
    }
}

registerUsers();
