import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { rolEnum } from "@/lib/db/schema";

type Rol = (typeof rolEnum.enumValues)[number];

export const ROL_ADMINISTRADOR: Rol = "admin";

export const ETIQUETAS_ROL: Record<Rol, string> = {
  admin: "Administrador",
  operator: "Operador",
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
