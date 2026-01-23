-- =========================================================
-- RENAME STORES (Run on Central HQ Supabase)
-- =========================================================

-- We update the existing rows to preserve their branch_id (101, 102)
-- so we don't break the POS configuration.

UPDATE branches 
SET branch_code = 'TOKO_JKT1', name = 'Alfamart JKT-001 Branch' 
WHERE branch_code = 'TOKO_SOLAR';

UPDATE branches 
SET branch_code = 'TOKO_BDG1', name = 'Alfamart BDG-001 Branch' 
WHERE branch_code = 'TOKO_GYU';

-- Verify the change
SELECT * FROM branches;
