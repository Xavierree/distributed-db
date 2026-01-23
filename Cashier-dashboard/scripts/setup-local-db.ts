import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'retail_local_pos',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
});

const schemaSql = `
-- Enable UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 1. STORE CONFIG & LOCAL USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS store_config (
    config_id       SERIAL PRIMARY KEY,
    branch_id       INT NOT NULL,
    branch_code     VARCHAR(20) NOT NULL,
    store_name      VARCHAR(100),
    store_address   TEXT,
    last_sync_ts    TIMESTAMPTZ,
    app_version     VARCHAR(20) DEFAULT '1.0.0'
);

DROP TABLE IF EXISTS users_local CASCADE;
CREATE TABLE IF NOT EXISTS users_local (
    user_id         BIGINT PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(100),
    pin_hash        VARCHAR(255),
    role            VARCHAR(20),
    full_name       VARCHAR(100),
    branch_id       INT,
    is_active       BOOLEAN DEFAULT TRUE
);

-- =========================================================
-- 2. PRODUCTS (Synced from TiDB Cloud)
-- =========================================================

CREATE TABLE IF NOT EXISTS products_local (
    product_id      BIGINT PRIMARY KEY,
    barcode         VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(200) NOT NULL,
    price           NUMERIC(15, 2) NOT NULL,
    tax_rate        NUMERIC(5, 2) DEFAULT 0,
    category        VARCHAR(50),
    stock           INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_local (
    inv_id          BIGSERIAL PRIMARY KEY,
    product_id      BIGINT REFERENCES products_local(product_id),
    qty_on_hand     INT DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 3. CASH SHIFTS & TRANSACTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS cash_shifts (
    shift_id        BIGSERIAL PRIMARY KEY,
    branch_id       INT NOT NULL,
    user_id         BIGINT REFERENCES users_local(user_id),
    start_time      TIMESTAMPTZ DEFAULT NOW(),
    end_time        TIMESTAMPTZ,
    start_cash      NUMERIC(15, 2) DEFAULT 0,
    end_cash_actual NUMERIC(15, 2) DEFAULT 0,
    end_cash_system NUMERIC(15, 2) DEFAULT 0,
    variance        NUMERIC(15, 2) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'OPEN',
    synced          BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id        INT NOT NULL,
    shift_id         BIGINT REFERENCES cash_shifts(shift_id),
    user_id          BIGINT REFERENCES users_local(user_id),
    subtotal         NUMERIC(15, 2) NOT NULL,
    total_discount   NUMERIC(15, 2) DEFAULT 0,
    tax_amount       NUMERIC(15, 2) DEFAULT 0,
    grand_total      NUMERIC(15, 2) NOT NULL,
    payment_method   VARCHAR(50),
    payment_ref      VARCHAR(100),
    cash_received    NUMERIC(15, 2) DEFAULT 0,
    change_returned  NUMERIC(15, 2) DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    synced           BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS transaction_items (
    item_id          BIGSERIAL PRIMARY KEY,
    transaction_uuid UUID REFERENCES transactions(transaction_uuid),
    product_id       BIGINT REFERENCES products_local(product_id),
    qty              INT NOT NULL,
    price_at_sale    NUMERIC(15, 2) NOT NULL,
    discount_amount  NUMERIC(15, 2) DEFAULT 0,
    subtotal         NUMERIC(15, 2) NOT NULL,
    notes            VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS upload_queue (
    queue_id        BIGSERIAL PRIMARY KEY,
    table_name      VARCHAR(50) NOT NULL,
    record_uuid     UUID,
    record_id       BIGINT,
    operation       VARCHAR(10) NOT NULL,
    payload         JSONB NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    retry_count     INT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'PENDING',
    error_message   TEXT
);

CREATE TABLE IF NOT EXISTS defective_log (
    id SERIAL PRIMARY KEY,
    product_id INT,
    name VARCHAR(255),
    qty INT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function setup() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to PostgreSQL...');

        // 1. Create Tables
        console.log('🛠️ Creating tables...');
        await client.query(schemaSql);
        console.log('✅ Tables created successfully.');

        // 2. Seed Users
        console.log('👤 Seeding users...');
        await client.query(`
      INSERT INTO users_local (user_id, username, email, pin_hash, role, full_name, branch_id)
      VALUES 
      (9001, 'ceo_budi', 'ceo@retail.id', '1234', 'SUPER_ADMIN', 'Budi Santoso', 0),
      (9002, 'dir_siti', 'director@retail.id', '1234', 'SUPER_ADMIN', 'Siti Aminah', 0),
      (8001, 'am_joko', 'am.jkt@retail.id', '1234', 'AREA_MANAGER', 'Joko Anwar', 0),
      (8002, 'am_ridwan', 'am.bdg@retail.id', '1234', 'AREA_MANAGER', 'Ridwan Kamil KW', 0),
      (7001, 'spv_rina', 'spv.jkt@retail.id', '1234', 'STORE_LEADER', 'Rina Nose', 101),
      (7002, 'spv_sule', 'spv.bdg@retail.id', '1234', 'STORE_LEADER', 'Sule Prikitiw', 102),
      (1001, 'agus_kasir', 'kasir1.jkt@retail.id', '1234', 'CASHIER', 'Agus Kotak', 101),
      (1002, 'dewi_kasir', 'kasir2.jkt@retail.id', '1234', 'CASHIER', 'Dewi Persik', 101),
      (2001, 'andre_kasir', 'kasir1.bdg@retail.id', '1234', 'CASHIER', 'Andre Taulany', 102),
      (2002, 'nunung_kasir', 'kasir2.bdg@retail.id', '1234', 'CASHIER', 'Nunung', 102)
      ON CONFLICT (user_id) DO UPDATE 
      SET email = EXCLUDED.email, username = EXCLUDED.username, pin_hash = EXCLUDED.pin_hash, full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    `);

        // 3. Seed Products
        console.log('📦 Seeding products...');
        await client.query(`
      INSERT INTO products_local (product_id, barcode, name, price, category, stock)
      VALUES 
      (1001, '8998866200578', 'Indomie Goreng Original', 3500, 'Food', 100),
      (1002, '8999999195483', 'Aqua Botol 600ml', 4000, 'Beverage', 50),
      (1003, '8991002101115', 'Rokok Sampoerna Mild 16', 32000, 'Cigarette', 200),
      (1004, '8992775201004', 'Minyak Goreng Bimoli 2L', 45000, 'Household', 30),
      (1005, '8993053121034', 'Kopi Kenangan Mantan', 9500, 'Beverage', 40)
      ON CONFLICT (product_id) DO NOTHING;
    `);

        console.log('🎉 Database setup complete!');
    } catch (err) {
        console.error('❌ Error setting up database:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
