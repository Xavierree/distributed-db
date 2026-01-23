
import os
import time
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from Dashboard (where all keys are)
# Ideally we load specific keys, but for demo we can hardcode or read from a config
# Let's assume we pass these in or read from a .env file locally

# CONFIGURATION
# Need to be filled with actual keys from .env
STORE_A_URL = "https://tlqkjpghtkylgdqmximg.supabase.co"
STORE_A_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscWtqcGdodGt5bGdkcW14aW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODgzNDYsImV4cCI6MjA4MDI2NDM0Nn0.nW3OWEl-_lqcqgdqiF2bnRlaRMk8lOF7uYM8CbLGP98"

CENTRAL_URL = "https://xtozudafcxzezwnydzsz.supabase.co/" # Central HQ
CENTRAL_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0b3p1ZGFmY3h6ZXp3bnlkenN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjU1MTIsImV4cCI6MjA4NDE0MTUxMn0.y11kN8LLZfM7DMCMxGEgx8XunWgDNNoiJv1LEFCARgM" # Central Anon/Service Key

def sync_transactions():
    print(f"🤖 [Node JKT-001] Starting Sync Worker...")
    print(f"    Source: {STORE_A_URL}")
    print(f"    Target: {CENTRAL_URL}")

    store_client = create_client(STORE_A_URL, STORE_A_KEY)
    central_client = create_client(CENTRAL_URL, CENTRAL_KEY)

    while True:
        try:
            # 1. Fetch unsynced transactions (where synced=false or not present in central)
            # Simpler: Get last 10 transactions, check if exist in Central
            
            # Better: The POS app creates them with 'synced' = false? 
            # Or we just check existence.
            
            # Let's limit check to 'today' for performance in this demo
            response = store_client.table('transactions').select("*").order('created_at', desc=True).limit(5).execute()
            local_txs = response.data

            for tx in local_txs:
                # Check if exists in Central
                check = central_client.table('transactions').select('transaction_uuid').eq('transaction_uuid', tx['transaction_uuid']).execute()
                
                if len(check.data) == 0:
                    print(f"    🚀 Syncing {tx['transaction_uuid']} -> Central...")
                    
                    # 2. Insert Header
                    # We might need to clean up payload if schemas differ slightly
                    payload = tx.copy()
                    # Remove any extra columns like 'synced' if they don't exist in Central schema
                    if 'synced' in payload: del payload['synced']
                    
                    central_client.table('transactions').insert(payload).execute()
                    
                    # 3. Sync Items
                    # Fetch items for this tx
                    items_resp = store_client.table('transaction_items').select('*').eq('transaction_uuid', tx['transaction_uuid']).execute()
                    if items_resp.data:
                         central_client.table('transaction_items').insert(items_resp.data).execute()
                    
                    print(f"       ✅ Synced!")
                else:
                    # Already synced
                    pass
            
            time.sleep(5) # Poll every 5 seconds
            
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    sync_transactions()
