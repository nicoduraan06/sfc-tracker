"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// undefined = comprobando la sesión; null = sin sesión; User = con sesión
export function useUsuario() {
  const [usuario, setUsuario] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return usuario;
}