import os
from supabase import create_client, Client

url = 'https://jyriljfxvwyjuunainru.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5cmlsamZ4dnd5anV1bmFpbnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTMyMzIsImV4cCI6MjA5MjA4OTIzMn0.C6PN1gzCbnvJf6PhRJSQbDx39t7rLrveZFrTOJXNDqg'

supabase: Client = create_client(url, key)

try:
    print("Checking 'classes' table...")
    res = supabase.table("classes").select("*").limit(1).execute()
    print("Classes table exists.")
    
    print("Testing insertion...")
    res = supabase.table("classes").insert({"name": "Test Class"}).execute()
    print("Insertion successful:", res.data)
except Exception as e:
    print("Error:", e)
