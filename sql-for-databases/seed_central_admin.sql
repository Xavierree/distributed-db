-- ==================================================
-- MANUAL ADMIN CREATION STEP
-- 1. Go to Supabase Dashboard -> Authentication -> Users
-- 2. Click "Add User", Enter email: admin@alfamart.com, Pass: admin123
-- 3. THEN run this SQL in the SQL Editor to give it permission:
-- ==================================================

INSERT INTO public.profiles (id, email, username, role, full_name)
SELECT 
    id, 
    email, 
    'admin', 
    'SUPER_ADMIN', 
    'Super Administrator'
FROM auth.users
WHERE email = 'admin@alfamart.com';
