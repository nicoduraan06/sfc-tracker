"""Calcula los puntos de la porra y el total de cada usuario."""

from main import get_temporada_id, supabase

PUNTOS_EXACTO = 3
PUNTOS_SIGNO = 1


def _signo(a: int, b: int) -> int:
    return (a > b) - (a < b)


def calcular_puntos(pron_local, pron_visit, real_local, real_visit) -> int:
    if pron_local == real_local and pron_visit == real_visit:
        return PUNTOS_EXACTO
    if _signo(pron_local, pron_visit) == _signo(real_local, real_visit):
        return PUNTOS_SIGNO
    return 0


def sync_puntos():
    temporada_id = get_temporada_id()

    # Partidos terminados de la temporada, con el resultado real como (local, visitante)
    partidos = (
        supabase.table("partidos")
        .select("id, es_local, goles_sevilla, goles_rival")
        .eq("temporada_id", temporada_id)
        .eq("estado", "finalizado")
        .execute()
        .data
    )

    reales = {}
    for p in partidos:
        if p["goles_sevilla"] is None or p["goles_rival"] is None:
            continue
        if p["es_local"]:
            reales[p["id"]] = (p["goles_sevilla"], p["goles_rival"])
        else:
            reales[p["id"]] = (p["goles_rival"], p["goles_sevilla"])

    if not reales:
        return {"porras_actualizadas": 0, "usuarios_actualizados": 0}

    porras = (
        supabase.table("porras")
        .select(
            "id, usuario_id, partido_id, goles_local, goles_visitante, puntos_obtenidos"
        )
        .in_("partido_id", list(reales))
        .execute()
        .data
    )

    totales: dict[str, int] = {}
    porras_actualizadas = 0
    for p in porras:
        real_local, real_visit = reales[p["partido_id"]]
        puntos = calcular_puntos(
            p["goles_local"], p["goles_visitante"], real_local, real_visit
        )
        totales[p["usuario_id"]] = totales.get(p["usuario_id"], 0) + puntos
        if p["puntos_obtenidos"] != puntos:
            supabase.table("porras").update({"puntos_obtenidos": puntos}).eq(
                "id", p["id"]
            ).execute()
            porras_actualizadas += 1

    usuarios = (
        supabase.table("usuarios")
        .select("id, puntos_totales_temporada_actual")
        .execute()
        .data
    )
    usuarios_actualizados = 0
    for u in usuarios:
        total = totales.get(u["id"], 0)
        if u["puntos_totales_temporada_actual"] != total:
            supabase.table("usuarios").update(
                {"puntos_totales_temporada_actual": total}
            ).eq("id", u["id"]).execute()
            usuarios_actualizados += 1

    return {
        "porras_actualizadas": porras_actualizadas,
        "usuarios_actualizados": usuarios_actualizados,
    }