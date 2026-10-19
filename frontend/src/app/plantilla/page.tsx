import { getPlantilla, type JugadorPlantilla } from "@/lib/datos";

export const revalidate = 60;

export const metadata = { title: "Plantilla · SFC Tracker" };

// La API da las posiciones en inglés
const GRUPOS = [
  { clave: "Goalkeeper", titulo: "Porteros" },
  { clave: "Defence", titulo: "Defensas" },
  { clave: "Midfield", titulo: "Centrocampistas" },
  { clave: "Offence", titulo: "Delanteros" },
];

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const ordenar = (a: JugadorPlantilla, b: JugadorPlantilla) =>
  b.goles + b.asistencias - (a.goles + a.asistencias) ||
  a.nombre.localeCompare(b.nombre);

function Tarjeta({ j }: { j: JugadorPlantilla }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-neutral-800/60 p-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-sm font-bold text-neutral-200">
        {iniciales(j.nombre)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{j.nombre}</p>
        {j.dorsal && <p className="text-xs text-neutral-400">Dorsal {j.dorsal}</p>}
      </div>
      <div className="flex gap-5 text-center">
        <div>
          <p className="text-lg font-bold tabular-nums">{j.goles}</p>
          <p className="text-[10px] uppercase text-neutral-400">Goles</p>
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums">{j.asistencias}</p>
          <p className="text-[10px] uppercase text-neutral-400">Asist.</p>
        </div>
      </div>
    </li>
  );
}

export default async function PlantillaPage() {
  const plantilla = await getPlantilla();

  const grupos = GRUPOS.map((g) => ({
    clave: g.clave,
    titulo: g.titulo,
    jugadores: plantilla.filter((j) => j.posicion === g.clave).sort(ordenar),
  }));

  const otros = plantilla
    .filter((j) => !GRUPOS.some((g) => g.clave === j.posicion))
    .sort(ordenar);
  if (otros.length > 0) {
    grupos.push({ clave: "otros", titulo: "Otros", jugadores: otros });
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">
          Plantilla <span className="text-red-500">2026/27</span>
        </h1>
        <p className="mt-1 text-sm text-neutral-400">Goles y asistencias en LaLiga.</p>
      </div>

      {plantilla.length === 0 && (
        <p className="text-neutral-400">Todavía no hay jugadores.</p>
      )}

      {grupos
        .filter((g) => g.jugadores.length > 0)
        .map((g) => (
          <section
            key={g.clave}
            className="rounded-2xl border border-white/10 bg-neutral-900 p-4 shadow-xl sm:p-6"
          >
            <h2 className="text-xs font-semibold uppercase tracking-widest text-red-500">
              {g.titulo} · {g.jugadores.length}
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {g.jugadores.map((j) => (
                <Tarjeta key={j.id} j={j} />
              ))}
            </ul>
          </section>
        ))}
    </main>
  );
}