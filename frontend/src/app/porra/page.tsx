"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUsuario } from "@/lib/useUsuario";

type PartidoPorra = {
  id: string;
  rival: string;
  fecha: string;
  competicion: string;
  es_local: boolean;
};

type MiPorra = {
  partido_id: string;
  goles_local: number;
  goles_visitante: number;
};

const formatoDia = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Madrid",
});

const formatoHora = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});

function Marcador({
  valor,
  onCambio,
  etiqueta,
}: {
  valor: string;
  onCambio: (v: string) => void;
  etiqueta: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={20}
      required
      value={valor}
      onChange={(e) => onCambio(e.target.value)}
      aria-label={etiqueta}
      className="size-12 rounded-lg border border-white/10 bg-neutral-800 text-center text-xl font-bold text-white outline-none focus:border-red-500"
    />
  );
}

function TarjetaPorra({
  partido,
  mia,
  usuarioId,
  onGuardada,
}: {
  partido: PartidoPorra;
  mia?: MiPorra;
  usuarioId: string;
  onGuardada: () => void;
}) {
  const [local, setLocal] = useState(mia ? String(mia.goles_local) : "");
  const [visitante, setVisitante] = useState(
    mia ? String(mia.goles_visitante) : "",
  );
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; ok: boolean } | null>(
    null,
  );

  const fecha = new Date(partido.fecha);
  const horaPorConfirmar =
    fecha.getUTCHours() === 0 && fecha.getUTCMinutes() === 0;
  const equipoLocal = partido.es_local ? "Sevilla FC" : partido.rival;
  const equipoVisitante = partido.es_local ? partido.rival : "Sevilla FC";

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const golesLocal = Number(local);
    const golesVisitante = Number(visitante);

    if (
      !Number.isInteger(golesLocal) ||
      !Number.isInteger(golesVisitante) ||
      golesLocal < 0 ||
      golesVisitante < 0
    ) {
      setMensaje({ texto: "Pon dos números enteros, de 0 en adelante.", ok: false });
      return;
    }

    setGuardando(true);
    setMensaje(null);
    let fallo: string | null = null;

    if (mia) {
      // Si la porra ya está cerrada, las reglas de Supabase no dejan modificar
      // ninguna fila y la respuesta llega vacía
      const { data, error } = await supabase
        .from("porras")
        .update({ goles_local: golesLocal, goles_visitante: golesVisitante })
        .eq("usuario_id", usuarioId)
        .eq("partido_id", partido.id)
        .select();
      if (error) fallo = "No se pudo guardar.";
      else if (!data?.length) fallo = "La porra de este partido ya está cerrada.";
    } else {
      const { error } = await supabase.from("porras").insert({
        usuario_id: usuarioId,
        partido_id: partido.id,
        goles_local: golesLocal,
        goles_visitante: golesVisitante,
      });
      if (error) {
        fallo =
          error.code === "42501"
            ? "La porra de este partido ya está cerrada."
            : "No se pudo guardar.";
      }
    }

    setGuardando(false);
    if (fallo) {
      setMensaje({ texto: fallo, ok: false });
      return;
    }
    setMensaje({ texto: "Guardada ✓", ok: true });
    onGuardada();
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4 shadow-xl sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-red-500">
          {partido.competicion}
        </p>
        {mia && <span className="text-xs text-green-400">Porra guardada</span>}
      </div>
      <p className="mt-1 text-sm text-neutral-400 first-letter:uppercase">
        {formatoDia.format(fecha)}
        {horaPorConfirmar
          ? " · hora por confirmar"
          : ` · ${formatoHora.format(fecha)}`}
      </p>

      <form onSubmit={guardar} className="mt-4">
        <div className="flex items-center justify-center gap-3">
          <span className="flex-1 text-right text-sm font-medium sm:text-base">
            {equipoLocal}
          </span>
          <Marcador
            valor={local}
            onCambio={setLocal}
            etiqueta={`Goles de ${equipoLocal}`}
          />
          <span className="text-neutral-500">-</span>
          <Marcador
            valor={visitante}
            onCambio={setVisitante}
            etiqueta={`Goles de ${equipoVisitante}`}
          />
          <span className="flex-1 text-left text-sm font-medium sm:text-base">
            {equipoVisitante}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className={`text-sm ${mensaje?.ok ? "text-green-400" : "text-red-400"}`}>
            {mensaje?.texto}
          </p>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-red-500 disabled:opacity-60"
          >
            {guardando ? "Guardando…" : mia ? "Actualizar" : "Guardar porra"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function PorraPage() {
  const usuario = useUsuario();
  const usuarioId = usuario?.id;
  const [partidos, setPartidos] = useState<PartidoPorra[] | null>(null);
  const [misPorras, setMisPorras] = useState<Record<string, MiPorra>>({});
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!usuarioId) return;

    const { data, error: fallo } = await supabase
      .from("partidos")
      .select("id, rival, fecha, competicion, es_local")
      .eq("estado", "programado")
      .gt("fecha", new Date().toISOString())
      .order("fecha", { ascending: true })
      .limit(5);

    if (fallo) {
      setError("No se pudieron cargar los partidos.");
      return;
    }

    const lista = (data ?? []) as PartidoPorra[];
    const { data: porras } = await supabase
      .from("porras")
      .select("partido_id, goles_local, goles_visitante")
      .eq("usuario_id", usuarioId)
      .in(
        "partido_id",
        lista.map((p) => p.id),
      );

    setPartidos(lista);
    setMisPorras(
      Object.fromEntries(
        ((porras ?? []) as MiPorra[]).map((p) => [p.partido_id, p]),
      ),
    );
  }, [usuarioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">
          La <span className="text-red-500">porra</span>
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Pronostica el resultado exacto antes de que empiece el partido: 3
          puntos si lo clavas, 1 si aciertas quién gana (o el empate).
        </p>
        <Link
          href="/porra/clasificacion"
          className="mt-3 inline-block text-sm text-red-400 hover:underline"
        >
          Ver la clasificación →
        </Link>
      </div>

      {usuario === undefined && <p className="text-neutral-400">Cargando…</p>}

      {usuario === null && (
        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
          <p className="text-neutral-300">
            Para jugar a la porra necesitas una cuenta.
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

      {usuario && partidos !== null && partidos.length === 0 && (
        <p className="text-neutral-400">No hay partidos abiertos ahora mismo.</p>
      )}

      {usuario &&
        partidos?.map((p) => (
          <TarjetaPorra
            key={p.id}
            partido={p}
            mia={misPorras[p.id]}
            usuarioId={usuario.id}
            onGuardada={cargar}
          />
        ))}
    </main>
  );
}