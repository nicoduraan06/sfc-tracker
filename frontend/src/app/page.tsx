import ProximoPartido, { type Partido } from "@/components/ProximoPartido";
import { supabase } from "@/lib/supabase";

// La página se regenera como mucho cada 60 segundos
export const revalidate = 60;

export default async function Home() {
  // Partidos programados o en juego, descartando los que empezaron hace más de 3 h
  const desde = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("partidos")
    .select("id, rival, fecha, competicion, es_local, estado")
    .in("estado", ["programado", "en_directo"])
    .gte("fecha", desde)
    .order("fecha", { ascending: true })
    .limit(1);

  const partido = (data?.[0] ?? null) as Partido | null;

  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral-950 px-4 py-10 text-white">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">
        SFC <span className="text-red-500">Tracker</span>
      </h1>

      {error && (
        <p className="text-red-400">
          No se pudieron cargar los datos: {error.message}
        </p>
      )}

      {partido ? (
        <ProximoPartido partido={partido} />
      ) : (
        !error && <p className="text-neutral-400">No hay partidos próximos.</p>
      )}
    </main>
  );
}