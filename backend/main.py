import os
from fastapi import FastAPI
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

app = FastAPI(title="SFC Tracker API")


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "SFC Tracker API funcionando"}


@app.get("/db-check")
def db_check():
    response = supabase.table("temporadas").select("*").execute()
    return {"conectado": True, "temporadas_encontradas": len(response.data)}