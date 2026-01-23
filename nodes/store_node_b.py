
import os
import time
import json
from supabase import create_client, Client

# CONFIGURATION
STORE_B_URL = "https://whmhtvszclxijvcbhhrc.supabase.co"
STORE_B_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWh0dnN6Y2x4aWp2Y2JoaHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODk3MzcsImV4cCI6MjA4MDI2NTczN30.vgcOjB1YtMs4r3SQ6BL6NBBxcAI19zjKddti26pa5yk"

CENTRAL_URL = "https://xtozudafcxzezwnydzsz.supabase.co/"
CENTRAL_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0b3p1ZGFmY3h6ZXp3bnlkenN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjU1MTIsImV4cCI6MjA4NDE0MTUxMn0.y11kN8LLZfM7DMCMxGEgx8XunWgDNNoiJv1LEFCARgM"

def sync_transactions():
    print(f"🤖 [Node BDG-001] Starting Sync Worker...")
    print(f"    Source: {STORE_B_URL}")
    print(f"    Target: {CENTRAL_URL}")

    store_client = create_client(STORE_B_URL, STORE_B_KEY)
    central_client = create_client(CENTRAL_URL, CENTRAL_KEY)

    while True:
        try:
            # Poll recently created transactions
            response = store_client.table('transactions').select("*").order('created_at', desc=True).limit(5).execute()
            local_txs = response.data

            for tx in local_txs:
                # Check for existence in Central
                check = central_client.table('transactions').select('transaction_uuid').eq('transaction_uuid', tx['transaction_uuid']).execute()
                
                if len(check.data) == 0:
                    print(f"    🚀 Syncing {tx['transaction_uuid']} -> Central...")
                    
                    payload = tx.copy()
                    if 'synced' in payload: del payload['synced']
                    
                    central_client.table('transactions').insert(payload).execute()
                    
                    items_resp = store_client.table('transaction_items').select('*').eq('transaction_uuid', tx['transaction_uuid']).execute()
                    if items_resp.data:
                         central_client.table('transaction_items').insert(items_resp.data).execute()
                    
                    print(f"       ✅ Synced!")
            
            time.sleep(5) 
            
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    sync_transactions()
