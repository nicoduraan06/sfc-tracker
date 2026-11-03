"use client";

import { useEffect, useState } from "react";
import { getOneSignal, type OneSignalApi } from "@/lib/onesignal";

type Estado =
  | "cargando"
  | "no-disponible"
  | "ios-instalar"
  | "bloqueado"
  | "inactivo"
  | "activo";

function esIosSinInstalar() {
  const ua = navigator.userAgent;
  const esIos =
    /iphone|ipad|ipod/i.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const instalada =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return esIos && !instalada;
}

function calcular(os: OneSignalApi): Estado {
  if (
    typeof Notification !== "undefined" &&
    Notification.permission === "denied"
  ) {
    return "bloqueado";
  }
  return os.User.PushSubscription.optedIn ? "activo" : "inactivo";
}

export default function BotonNotificaciones() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function leer() {
      if (esIosSinInstalar()) {
        if (!cancelado) setEstado("ios-instalar");
        return;
      }
      const os = await getOneSignal();
      if (cancelado) return;
      if (!os || !os.Notifications.isPushSupported()) {
        setEstado("no-disponible");
        return;
      }
      setEstado(calcular(os));
      os.User.PushSubscription.addEventListener("change", () => {
        if (!cancelado) setEstado(calcular(os));
      });
    }

    leer();
    return () => {
      cancelado = true;
    };
  }, []);

  async function cambiar(activar: boolean) {
    setTrabajando(true);
    try {
      const os = await getOneSignal();
      if (!os) return;
      if (activar) {
        await os.Notifications.requestPermission();
        if (os.Notifications.permission) {
          await os.User.PushSubscription.optIn();
        }
      } else {
        await os.User.PushSubscription.optOut();
      }
      setEstado(calcular(os));
    } catch (error) {
      console.warn("Notificaciones", error);
    } finally {
      setTrabajando(false);
    }
  }

  if (estado === "cargando") return null;

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-neutral-800/60 p-3 text-sm">
      {estado === "no-disponible" && (
        <p className="text-neutral-400">
          Los avisos solo funcionan en la web publicada y en navegadores
          compatibles.
        </p>
      )}

      {estado === "ios-instalar" && (
        <p className="text-neutral-300">
          En iPhone los avisos solo funcionan con la app instalada: pulsa{" "}
          <strong>Compartir</strong> y luego{" "}
          <strong>Añadir a pantalla de inicio</strong>, abre la app desde su
          icono y actívalos desde aquí.
        </p>
      )}

      {estado === "bloqueado" && (
        <p className="text-neutral-300">
          Has bloqueado las notificaciones de esta web. Para recibirlas,
          actívalas en los ajustes del navegador o del móvil.
        </p>
      )}

      {estado === "inactivo" && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-neutral-300">
            Recibe avisos de partido y de porra.
          </p>
          <button
            type="button"
            onClick={() => cambiar(true)}
            disabled={trabajando}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 font-medium transition-colors hover:bg-red-500 disabled:opacity-60"
          >
            Activar avisos
          </button>
        </div>
      )}

      {estado === "activo" && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-green-400">Avisos activados ✓</p>
          <button
            type="button"
            onClick={() => cambiar(false)}
            disabled={trabajando}
            className="text-neutral-400 transition-colors hover:text-white disabled:opacity-60"
          >
            Desactivar
          </button>
        </div>
      )}
    </div>
  );
}