import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY")
FOOTBALL_DATA_KEY = os.environ.get("FOOTBALL_DATA_KEY")
FOOTBALL_DATA_BASE = "https://api.football-data.org/v4"

SEVILLA_FD_ID = 559
TEMPORADA_NOMBRE = "2026/2027"
TEMPORADA_FD_ANIO = 2026  # año de inicio, como lo usa football-data.org

# Estados de football-data.org -> estados de nuestra tabla `partidos`
ESTADOS = {
    "SCHEDULED": "programado",
    "TIMED": "programado",
    "POSTPONED": "programado",
    "SUSPENDED": "programado",
    "CANCELLED": "programado",
    "IN_PLAY": "en_directo",
    "PAUSED": "en_directo",
    "FINISHED": "finalizado",
    "AWARDED": "finalizado",
}

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

app = FastAPI(title="SFC Tracker API")


def fd_get(path: str, params: dict | None = None) -> dict:
    r = httpx.get(
        f"{FOOTBALL_DATA_BASE}{path}",
        headers={"X-Auth-Token": FOOTBALL_DATA_KEY},
        params=params,
        timeout=20,
    )
    if r.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail={"football_data_status": r.status_code, "respuesta": r.json()},
        )
    return r.json()


def get_temporada_id() -> str:
    res = (
        supabase.table("temporadas")
        .select("id")
        .eq("nombre", TEMPORADA_NOMBRE)
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=500,
            detail=f"No existe la temporada {TEMPORADA_NOMBRE} en Supabase",
        )
    return res.data[0]["id"]


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "SFC Tracker API funcionando"}


@app.get("/db-check")
def db_check():
    response = supabase.table("temporadas").select("*").execute()
    return {"conectado": True, "temporadas_encontradas": len(response.data)}


@app.post("/sync/plantilla")
def sync_plantilla():
    data = fd_get(f"/teams/{SEVILLA_FD_ID}")
    filas = [
        {
            "fd_id": j["id"],
            "nombre": j["name"],
            "posicion": j.get("position"),
            "activo": True,
        }
        for j in data.get("squad", [])
    ]
    if filas:
        supabase.table("jugadores").upsert(filas, on_conflict="fd_id").execute()
    return {"jugadores_sincronizados": len(filas)}


@app.post("/sync/partidos")
def sync_partidos():
    temporada_id = get_temporada_id()
    data = fd_get(
        f"/teams/{SEVILLA_FD_ID}/matches", {"season": TEMPORADA_FD_ANIO}
    )
    filas = []
    for m in data.get("matches", []):
        es_local = m["homeTeam"]["id"] == SEVILLA_FD_ID
        rival = m["awayTeam"] if es_local else m["homeTeam"]
        marcador = m["score"]["fullTime"]
        goles_local = marcador.get("home")
        goles_visitante = marcador.get("away")
        filas.append(
            {
                "fd_id": m["id"],
                "temporada_id": temporada_id,
                "rival": rival["name"],
                "fecha": m["utcDate"],
                "competicion": m["competition"]["name"],
                "es_local": es_local,
                "goles_sevilla": goles_local if es_local else goles_visitante,
                "goles_rival": goles_visitante if es_local else goles_local,
                "estado": ESTADOS.get(m["status"], "programado"),
            }
        )
    if filas:
        supabase.table("partidos").upsert(filas, on_conflict="fd_id").execute()
    return {"partidos_sincronizados": len(filas)}


@app.post("/sync/clasificacion")
def sync_clasificacion(jornada: int | None = None):
    temporada_id = get_temporada_id()
    params = {"matchday": jornada} if jornada else None
    data = fd_get("/competitions/PD/standings", params)

    total = next(s for s in data["standings"] if s["type"] == "TOTAL")
    jornada_real = (
        jornada
        or data["season"].get("currentMatchday")
        or max(f["playedGames"] for f in total["table"])
    )

    filas = [
        {
            "temporada_id": temporada_id,
            "equipo": f["team"]["name"],
            "jornada": jornada_real,
            "posicion": f["position"],
            "puntos": f["points"],
            "partidos_jugados": f["playedGames"],
            "ganados": f["won"],
            "empatados": f["draw"],
            "perdidos": f["lost"],
            "goles_favor": f["goalsFor"],
            "goles_contra": f["goalsAgainst"],
        }
        for f in total["table"]
    ]
    supabase.table("clasificacion_historico").upsert(
        filas, on_conflict="temporada_id,equipo,jornada"
    ).execute()
    return {"jornada": jornada_real, "equipos_sincronizados": len(filas)}