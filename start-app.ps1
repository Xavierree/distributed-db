# ===============================================
# DISTRIBUTED DATABASE SYSTEM - STARTUP SCRIPT
# PowerShell (Windows) Version
# ===============================================

$ErrorActionPreference = "Stop"

# Try to set encoding, but don't fail if it doesn't work
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch { }

# Track running processes (Script scope)
$script:processes = @()

function Stop-AllServices {
    Write-Host ""
    Write-Host "STOP: Stopping all services..."

    foreach ($proc in $script:processes) {
        if ($proc -and (-not $proc.HasExited)) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }

    Write-Host "DONE: All services stopped."
    exit
}

# Handle Ctrl + C and shell exit
$null = Register-EngineEvent PowerShell.Exiting -Action { Stop-AllServices }
$null = Register-EngineEvent Console_CancelKeyPress -Action { Stop-AllServices }

# Main Execution
try {
    Write-Host ""
    Write-Host "STARTING Distributed Database System..."
    Write-Host "=========================================="

    # Pre-flight checks
    if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
        Write-Error "CRITICAL: 'python' is not installed or not in PATH."
        Write-Host "Please install Python from https://python.org or add it to your PATH."
        exit 1
    }
    if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
        Write-Error "CRITICAL: 'npm' (Node.js) is not installed or not in PATH."
        Write-Host "Please install Node.js from https://nodejs.org or add it to your PATH."
        exit 1
    }

    # -----------------------------------------------
    # 1. Start Python Nodes
    # -----------------------------------------------
    Write-Host "Starting Store Nodes..."

    if (Test-Path "nodes/requirements.txt") {
        # Use python -m pip for better reliability
        python -m pip install -r nodes/requirements.txt | Out-Null
    } else {
        Write-Warning "nodes/requirements.txt not found. Skipping pip install."
    }

    Write-Host "   Node JKT-001 (Target: Store A -> Central)..."
    $nodeAParams = @{
        FilePath               = "python"
        ArgumentList           = "nodes/store_node_a.py"
        RedirectStandardOutput = "nodes/solar.log"
        RedirectStandardError  = "nodes/solar-error.log"
        NoNewWindow            = $true
        PassThru               = $true
    }
    $nodeA = Start-Process @nodeAParams
    $script:processes += $nodeA

    Write-Host "   Node BDG-001 (Target: Store B -> Central)..."
    $nodeBParams = @{
        FilePath               = "python"
        ArgumentList           = "nodes/store_node_b.py"
        RedirectStandardOutput = "nodes/gyu.log"
        RedirectStandardError  = "nodes/gyu-error.log"
        NoNewWindow            = $true
        PassThru               = $true
    }
    $nodeB = Start-Process @nodeBParams
    $script:processes += $nodeB

    # -----------------------------------------------
    # 2. Start Admin Dashboard
    # -----------------------------------------------
    Write-Host "Starting Admin Dashboard (Port 3001)..."
    if (Test-Path "admin-dashboard") {
        Push-Location "admin-dashboard"

        $adminParams = @{
            FilePath               = "cmd.exe"
            ArgumentList           = @("/c", "npm run dev -- -p 3001")
            RedirectStandardOutput = "admin.log"
            RedirectStandardError  = "admin-error.log"
            NoNewWindow            = $true
            PassThru               = $true
        }
        $admin = Start-Process @adminParams
        $script:processes += $admin

        Pop-Location
        Write-Host "   OK: Admin Dashboard running at http://localhost:3001 (Logs: admin-dashboard/admin.log)"
    } else {
        Write-Warning "admin-dashboard directory not found."
    }

    # -----------------------------------------------
    # 3. Start Consolidated Cashier POS
    # -----------------------------------------------
    Write-Host "Starting Consolidated Cashier POS (Port 3000)..."
    if (Test-Path "Cashier-dashboard") {
        Push-Location "Cashier-dashboard"

        $posParams = @{
            FilePath               = "cmd.exe"
            ArgumentList           = @("/c", "npm run dev -- -p 3000")
            RedirectStandardOutput = "pos.log"
            RedirectStandardError  = "pos-error.log"
            NoNewWindow            = $true
            PassThru               = $true
        }
        $pos = Start-Process @posParams
        $script:processes += $pos

        Pop-Location
        Write-Host "   OK: Cashier POS running at http://localhost:3000 (Logs: Cashier-dashboard/pos.log)"
    } else {
        Write-Warning "Cashier-dashboard directory not found."
    }

    # -----------------------------------------------
    # Final Status
    # -----------------------------------------------
    Write-Host "=========================================="
    Write-Host "All systems GO!"
    Write-Host "   - Admin Dashboard: http://localhost:3001"
    Write-Host "   - Cashier App:     http://localhost:3000"
    Write-Host ""
    Write-Host "   - Logs: nodes/solar.log, nodes/gyu.log"
    Write-Host "Press Ctrl+C to stop all services."

    # Keep script alive
    while ($true) {
        Start-Sleep -Seconds 1
    }

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.InvocationInfo) {
        Write-Host "At line: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Red
    }
    exit 1
}