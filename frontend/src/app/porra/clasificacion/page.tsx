"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUsuario } from "@/lib/useUsuario";

type FilaRanking = {
  id: string;
  nombre: string;
  puntos: number;
  posicion: number;
};

type PorraGrupo = {
  usuarioId: string;
  nombre: string;
  local: number;
  visitante: number;
  puntos: number | null;
};

type PartidoEmpezado = {
  id: string;
  rival: string;
  fecha: string;
  es_local: boolean;
  estado: string;
  goles_sevilla: number | null;
  goles_rival: number | null;
  porras: PorraGrupo[];
};

const formatoFecha = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Madrid",
});

function titulo(p: PartidoEmpezado) {
  const local = p.es_local ? "Sevilla FC" : p.rival;
  const visitante = p.es_local ? p.rival : "Sevilla FC";
  if (
    p.estado === "finalizado" &&
    p.goles_sevilla !== null &&
    p.goles_rival !== null
  ) {
    const golesLocal = p.es_local ? p.goles_sevilla : p.goles_rival;
    const golesVisitante = p.es_local ? p.goles_rival : p.goles_sevilla;
    return `${local} ${golesLocal}-${golesVisitante} ${visitante}`;
  }
  return `${local} - ${visitante}`;
}

export default function ClasificacionPorraPage() {
  const usuario = useUsuario();
  const usuarioId = usuario?.id;
  const [ranking, setRanking] = useState<FilaRanking[] | null>(null);
  const [empezados, setEmpezados] = useState<PartidoEmpezado[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuarioId) return;
    let cancelado = false;

    async function cargar() {
      const { data: us, error: fallo } = await supabase
        .from("usuarios")
        .select("id, nombre, puntos_totales_temporada_actual")
        .order("puntos_totales_temporada_actual", { ascending: false })
        .order("nombre", { ascending: true });

      if (fallo || !us) {
        if (!cancelado) setError("No se pudo cargar la clasificación.");
        return;
      }

      const nombres = new Map<string, string>(
        us.map((u): [string, string] => [u.id, u.nombre]),
      );
      const filas = us.map((u) => ({
        id: u.id as string,
        nombre: u.nombre as string,
        puntos: (u.puntos_totales_temporada_actual ?? 0) as number,
      }));
      // Si hay empate a puntos, comparten posición
      const conPosicion: FilaRanking[] = filas.map((f) => ({
        ...f,
        posicion: 1 + filas.filter((o) => o.puntos > f.puntos).length,
      }));

      // Los últimos partidos ya empezados: sus porras ya son visibles para todos
      const { data: ps } = await supabase
        .from("partidos")
        .select("id, rival, fecha, es_local, estado, goles_sevilla, goles_rival")
        .lte("fecha", new Date().toISOString())
        .order("fecha", { ascending: false })
        .limit(3);

      const lista = ps ?? [];
      const { data: pr } = await supabase
        .from("porras")
        .select(
          "usuario_id, partido_id, goles_local, goles_visitante, puntos_obtenidos",
        )
        .in(
          "partido_id",
          lista.map((p) => p.id),
        );

      const completos: PartidoEmpezado[] = lista.map((p) => ({
        ...p,
        porras: (pr ?? [])
          .filter((x) => x.partido_id === p.id)
          .map((x) => ({
            usuarioId: x.usuario_id as string,
            nombre: nombres.get(x.usuario_id) ?? "?",
            local: x.goles_local as number,
            visitante: x.goles_visitante as number,
            puntos: x.puntos_obtenidos as number | null,
          }))
          .sort(
            (a, b) =>
              (b.puntos ?? -1) - (a.puntos ?? -1) ||
              a.nombre.localeCompare(b.nombre),
          ),
      }));

      if (!cancelado) {
        setRanking(conPosicion);
        setEmpezados(completos);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <Link
          href="/porra"
          className="text-sm text-neutral-400 transition-colors hover:text-white"
        >
          ← Volver a la porra
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          Clasificación <span className="text-red-500">de la porra</span>
        </h1>
      </div>

      {usuario === undefined && <p className="text-neutral-400">Cargando…</p>}

      {usuario === null && (
        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
          <p className="text-neutral-300">
            Entra con tu cuenta para ver la clasificación.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-red-500"
          >
            Entrar o crear cuenta
          </Link>
        </section>
      )}

      {error && <p className="text-red-400">{error}</p>}

      {ranking && (
        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4 shadow-xl sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-red-500">
            Temporada 2026/27
          </h2>
          <ol className="mt-4 flex flex-col gap-2">
            {ranking.map((f) => (
              <li
                key={f.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                  f.id === usuarioId ? "bg-red-500/15" : "bg-neutral-800/60"
                }`}
              >
                <span className="w-6 text-center font-bold text-neutral-400">
                  {f.posicion}
                </span>
                <span className="flex-1 truncate font-medium">{f.nombre}</span>
                <span className="text-lg font-bold tabular-nums">{f.puntos}</span>
                <span className="text-xs uppercase text-neutral-400">pts</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {ranking && empezados.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4 shadow-xl sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-red-500">
            Porras del grupo
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Se destapan cuando el partido ya ha empezado.
          </p>

          {empezados.map((p) => (
            <div key={p.id} className="mt-5">
              <p className="font-medium">{titulo(p)}</p>
              <p className="text-xs text-neutral-500">
                {formatoFecha.format(new Date(p.fecha))}
                {p.estado !== "finalizado" && " · resultado pendiente"}
              </p>

              {p.porras.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">Nadie hizo porra.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {p.porras.map((x) => (
                    <li
                      key={x.usuarioId}
                      className="flex items-center justify-between rounded-lg bg-neutral-800/60 px-3 py-1.5"
                    >
                      <span className="truncate">{x.nombre}</span>
                      <span className="flex items-center gap-3">
                        <span className="tabular-nums text-neutral-300">
                          {x.local}-{x.visitante}
                        </span>
                        <span
                          className={`w-10 text-right font-semibold tabular-nums ${
                            x.puntos ? "text-green-400" : "text-neutral-500"
                          }`}
                        >
                          {x.puntos === null ? "—" : `+${x.puntos}`}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}