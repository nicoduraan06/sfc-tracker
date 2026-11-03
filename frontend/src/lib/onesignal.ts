// Identificadores públicos de OneSignal: no son secretos, van en el código de cualquier web
const ONESIGNAL_APP_ID = "f09f9903-075f-486d-aac1-773b12f9e475";
const SAFARI_WEB_ID = "web.onesignal.auto.2c2f7f93-c22c-4405-a44b-05589b796f38";

// Solo los tipos del SDK de OneSignal que usamos
export type OneSignalApi = {
  init: (opciones: { appId: string; safari_web_id?: string }) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  Notifications: {
    permission: boolean;
    isPushSupported: () => boolean;
    requestPermission: () => Promise<void>;
  };
  User: {
    PushSubscription: {
      optedIn?: boolean;
      optIn: () => Promise<void>;
      optOut: () => Promise<void>;
      addEventListener: (evento: "change", escuchador: () => void) => void;
    };
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<
      (OneSignal: OneSignalApi) => void | Promise<void>
    >;
  }
}

let promesa: Promise<OneSignalApi | null> | null = null;

// Inicia OneSignal una vez y devuelve el SDK listo, o null si no se puede usar
export function getOneSignal(): Promise<OneSignalApi | null> {
  if (promesa) return promesa;

  if (window.location.hostname === "localhost") {
    promesa = Promise.resolve(null);
    return promesa;
  }

  promesa = new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          safari_web_id: SAFARI_WEB_ID,
        });
        resolve(OneSignal);
      } catch (error) {
        console.warn("No se pudo iniciar OneSignal", error);
        resolve(null);
      }
    });
  });
  return promesa;
}