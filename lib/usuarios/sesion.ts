import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const ROL_ADMINISTRADOR = "admin";

export const ETIQUETAS_ROL: Record<string, string> = {
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

export async function cerrarSesionActual() {
  await auth.api.signOut({ headers: await headers() });
}
