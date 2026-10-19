import ProximoPartido from "@/components/ProximoPartido";
import Racha from "@/components/Racha";
import TablaClasificacion from "@/components/TablaClasificacion";
import {
  getClasificacion,
  getProximoPartido,
  getUltimosResultados,
} from "@/lib/datos";

// La página se regenera como mucho cada 60 segundos
export const revalidate = 60;

export default async function Home() {
  const [partido, resultados, clasificacion] = await Promise.all([
    getProximoPartido(),
    getUltimosResultados(),
    getClasificacion(),
  ]);

  return (
    <main className="flex flex-col items-center gap-6 px-4 py-8">
      {partido ? (
        <ProximoPartido partido={partido} />
      ) : (
        <p className="text-neutral-400">No hay partidos próximos.</p>
      )}

      <Racha resultados={resultados} />

      {clasificacion && (
        <TablaClasificacion
          filas={clasificacion.filas}
          jornada={clasificacion.jornada}
        />
      )}
    </main>
  );
}