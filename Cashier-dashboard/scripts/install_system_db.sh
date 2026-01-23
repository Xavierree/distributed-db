#!/bin/bash
set -e

echo "=== Setting up Local Database (PostgreSQL) ==="

# 1. Install PostgreSQL
echo "[1/4] Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
else
    echo "PostgreSQL already installed."
fi

# 2. Start Service
echo "[2/4] Ensuring Service is Running..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Configure User Password
echo "[3/4] Configuring 'postgres' user..."
# This sets the password to 'postgres' to match the .env configuration
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# 4. Create Database
echo "[4/4] Creating 'retail_local_pos' database..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw retail_local_pos; then
    echo "Database 'retail_local_pos' already exists."
else
    sudo -u postgres createdb retail_local_pos
    echo "Database created successfully."
fi

echo "=== Setup Complete! ==="
echo "You can now run: bun run scripts/setup-local-db.ts"
