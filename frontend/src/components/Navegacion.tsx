"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/", texto: "Inicio" },
  { href: "/plantilla", texto: "Plantilla" },
];

export default function Navegacion() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/10 bg-neutral-950">
      <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          SFC <span className="text-red-500">Tracker</span>
        </Link>
        <ul className="flex gap-1 text-sm">
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
      </nav>
    </header>
  );
}