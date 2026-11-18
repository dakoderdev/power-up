"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { ejecutarAccion } from "@/lib/acciones";
import { ApiError } from "@/lib/api/errores";
import { auth } from "@/lib/auth";

const FORMATO_CORREO = /^\S+@\S+\.\S{2,}$/;
const MENSAJE_INVALIDO = "Correo o contraseña incorrectos.";

type Credenciales = {
  correo: string;
  clave: string;
};

function credencialesInvalidas() {
  return new ApiError(401, "CREDENCIALES_INVALIDAS", MENSAJE_INVALIDO);
}

export async function iniciarSesion({ correo, clave }: Credenciales) {
  return ejecutarAccion(async () => {
    const correoLimpio = typeof correo === "string" ? correo.trim() : "";

    if (
      !FORMATO_CORREO.test(correoLimpio) ||
      typeof clave !== "string" ||
      !clave
    ) {
      throw credencialesInvalidas();
    }

    try {
      await auth.api.signInEmail({
        body: { email: correoLimpio, password: clave },
        headers: await headers(),
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw credencialesInvalidas();
      }

      throw error;
    }

    redirect("/");
  });
}
