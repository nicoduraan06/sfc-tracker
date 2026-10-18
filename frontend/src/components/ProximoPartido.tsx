"use client";

import { useEffect, useState } from "react";

export type Partido = {
  id: string;
  rival: string;
  fecha: string;
  competicion: string;
  es_local: boolean;
  estado: "programado" | "en_directo" | "finalizado";
};

const dosDigitos = (n: number) => String(n).padStart(2, "0");

export default function ProximoPartido({ partido }: { partido: Partido }) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fecha = new Date(partido.fecha);
  const ms = fecha.getTime() - ahora;
  const empezado = ms <= 0;

  // La API manda 00:00 UTC cuando la liga aún no ha fijado la hora
  const horaPorConfirmar =
    fecha.getUTCHours() === 0 && fecha.getUTCMinutes() === 0;

  const dia = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Madrid",
  }).format(fecha);

  const hora = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(fecha);

  const local = partido.es_local ? "Sevilla FC" : partido.rival;
  const visitante = partido.es_local ? partido.rival : "Sevilla FC";

  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const unidades = [
    { etiqueta: "días", valor: Math.floor(totalSegundos / 86400) },
    { etiqueta: "horas", valor: Math.floor((totalSegundos % 86400) / 3600) },
    { etiqueta: "min", valor: Math.floor((totalSegundos % 3600) / 60) },
    { etiqueta: "seg", valor: totalSegundos % 60 },
  ];

  return (
    <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-500">
        Próximo partido · {partido.competicion}
      </p>

      <div className="mt-4 flex items-center justify-center gap-4 text-center text-xl font-bold sm:text-3xl">
        <span className="flex-1 text-right">{local}</span>
        <span className="text-sm font-medium text-neutral-500">vs</span>
        <span className="flex-1 text-left">{visitante}</span>
      </div>

      <p className="mt-3 text-center text-sm text-neutral-400 first-letter:uppercase">
        {dia}
        {horaPorConfirmar ? " · hora por confirmar" : ` · ${hora}`}
      </p>

      {!horaPorConfirmar && (
        <div className="mt-6" suppressHydrationWarning>
          {empezado ? (
            <p className="text-center text-lg font-semibold text-red-500">
              {partido.estado === "en_directo" ? "¡En juego!" : "Ya ha comenzado"}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-3 text-center">
              {unidades.map((u) => (
                <div key={u.etiqueta} className="rounded-xl bg-neutral-800 py-3">
                  <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                    {dosDigitos(u.valor)}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-neutral-400">
                    {u.etiqueta}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}