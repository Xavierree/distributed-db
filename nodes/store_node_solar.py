import time
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class StoreNodeSolar:
    def __init__(self):
        self.code = "A" 
        self.store_id = "TOKO_SOLAR" 
        self.url = os.environ.get("SUPABASE_URL_A") or os.environ.get("NEXT_PUBLIC_STORE_A_URL")
        self.key = os.environ.get("SUPABASE_KEY_A") or os.environ.get("NEXT_PUBLIC_STORE_A_KEY")

        print(f"\n=== [NODE {self.store_id}] ===")
        print(f"Koneksi Cloud: {self.url}")
        
        try:
            self.supabase: Client = create_client(self.url, self.key)
            self.processed_requests = set()
        except Exception as e:
            print(f"Error Koneksi: {e}")
            sys.exit(1)

    def process_computation(self, category_request, agg_type):
        print(f"   > Query Database untuk Kategori: '{category_request}'...")
        
        values = []

        if category_request == "ALL":
             # Query Header for Total Revenue
             response = self.supabase.table("transactions").select("grand_total").execute()
             items = response.data
             values = [float(item['grand_total']) for item in items]
        else:
             # Query Detail View for Category Revenue
             query = self.supabase.table("view_transaction_details").select("item_total").eq("category", category_request)
             response = query.execute()
             items = response.data
             values = [float(item['item_total']) for item in items]
        
        if not values:
            print("     ! Data kosong.")
            return 0

        # Hitung Agregasi
        result = 0
        if agg_type == 'SUM': result = sum(values)
        elif agg_type == 'AVG': result = sum(values) / len(values)
        elif agg_type == 'MAX': result = max(values)
        elif agg_type == 'MIN': result = min(values)
        elif agg_type == 'COUNT': result = len(values)
            
        print(f"   > Hasil {agg_type}: {result}")
        return result

    def listen_and_process(self):
        print("Menunggu perintah...")
        while True:
            try:
                requests = self.supabase.table("command_requests")\
                    .select("*")\
                    .order("created_at", desc=True)\
                    .limit(1)\
                    .execute()

                if requests.data:
                    req = requests.data[0]
                    req_id = req['request_id']

                    if req_id not in self.processed_requests:
                        self.processed_requests.add(req_id)
                        
                        category = req['payload'].get('category', 'ALL')
                        agg_type = req['payload'].get('agg_type', 'SUM')
                        
                        val = self.process_computation(category, agg_type)
                        
                        self.supabase.table("command_results").insert({
                            "request_id": req_id,
                            "store_id": self.store_id,
                            "result_data": { "value": val, "agg_type": agg_type }
                        }).execute()
                        print(f"   > Selesai.\n")
                
                time.sleep(1) 
            except Exception as e:
                print(f"Error loop: {e}")
                time.sleep(5)

if __name__ == "__main__":
    node = StoreNodeSolar()
    node.listen_and_process()