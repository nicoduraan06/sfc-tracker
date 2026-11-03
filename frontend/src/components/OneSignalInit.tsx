"use client";

import Script from "next/script";
import { useEffect } from "react";
import { getOneSignal } from "@/lib/onesignal";
import { useUsuario } from "@/lib/useUsuario";

export default function OneSignalInit() {
  const usuario = useUsuario();
  // undefined = comprobando sesión; null = sin sesión; texto = id del usuario
  const id = usuario === undefined ? undefined : (usuario?.id ?? null);

  useEffect(() => {
    if (id === undefined) return;
    getOneSignal()
      .then((OneSignal) => {
        if (!OneSignal) return;
        return id ? OneSignal.login(id) : OneSignal.logout();
      })
      .catch((error) => console.warn("OneSignal", error));
  }, [id]);

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}