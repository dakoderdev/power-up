"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";

const FORMATO_CORREO = /^\S+@\S+\.\S{2,}$/;
const MENSAJE_INVALIDO = "Correo o contraseña incorrectos.";
const MENSAJE_FALLA = "No pudimos iniciar sesión. Probá de nuevo.";

type Credenciales = {
  correo: string;
  clave: string;
};

export async function iniciarSesion({ correo, clave }: Credenciales) {
  const correoLimpio = typeof correo === "string" ? correo.trim() : "";

  if (
    !FORMATO_CORREO.test(correoLimpio) ||
    typeof clave !== "string" ||
    !clave
  ) {
    return { error: MENSAJE_INVALIDO };
  }

  try {
    await auth.api.signInEmail({
      body: { email: correoLimpio, password: clave },
      headers: await headers(),
    });
  } catch (error) {
    return {
      error: error instanceof APIError ? MENSAJE_INVALIDO : MENSAJE_FALLA,
    };
  }

  redirect("/");
}
