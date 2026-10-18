export type FilaClasificacion = {
  equipo: string;
  posicion: number;
  puntos: number;
  partidos_jugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  goles_favor: number;
  goles_contra: number;
};

const EQUIPO_PROPIO = "Sevilla FC";

// Las plazas europeas cambian según la temporada (Copa, coeficiente UEFA...),
// por eso viven aquí, fáciles de ajustar.
function zona(posicion: number) {
  if (posicion <= 4) return "border-l-blue-500";
  if (posicion <= 6) return "border-l-orange-500";
  if (posicion === 7) return "border-l-green-500";
  if (posicion >= 18) return "border-l-red-600";
  return "border-l-transparent";
}

const LEYENDA = [
  { color: "bg-blue-500", texto: "Champions" },
  { color: "bg-orange-500", texto: "Europa League" },
  { color: "bg-green-500", texto: "Conference" },
  { color: "bg-red-600", texto: "Descenso" },
];

export default function TablaClasificacion({
  filas,
  jornada,
}: {
  filas: FilaClasificacion[];
  jornada: number;
}) {
  return (
    <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-900 p-4 shadow-xl sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-red-500">
          Clasificación · LaLiga
        </h2>
        <span className="text-xs text-neutral-500">Jornada {jornada}</span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-neutral-500">
              <th className="py-2 pl-3 text-left font-medium">#</th>
              <th className="py-2 text-left font-medium">Equipo</th>
              <th className="py-2 text-center font-medium">PJ</th>
              <th className="hidden py-2 text-center font-medium sm:table-cell">G</th>
              <th className="hidden py-2 text-center font-medium sm:table-cell">E</th>
              <th className="hidden py-2 text-center font-medium sm:table-cell">P</th>
              <th className="hidden py-2 text-center font-medium sm:table-cell">GF</th>
              <th className="hidden py-2 text-center font-medium sm:table-cell">GC</th>
              <th className="py-2 text-center font-medium">DG</th>
              <th className="py-2 pr-3 text-center font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const propio = f.equipo === EQUIPO_PROPIO;
              const dg = f.goles_favor - f.goles_contra;
              return (
                <tr
                  key={f.equipo}
                  className={
                    propio
                      ? "bg-red-500/15 font-semibold text-white"
                      : "text-neutral-300"
                  }
                >
                  <td className={`border-l-4 py-2 pl-3 ${zona(f.posicion)}`}>
                    {f.posicion}
                  </td>
                  <td className="py-2">{f.equipo}</td>
                  <td className="py-2 text-center">{f.partidos_jugados}</td>
                  <td className="hidden py-2 text-center sm:table-cell">{f.ganados}</td>
                  <td className="hidden py-2 text-center sm:table-cell">{f.empatados}</td>
                  <td className="hidden py-2 text-center sm:table-cell">{f.perdidos}</td>
                  <td className="hidden py-2 text-center sm:table-cell">{f.goles_favor}</td>
                  <td className="hidden py-2 text-center sm:table-cell">{f.goles_contra}</td>
                  <td className="py-2 text-center">{dg > 0 ? `+${dg}` : dg}</td>
                  <td className="py-2 pr-3 text-center font-bold text-white">
                    {f.puntos}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
        {LEYENDA.map((l) => (
          <li key={l.texto} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${l.color}`} />
            {l.texto}
          </li>
        ))}
      </ul>
    </section>
  );
}