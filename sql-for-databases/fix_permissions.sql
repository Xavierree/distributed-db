-- =========================================================
-- FIX RLS POLICIES (Run on Central HQ Supabase)
-- This allows the POS (running as 'anon') to read/write data.
-- =========================================================

-- 1. Enable RLS on all tables (Best Practice)
ALTER TABLE branches FORCE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE transaction_items FORCE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts FORCE ROW LEVEL SECURITY;

-- 2. Create Policies for Public/Anon Access
-- (For a stricter production app, you would require authentication, 
-- but for this migration phase, we allow anon access to working tables)

-- BRANCHES (Read Only)
DROP POLICY IF EXISTS "Public Read Branches" ON branches;
CREATE POLICY "Public Read Branches" ON branches FOR SELECT USING (true);

-- PROFILES (Read for Login)
DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);
-- Allow creating profile if needed manually, but usually server-side.
DROP POLICY IF EXISTS "Public Insert Profiles" ON profiles;
CREATE POLICY "Public Insert Profiles" ON profiles FOR INSERT WITH CHECK (true);

-- PRODUCTS (Read Only for POS, Write for Admin)
DROP POLICY IF EXISTS "Public Read Products" ON products;
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Write Products" ON products;
CREATE POLICY "Public Write Products" ON products FOR ALL USING (true);

-- TRANSACTIONS (Read/Write for POS)
DROP POLICY IF EXISTS "Public Access Transactions" ON transactions;
CREATE POLICY "Public Access Transactions" ON transactions FOR ALL USING (true);

-- TRANSACTION ITEMS (Read/Write for POS)
DROP POLICY IF EXISTS "Public Access Transaction Items" ON transaction_items;
CREATE POLICY "Public Access Transaction Items" ON transaction_items FOR ALL USING (true);

-- CASH SHIFTS (Read/Write)
DROP POLICY IF EXISTS "Public Access Cash Shifts" ON cash_shifts;
CREATE POLICY "Public Access Cash Shifts" ON cash_shifts FOR ALL USING (true);
