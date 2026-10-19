import type { Partido } from "@/components/ProximoPartido";
import type { ResultadoPartido } from "@/components/Racha";
import type { FilaClasificacion } from "@/components/TablaClasificacion";
import { supabase } from "@/lib/supabase";

// La temporada actual es la que tiene la fecha de inicio más reciente
async function getTemporadaActualId() {
  const { data } = await supabase
    .from("temporadas")
    .select("id")
    .order("fecha_inicio", { ascending: false })
    .limit(1);
  return data?.[0]?.id as string | undefined;
}

export async function getProximoPartido() {
  // Programados o en juego, descartando los que empezaron hace más de 3 h
  const desde = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("partidos")
    .select("id, rival, fecha, competicion, es_local, estado")
    .in("estado", ["programado", "en_directo"])
    .gte("fecha", desde)
    .order("fecha", { ascending: true })
    .limit(1);
  return (data?.[0] ?? null) as Partido | null;
}

export async function getUltimosResultados(limite = 5) {
  const { data } = await supabase
    .from("partidos")
    .select("id, rival, fecha, competicion, es_local, goles_sevilla, goles_rival")
    .eq("estado", "finalizado")
    .not("goles_sevilla", "is", null)
    .not("goles_rival", "is", null)
    .order("fecha", { ascending: false })
    .limit(limite);
  return (data ?? []) as ResultadoPartido[];
}

export async function getClasificacion() {
  const temporadaId = await getTemporadaActualId();
  if (!temporadaId) return null;

  const { data: ultima } = await supabase
    .from("clasificacion_historico")
    .select("jornada")
    .eq("temporada_id", temporadaId)
    .order("jornada", { ascending: false })
    .limit(1);
  const jornada = ultima?.[0]?.jornada as number | undefined;
  if (jornada === undefined) return null;

  const { data } = await supabase
    .from("clasificacion_historico")
    .select(
      "equipo, posicion, puntos, partidos_jugados, ganados, empatados, perdidos, goles_favor, goles_contra",
    )
    .eq("temporada_id", temporadaId)
    .eq("jornada", jornada)
    .order("posicion", { ascending: true });

  return { jornada, filas: (data ?? []) as FilaClasificacion[] };
}