"use server";

import { redirect } from "next/navigation";
import { cerrarSesionActual } from "@/lib/usuarios/sesion";

export async function cerrarSesion() {
  await cerrarSesionActual();
  redirect("/login");
}
