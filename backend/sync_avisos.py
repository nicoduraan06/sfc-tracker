"""Envía las notificaciones push (OneSignal): partido próximo, porra abierta y resultado final.

Se ejecuta dentro de sync_all.py, cada 30 minutos desde GitHub Actions.
Cada aviso se registra en la tabla `notificaciones_enviadas` para no repetirlo.

Prueba segura: con la variable AVISOS_SOLO_PARA=<nombre> solo se avisa a ese usuario.
"""

import os
import sys
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import httpx

from main import get_temporada_id, supabase

ONESIGNAL_APP_ID = "f09f9903-075f-486d-aac1-773b12f9e475"  # público
ONESIGNAL_API_KEY = os.environ.get("ONESIGNAL_API_KEY")  # secreto
WEB = "https://sfc-tracker.vercel.app"
MADRID = ZoneInfo("Europe/Madrid")
DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


def _inicio(p: dict) -> datetime:
    return datetime.fromisoformat(p["fecha"].replace("Z", "+00:00"))


def _equipos(p: dict) -> tuple[str, str]:
    return ("Sevilla FC", p["rival"]) if p["es_local"] else (p["rival"], "Sevilla FC")


def _marcador(p: dict) -> str:
    local, visitante = _equipos(p)
    if p["es_local"]:
        goles_local, goles_visitante = p["goles_sevilla"], p["goles_rival"]
    else:
        goles_local, goles_visitante = p["goles_rival"], p["goles_sevilla"]
    return f"{local} {goles_local}-{goles_visitante} {visitante}"


def _reservar(clave: str) -> bool:
    """Apunta el aviso como enviado. True solo la primera vez (entonces hay que enviarlo)."""
    res = (
        supabase.table("notificaciones_enviadas")
        .upsert({"clave": clave}, on_conflict="clave", ignore_duplicates=True)
        .execute()
    )
    return bool(res.data)


def _liberar(clave: str) -> None:
    supabase.table("notificaciones_enviadas").delete().eq("clave", clave).execute()


def _enviar(titulo: str, texto: str, url: str, destinatarios: list[str]) -> str:
    """Devuelve 'ok', 'definitivo' (rechazado, no reintentar) o 'reintentar'."""
    if not destinatarios:
        return "ok"
    try:
        r = httpx.post(
            "https://api.onesignal.com/notifications",
            headers={"Authorization": f"Key {ONESIGNAL_API_KEY}"},
            json={
                "app_id": ONESIGNAL_APP_ID,
                "target_channel": "push",
                "include_aliases": {"external_id": destinatarios},
                "headings": {"en": titulo, "es": titulo},
                "contents": {"en": texto, "es": texto},
                "url": url,
            },
            timeout=20,
        )
    except httpx.HTTPError as e:
        print("  push: error de red:", e)
        return "reintentar"

    if r.status_code >= 500:
        print("  push: fallo de OneSignal:", r.status_code, r.text)
        return "reintentar"
    if r.status_code >= 400:
        print("  push rechazado:", r.status_code, r.text)
        return "definitivo"
    print(f"  push enviado: {titulo} -> {len(destinatarios)} usuario(s)", r.text[:200])
    return "ok"


def _avisar(clave: str, grupos: list[tuple[str, str, str, list[str]]]) -> int:
    if not _reservar(clave):
        return 0
    resultados = [_enviar(*g) for g in grupos]
    if resultados and all(r == "reintentar" for r in resultados):
        _liberar(clave)  # fallo temporal: se volverá a intentar en la próxima ejecución
        return 0
    return 1


def _aviso_proximo(p, minutos, todos, con_porra, sin_porra) -> int:
    local, visitante = _equipos(p)
    cuando = "en 1 hora" if minutos >= 55 else f"en {round(minutos)} minutos"
    con = [u for u in todos if u in con_porra]
    return _avisar(
        f"partido_1h:{p['id']}",
        [
            (
                f"⚽ {local} - {visitante}",
                f"El partido empieza {cuando}. ¡Suerte con tu porra!",
                f"{WEB}/",
                con,
            ),
            (
                "⏰ ¡Última llamada!",
                f"{local} - {visitante} empieza {cuando} y aún no has hecho tu porra.",
                f"{WEB}/porra",
                sin_porra,
            ),
        ],
    )


