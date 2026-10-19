"""Sincroniza goles y asistencias de la plantilla del Sevilla (LaLiga)."""

from main import SEVILLA_FD_ID, fd_get, get_temporada_id, supabase

# Mismo nombre de competición que usa la API en los partidos
COMPETICION = "Primera Division"


def sync_goleadores():
    temporada_id = get_temporada_id()

    # Jugadores guardados en Supabase: id de football-data -> id interno
    res = supabase.table("jugadores").select("id, fd_id").execute()
    ids_internos = {j["fd_id"]: j["id"] for j in res.data if j["fd_id"]}

    data = fd_get("/competitions/PD/scorers", {"limit": 300})
    del_sevilla = {
        s["player"]["id"]: s
        for s in data.get("scorers", [])
        if s["team"]["id"] == SEVILLA_FD_ID
    }

    filas = []
    for fd_id, jugador_id in ids_internos.items():
        s = del_sevilla.get(fd_id)
        filas.append(
            {
                "jugador_id": jugador_id,
                "temporada_id": temporada_id,
                "competicion": COMPETICION,
                "goles": (s.get("goals") or 0) if s else 0,
                "asistencias": (s.get("assists") or 0) if s else 0,
            }
        )

    if filas:
        supabase.table("estadisticas_jugador").upsert(
            filas, on_conflict="jugador_id,temporada_id,competicion"
        ).execute()

    return {
        "jugadores_con_estadisticas": len(filas),
        "goleadores_del_sevilla": len(del_sevilla),
    }