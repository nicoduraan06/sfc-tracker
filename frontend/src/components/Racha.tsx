export type ResultadoPartido = {
  id: string;
  rival: string;
  fecha: string;
  competicion: string;
  es_local: boolean;
  goles_sevilla: number;
  goles_rival: number;
};

type Letra = "G" | "E" | "P";

function letraDe(r: ResultadoPartido): Letra {
  if (r.goles_sevilla > r.goles_rival) return "G";
  if (r.goles_sevilla < r.goles_rival) return "P";
  return "E";
}

const ESTILOS: Record<Letra, string> = {
  G: "bg-green-600",
  E: "bg-neutral-500",
  P: "bg-red-600",
};

// "Sevilla FC 2-1 Rival", respetando quién jugó de local
function lineaResultado(r: ResultadoPartido) {
  const local = r.es_local ? "Sevilla FC" : r.rival;
  const visitante = r.es_local ? r.rival : "Sevilla FC";
  const golesLocal = r.es_local ? r.goles_sevilla : r.goles_rival;
  const golesVisitante = r.es_local ? r.goles_rival : r.goles_sevilla;
  return `${local} ${golesLocal}-${golesVisitante} ${visitante}`;
}

const formatoFecha = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Madrid",
});

export default function Racha({ resultados }: { resultados: ResultadoPartido[] }) {
  if (resultados.length === 0) return null;

  // De más antiguo a más reciente, para que el último resultado quede a la derecha
  const cronologico = [...resultados].reverse();

  return (
    <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-red-500">
          Racha reciente
        </h2>
        <span className="text-xs text-neutral-500">Último resultado a la derecha</span>
      </div>

      <div className="mt-4 flex justify-center gap-3">
        {cronologico.map((r) => {
          const letra = letraDe(r);
          return (
            <span
              key={r.id}
              title={lineaResultado(r)}
              className={`flex size-10 items-center justify-center rounded-full text-sm font-bold text-white ${ESTILOS[letra]}`}
            >
              {letra}
            </span>
          );
        })}
      </div>

      <ul className="mt-5 divide-y divide-white/5 text-sm">
        {resultados.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2">
            <span className="w-14 shrink-0 text-neutral-500">
              {formatoFecha.format(new Date(r.fecha))}
            </span>
            <span className="text-neutral-200">{lineaResultado(r)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}