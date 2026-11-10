import { cache } from "react";
import { asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { ROL_ADMINISTRADOR, requerirAdministrador } from "./sesion";

export const listarUsuarios = cache(async () => {
  const actual = await requerirAdministrador();

  const lista = await db
    .select({
      id: user.id,
      nombre: user.name,
      correo: user.email,
      acceso: user.displayUsername,
      rol: user.role,
      activo: user.active,
    })
    .from(user)
    .orderBy(desc(user.active), asc(user.name), asc(user.id));

  const usuarios = lista.map(({ correo, acceso, ...usuario }) => ({
    ...usuario,
    acceso: acceso ?? correo,
    esActual: usuario.id === actual.id,
  }));
  const administradoresActivos = usuarios.filter(
    (usuario) => usuario.activo && usuario.rol === ROL_ADMINISTRADOR,
  ).length;

  return { usuarios, administradoresActivos };
});
