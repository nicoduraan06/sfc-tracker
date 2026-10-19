"""Sincroniza partidos, clasificación y plantilla desde football-data.org a Supabase.

Se puede lanzar a mano (python sync_all.py) o desde GitHub Actions.
"""

from main import sync_clasificacion, sync_partidos, sync_plantilla

if __name__ == "__main__":
    print("partidos:", sync_partidos())
    print("clasificacion:", sync_clasificacion())
    print("plantilla:", sync_plantilla())