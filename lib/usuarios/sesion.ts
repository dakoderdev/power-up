import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import type { ROLES } from "@/lib/db/schema";
import type { CambioContrasena } from "./esquemas";

type Rol = (typeof ROLES)[number];

export const ROL_ADMINISTRADOR: Rol = "admin";

export const ETIQUETAS_ROL: Record<Rol, string> = {
  admin: "Administrador",
  operator: "Vendedor",
};

export const COLORES_ROL: Record<Rol, string> = {
  admin: "border-transparent bg-secondary text-secondary-foreground",
  operator: "border-transparent bg-secondary text-secondary-foreground",
};

export async function obtenerUsuarioActual() {
  const sesion = await auth.api.getSession({ headers: await headers() });

  if (!sesion || !sesion.user.active) {
    redirect("/login");
  }

  return {
    id: sesion.user.id,
    nombre: sesion.user.name,
    rol: sesion.user.role,
    esAdministrador: sesion.user.role === ROL_ADMINISTRADOR,
  };
}

export async function requerirAdministrador() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario.esAdministrador) {
    redirect("/");
  }

  return usuario;
}

export async function cerrarSesionActual() {
  await auth.api.signOut({ headers: await headers() });
}

// RF-U5 y US-20: cambio de la propia contraseña; Better Auth verifica la actual.
export async function cambiarContrasena({
  entrada,
  headers: cabeceras,
}: {
  entrada: CambioContrasena;
  headers: Headers;
}) {
  try {
    await auth.api.changePassword({
      body: {
        currentPassword: entrada.actual,
        newPassword: entrada.nueva,
        revokeOtherSessions: true,
      },
      headers: cabeceras,
    });

    return { cambiada: true as const };
  } catch (error) {
    if (error instanceof APIError) {
      return { cambiada: false as const };
    }

    throw error;
  }
}
