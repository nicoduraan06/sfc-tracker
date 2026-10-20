"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUsuario } from "@/lib/useUsuario";

type Modo = "entrar" | "registro";

function traducirError(mensaje: string, modo: Modo) {
  const m = mensaje.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email o contraseña incorrectos.";
  if (m.includes("already registered"))
    return "Ese email ya tiene cuenta. Prueba a entrar.";
  if (m.includes("password should be at least"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("database error saving new user"))
    return "El código de invitación no es correcto.";
  if (m.includes("rate limit"))
    return "Demasiados intentos. Espera un rato y vuelve a probar.";
  return modo === "entrar"
    ? "No se pudo iniciar sesión."
    : "No se pudo crear la cuenta.";
}

function Campo({
  etiqueta,
  valor,
  onCambio,
  tipo = "text",
  autoComplete,
  minLength,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  tipo?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-neutral-300">
      {etiqueta}
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className="rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-base text-white outline-none focus:border-red-500"
      />
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const usuario = useUsuario();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Si ya hay sesión, no tiene sentido estar aquí
  useEffect(() => {
    if (usuario) router.replace("/");
  }, [usuario, router]);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const { data, error: fallo } =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { nombre: nombre.trim(), codigo: codigo.trim() } },
          });

    setCargando(false);

    if (fallo) {
      console.warn(fallo);
      setError(traducirError(fallo.message, modo));
      return;
    }
    if (!data.session) {
      setError(
        "Cuenta creada, pero hay que confirmar el correo. Revisa tu bandeja de entrada.",
      );
      return;
    }
    router.push("/");
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <section className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
        <h1 className="text-xl font-bold">
          {modo === "entrar" ? "Entrar" : "Crear cuenta"}
        </h1>

        <form onSubmit={enviar} className="mt-6 flex flex-col gap-4">
          {modo === "registro" && (
            <Campo
              etiqueta="Nombre (el que verán tus amigos)"
              valor={nombre}
              onCambio={setNombre}
              autoComplete="name"
            />
          )}
          <Campo
            etiqueta="Email"
            tipo="email"
            valor={email}
            onCambio={setEmail}
            autoComplete="email"
          />
          <Campo
            etiqueta="Contraseña"
            tipo="password"
            valor={password}
            onCambio={setPassword}
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
            minLength={6}
          />
          {modo === "registro" && (
            <Campo
              etiqueta="Código de invitación"
              valor={codigo}
              onCambio={setCodigo}
            />
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="rounded-lg bg-red-600 px-4 py-2.5 font-medium transition-colors hover:bg-red-500 disabled:opacity-60"
          >
            {cargando
              ? "Un momento…"
              : modo === "entrar"
                ? "Entrar"
                : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-400">
          {modo === "entrar" ? "¿Primera vez?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => {
              setModo(modo === "entrar" ? "registro" : "entrar");
              setError(null);
            }}
            className="text-red-400 hover:underline"
          >
            {modo === "entrar" ? "Crea tu cuenta" : "Entra"}
          </button>
        </p>
      </section>
    </main>
  );
}