def _aviso_porra_abierta(p, inicio, sin_porra) -> int:
    local, visitante = _equipos(p)
    madrid = inicio.astimezone(MADRID)
    cuando = f"{DIAS[madrid.weekday()]} a las {madrid:%H:%M}"
    return _avisar(
        f"porra_abierta:{p['id']}",
        [
            (
                "📅 Porra abierta",
                f"{local} - {visitante}, {cuando}. ¡Haz tu porra antes de que empiece!",
                f"{WEB}/porra",
                sin_porra,
            )
        ],
    )


def _aviso_resultado(p, todos, porras, sin_porra) -> int:
    marcador = _marcador(p)
    grupos = [("🏁 Final", marcador, f"{WEB}/", sin_porra)]

    # Un aviso por cada cantidad de puntos distinta, para decir "has sumado +3"
    por_puntos: dict[int, list[str]] = {}
    for x in porras:
        if x["usuario_id"] in todos:
            por_puntos.setdefault(x["puntos_obtenidos"] or 0, []).append(x["usuario_id"])
    for puntos, ids in por_puntos.items():
        extra = (
            f"Has sumado +{puntos} en la porra."
            if puntos
            else "Esta vez no has sumado en la porra."
        )
        grupos.append(("🏁 Final", f"{marcador}. {extra}", f"{WEB}/porra/clasificacion", ids))
    return _avisar(f"resultado:{p['id']}", grupos)


def sync_avisos() -> dict:
    if not ONESIGNAL_API_KEY:
        return {"avisos": "sin ONESIGNAL_API_KEY: no se envía nada"}

    usuarios = supabase.table("usuarios").select("id, nombre").execute().data
    solo = os.environ.get("AVISOS_SOLO_PARA")
    if solo:
        usuarios = [u for u in usuarios if u["nombre"] == solo]
    todos = [u["id"] for u in usuarios]
    if not todos:
        return {"avisos_enviados": 0}

    ahora = datetime.now(timezone.utc)
    formato = "%Y-%m-%dT%H:%M:%SZ"
    partidos = (
        supabase.table("partidos")
        .select("id, rival, fecha, es_local, estado, goles_sevilla, goles_rival")
        .eq("temporada_id", get_temporada_id())
        .gte("fecha", (ahora - timedelta(hours=12)).strftime(formato))
        .lte("fecha", (ahora + timedelta(hours=26)).strftime(formato))
        .execute()
        .data
    )

    enviados = 0
    for p in partidos:
        inicio = _inicio(p)
        minutos = (inicio - ahora).total_seconds() / 60
        # La API manda 00:00 UTC cuando la liga aún no ha fijado la hora
        hora_confirmada = not (inicio.hour == 0 and inicio.minute == 0)

        porras = (
            supabase.table("porras")
            .select("usuario_id, puntos_obtenidos")
            .eq("partido_id", p["id"])
            .execute()
            .data
        )
        con_porra = {x["usuario_id"] for x in porras}
        sin_porra = [u for u in todos if u not in con_porra]

        if p["estado"] == "programado" and hora_confirmada:
            if 0 < minutos <= 75:
                enviados += _aviso_proximo(p, minutos, todos, con_porra, sin_porra)
            elif 75 < minutos <= 26 * 60:
                enviados += _aviso_porra_abierta(p, inicio, sin_porra)
        elif (
            p["estado"] == "finalizado"
            and minutos <= 0
            and p["goles_sevilla"] is not None
            and p["goles_rival"] is not None
        ):
            enviados += _aviso_resultado(p, todos, porras, sin_porra)

    return {"avisos_enviados": enviados}


if __name__ == "__main__":
    # Sin argumentos: ejecuta los avisos. Con un nombre de usuario: te manda una prueba.
    if len(sys.argv) < 2:
        print(sync_avisos())
    else:
        filas = (
            supabase.table("usuarios").select("id").eq("nombre", sys.argv[1]).execute().data
        )
        print(
            _enviar(
                "🔔 Prueba desde el backend",
                "Si ves esto, los avisos automáticos funcionan.",
                WEB,
                [f["id"] for f in filas],
            )
        )