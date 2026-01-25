# ===============================================
# DISTRIBUTED DATABASE SYSTEM - STARTUP SCRIPT
# PowerShell (Windows) Version
# ===============================================

$ErrorActionPreference = "Stop"

Write-Host ''
Write-Host '🚀 Starting Distributed Database System...'
Write-Host '=========================================='

# Track running processes
$processes = @()

function Cleanup {
    Write-Host ''
    Write-Host '🛑 Stopping all services...'

    foreach ($proc in $processes) {
        if ($proc -and !$proc.HasExited) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }

    Write-Host '✅ All services stopped.'
    exit
}

# Handle Ctrl + C and shell exit
$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }
$null = Register-EngineEvent Console_CancelKeyPress -Action { Cleanup }

# -----------------------------------------------
# 1. Start Python Nodes
# -----------------------------------------------
Write-Host '📦 Starting Store Nodes...'

pip install -r nodes/requirements.txt | Out-Null

Write-Host '   🤖 Node JKT-001 (Target: Store A -> Central)...'
$nodeA = Start-Process `
    -FilePath python `
    -ArgumentList 'nodes/store_node_a.py' `
    -RedirectStandardOutput 'nodes/solar.log' `
    -RedirectStandardError 'nodes/solar.log' `
    -NoNewWindow `
    -PassThru
$processes += $nodeA

Write-Host '   🤖 Node BDG-001 (Target: Store B -> Central)...'
$nodeB = Start-Process `
    -FilePath python `
    -ArgumentList 'nodes/store_node_b.py' `
    -RedirectStandardOutput 'nodes/gyu.log' `
    -RedirectStandardError 'nodes/gyu.log' `
    -NoNewWindow `
    -PassThru
$processes += $nodeB

# -----------------------------------------------
# 2. Start Admin Dashboard
# -----------------------------------------------
Write-Host '📊 Starting Admin Dashboard (Port 3001)...'
Push-Location 'admin-dashboard'

$admin = Start-Process `
    -FilePath npm `
    -ArgumentList 'run dev -- -p 3001' `
    -RedirectStandardOutput 'admin.log' `
    -RedirectStandardError 'admin.log' `
    -NoNewWindow `
    -PassThru
$processes += $admin

Pop-Location

Write-Host '   ✅ Admin Dashboard running at http://localhost:3001 (Logs: admin-dashboard/admin.log)'

# -----------------------------------------------
# 3. Start Consolidated Cashier POS
# -----------------------------------------------
Write-Host '🛒 Starting Consolidated Cashier POS (Port 3000)...'
Push-Location 'Cashier-dashboard'

$pos = Start-Process `
    -FilePath npm `
    -ArgumentList 'run dev -- -p 3000' `
    -RedirectStandardOutput 'pos.log' `
    -RedirectStandardError 'pos.log' `
    -NoNewWindow `
    -PassThru
$processes += $pos

Pop-Location

Write-Host '   ✅ Cashier POS running at http://localhost:3000 (Logs: Cashier-dashboard/pos.log)'

# -----------------------------------------------
# Final Status
# -----------------------------------------------
Write-Host '=========================================='
Write-Host '🌟 All systems GO!'
Write-Host '   - Admin Dashboard: http://localhost:3001'
Write-Host '   - Cashier App:     http://localhost:3000'
Write-Host ''
Write-Host '   - Logs: nodes/solar.log, nodes/gyu.log'
Write-Host 'Press Ctrl+C to stop all services.'

# Keep script alive (PowerShell equivalent of `wait`)
while ($true) {
    Start-Sleep -Seconds 1
}
