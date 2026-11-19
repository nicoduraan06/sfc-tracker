"""Descarga noticias del Sevilla FC desde canales RSS y las guarda en Supabase.

Solo se guarda el titular, el medio y el enlace a la noticia original.
Se ejecuta dentro de sync_all.py, cada 30 minutos desde GitHub Actions.
"""

import html
import re
import unicodedata
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

import httpx

from main import supabase

# Por orden de prioridad: si dos medios cuentan lo mismo, nos quedamos con el primero.
# filtrar=True: el canal mezcla temas y solo guardamos lo que habla del Sevilla.
FUENTES = [
    {"nombre": "JaviSFC", "url": "https://feeds.feedburner.com/Javisfc", "filtrar": False},
    {"nombre": "Marca", "url": "https://e00-marca.uecdn.es/rss/futbol/sevilla.xml", "filtrar": True},
    {"nombre": "Vamos Mi Sevilla", "url": "https://www.vamosmisevillafc.com/feed/", "filtrar": False},
    {
        "nombre": "Google Noticias",
        "url": "https://news.google.com/rss/search?q=%22Sevilla+FC%22&hl=es&gl=ES&ceid=ES:es",
        "filtrar": True,
    },
]

CABECERAS = {"User-Agent": "Mozilla/5.0 (compatible; SFCTracker/1.0; uso personal)"}

# Palabras que descartan una noticia (publicidad de casas de apuestas)
BLOQUEO = ("bet365", "apuestas", "pronostico", "cuotas", "predicciones")

# Palabras que, si salen, indican que la noticia va de lo nuestro
CLAVES_EXTRA = {"sevilla", "nervion", "pizjuan", "derbi"}

# Reglas para clasificar por el titular (sin tildes y en minúsculas); se aplican por orden
REGLAS = [
    (
        "lesion",
        r"lesion|fractur|\bbajas?\b|parte medico|esguince|rotura|operad|operacion|"
        r"recaida|sancion|apercibid|expulsad|se pierde|lo pierde|adios a la temporada",
    ),
    ("fichaje", r"\boficial\b|\banuncia\b|\bficha por\b|\bfirma\b|\brenueva\b|se incorpora|cedid"),
    (
        "rumor",
        r"fichaj|\bficha\b|salida|salir|venta|vend|traspaso|cesion|oferta|mercado|interes|"
        r"negoci|sondea|pretende|quiere|baraja|suena|clausula|refuerzo|incorpor|renovacion",
    ),
]


def _norm(texto: str) -> str:
    t = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def _palabras(texto: str) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9]+", _norm(texto)) if len(w) > 3}


def _parecidas(a: set[str], b: set[str]) -> bool:
    """Dos titulares que comparten casi todas sus palabras cuentan la misma noticia."""
    comunes = len(a & b)
    return bool(a and b) and comunes >= 3 and comunes / min(len(a), len(b)) >= 0.6


def _tipo(titulo: str) -> str:
    t = _norm(titulo)
    for tipo, patron in REGLAS:
        if re.search(patron, t):
            return tipo
    return "general"


def _a_fecha(texto):
    try:
        d = parsedate_to_datetime((texto or "").strip())
    except (TypeError, ValueError):
        return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def _leer_items(contenido: bytes) -> list[dict]:
    raiz = ET.fromstring(contenido)
    salida = []
    for it in raiz.findall("./channel/item"):
        titulo = html.unescape((it.findtext("title") or "").strip())
        fuente = (it.findtext("source") or "").strip()  # Google Noticias indica el medio
        if fuente and titulo.endswith(f" - {fuente}"):
            titulo = titulo[: -len(fuente) - 3].strip()
        salida.append(
            {
                "titulo": titulo,
                "url": (it.findtext("link") or "").strip(),
                "fecha": _a_fecha(it.findtext("pubDate")),
                "fuente": fuente,
            }
        )
    return salida


def _claves_plantilla() -> set[str]:
    """Apellidos de la plantilla, para reconocer noticias que hablan de nuestros jugadores."""
    filas = supabase.table("jugadores").select("nombre").execute().data
    claves = {_norm(f["nombre"]).split()[-1] for f in filas if f["nombre"].strip()}
    return {c for c in claves if len(c) >= 4} | CLAVES_EXTRA


def sync_noticias() -> dict:
    ahora = datetime.now(timezone.utc)
    limite = ahora - timedelta(days=30)
    formato = "%Y-%m-%dT%H:%M:%SZ"
    claves = _claves_plantilla()

    # Lo que ya guardamos en el último mes: sus enlaces, para no repetir ninguna noticia,
    # y los titulares de los últimos 3 días, para detectar la misma noticia en otro medio
    previas = (
        supabase.table("noticias")
        .select("titulo, url, fecha")
        .gte("fecha", limite.strftime(formato))
        .execute()
        .data
    )
    urls = {p["url"] for p in previas if p.get("url")}
    desde_3_dias = ahora - timedelta(days=3)
    vistos = [
        _palabras(p["titulo"])
        for p in previas
        if datetime.fromisoformat(p["fecha"].replace("Z", "+00:00")) >= desde_3_dias
    ]

    nuevas = []
    por_fuente = {}
    for fuente in FUENTES:
        nombre = fuente["nombre"]
        try:
            r = httpx.get(fuente["url"], headers=CABECERAS, timeout=20, follow_redirects=True)
            if r.status_code != 200:
                por_fuente[nombre] = f"HTTP {r.status_code}"
                continue
            items = _leer_items(r.content)
        except Exception as e:  # noqa: BLE001 - una fuente caída no debe tumbar la sincronización
            por_fuente[nombre] = f"error: {type(e).__name__}"
            continue

        guardadas = 0
        for it in items:
            titulo = it["titulo"]
            if not titulo or not it["url"] or it["url"] in urls:
                continue
            fecha = it["fecha"] or ahora
            if fecha < limite:
                continue
            if any(b in _norm(f"{titulo} {it['fuente']}") for b in BLOQUEO):
                continue
            palabras = _palabras(titulo)
            if fuente["filtrar"] and not (palabras & claves):
                continue
            if any(_parecidas(palabras, v) for v in vistos):
                continue

            vistos.append(palabras)
            urls.add(it["url"])
            nuevas.append(
                {
                    "titulo": titulo,
                    "tipo": _tipo(titulo),
                    "fecha": fecha.astimezone(timezone.utc).isoformat(),
                    "fuente": it["fuente"] or nombre,
                    "url": it["url"],
                }
            )
            guardadas += 1
        por_fuente[nombre] = f"{guardadas} nuevas"

    if nuevas:
        supabase.table("noticias").upsert(nuevas, on_conflict="url", ignore_duplicates=True).execute()

    tipos = {}
    for n in nuevas:
        tipos[n["tipo"]] = tipos.get(n["tipo"], 0) + 1
    return {"nuevas": len(nuevas), "tipos": tipos, "fuentes": por_fuente}


if __name__ == "__main__":
    print(sync_noticias())