"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUsuario } from "@/lib/useUsuario";

const ENLACES = [
  { href: "/", texto: "Inicio" },
  { href: "/plantilla", texto: "Plantilla" },
  { href: "/porra", texto: "Porra" },
];

function Sesion() {
  const usuario = useUsuario();
  const router = useRouter();

  // Mientras se comprueba la sesión reservamos el hueco para que nada salte
  if (usuario === undefined) return <span className="h-8 w-16" />;

  if (usuario === null) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-red-500"
      >
        Entrar
      </Link>
    );
  }

  const nombre =
    (usuario.user_metadata?.nombre as string | undefined) ||
    usuario.email?.split("@")[0];

  async function salir() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="max-w-28 truncate text-neutral-300">{nombre}</span>
      <button
        type="button"
        onClick={salir}
        className="text-neutral-400 transition-colors hover:text-white"
      >
        Salir
      </button>
    </div>
  );
}

export default function Navegacion() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/10 bg-neutral-950">
      <nav className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          SFC <span className="text-red-500">Tracker</span>
        </Link>

        <ul className="order-last flex w-full gap-1 text-sm sm:order-none sm:w-auto">
          {ENLACES.map((e) => {
            const activo =
              e.href === "/" ? pathname === "/" : pathname.startsWith(e.href);
            return (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    activo
                      ? "bg-red-500/15 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {e.texto}
                </Link>
              </li>
            );
          })}
        </ul>

        <Sesion />
      </nav>
    </header>
  );
}