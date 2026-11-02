"use client";

import { useEffect, useState } from "react";

type EventoInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CLAVE = "sfc-instalar-descartado";

export default function InstalarApp() {
  const [modo, setModo] = useState<"oculto" | "android" | "ios">("oculto");
  const [evento, setEvento] = useState<EventoInstalacion | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(CLAVE)) return;
    } catch {
      /* sin almacenamiento disponible: seguimos igualmente */
    }

    const instalada =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (instalada) return;

    const ua = navigator.userAgent;
    const esIos =
      /iphone|ipad|ipod/i.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

    // Android y Chrome de escritorio avisan cuando la app se puede instalar
    const alPoderInstalar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalacion);
      setModo("android");
    };
    window.addEventListener("beforeinstallprompt", alPoderInstalar);

    const t = setTimeout(() => {
      if (esIos) setModo("ios");
    }, 0);

    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", alPoderInstalar);
    };
  }, []);

  function cerrar() {
    try {
      localStorage.setItem(CLAVE, "1");
    } catch {
      /* sin almacenamiento disponible */
    }
    setModo("oculto");
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    setEvento(null);
    if (outcome === "accepted") cerrar();
  }

  if (modo === "oculto") return null;

  return (
    <div className="mx-auto mt-4 w-full max-w-2xl px-4">
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium">Instala SFC Tracker en tu móvil</p>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar aviso"
            className="text-neutral-400 transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>

        {modo === "android" ? (
          <>
            <p className="mt-1 text-neutral-300">
              Ábrela como una app, a pantalla completa y con avisos de partido.
            </p>
            <button
              type="button"
              onClick={instalar}
              className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 font-medium transition-colors hover:bg-red-500"
            >
              Instalar
            </button>
          </>
        ) : (
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-neutral-300">
            <li>
              Pulsa el botón <strong>Compartir</strong> (el cuadrado con la
              flecha hacia arriba) del navegador.
            </li>
            <li>
              Elige <strong>Añadir a pantalla de inicio</strong>.
            </li>
            <li>Abre SFC Tracker desde el icono nuevo.</li>
          </ol>
        )}
      </div>
    </div>
  );
}