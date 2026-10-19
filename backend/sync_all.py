"""Sincroniza partidos, clasificación, plantilla y goleadores desde football-data.org.

Se puede lanzar a mano (python sync_all.py) o desde GitHub Actions.
"""

from main import sync_clasificacion, sync_partidos, sync_plantilla
from sync_stats import sync_goleadores

if __name__ == "__main__":
    print("partidos:", sync_partidos())
    print("clasificacion:", sync_clasificacion())
    print("plantilla:", sync_plantilla())
    print("goleadores:", sync_goleadores())