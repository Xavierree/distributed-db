#!/bin/bash

# ===============================================
# DISTRIBUTED DATABASE SYSTEM - STARTUP SCRIPT
# ===============================================

cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "🚀 Starting Distributed Database System..."
echo "=========================================="

# 1. Start Python Nodes (Background Sync)
echo "📦 Starting Store Nodes..."
pip install -r nodes/requirements.txt > /dev/null 2>&1

echo "   🤖 Node JKT-001 (Target: Store A -> Central)..."
python3 nodes/store_node_a.py > nodes/solar.log 2>&1 &

echo "   🤖 Node BDG-001 (Target: Store B -> Central)..."
python3 nodes/store_node_b.py > nodes/gyu.log 2>&1 &

# 2. Start Admin Dashboard
echo "📊 Starting Admin Dashboard (Port 3001)..."
cd admin-dashboard
npm run dev -- -p 3001 > admin.log 2>&1 &
ADMIN_PID=$!
cd ..
echo "   ✅ Admin Dashboard running at http://localhost:3001 (Logs: admin-dashboard/admin.log)"

# 3. Start Consolidated Cashier POS
echo "🛒 Starting Consolidated Cashier POS (Port 3000)..."
cd Cashier-dashboard
npm run dev -- -p 3000 > pos.log 2>&1 &
POS_PID=$!
cd ..
echo "   ✅ Cashier POS running at http://localhost:3000 (Logs: Cashier-dashboard/pos.log)"

echo "=========================================="
echo "🌟 All systems GO!"
echo "   - Admin Dashboard: http://localhost:3001"
echo "   - Cashier App:     http://localhost:3000"
echo ""
echo "   - Logs: nodes/solar.log, nodes/gyu.log"
echo "Press Ctrl+C to stop all services."

wait
