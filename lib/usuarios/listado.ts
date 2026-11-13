import { cache } from "react";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { coincideBusqueda } from "@/lib/db/busqueda";
import { user } from "@/lib/db/schema";
import { ROL_ADMINISTRADOR, requerirAdministrador } from "./sesion";

export const contarAdministradoresActivos = cache(async () => {
  await requerirAdministrador();

  const [{ cantidad }] = await db
    .select({ cantidad: count() })
    .from(user)
    .where(and(eq(user.active, true), eq(user.role, ROL_ADMINISTRADOR)));

  return cantidad;
});

export const listarUsuarios = cache(async (busqueda: string) => {
  const actual = await requerirAdministrador();

  const [lista, administradoresActivos] = await Promise.all([
    db
      .select({
        id: user.id,
        nombre: user.name,
        correo: user.email,
        acceso: user.displayUsername,
        rol: user.role,
        activo: user.active,
      })
      .from(user)
      .where(
        busqueda
          ? coincideBusqueda({
              columnas: [user.name, user.email, user.displayUsername],
              busqueda,
            })
          : undefined,
      )
      .orderBy(desc(user.active), asc(user.name), asc(user.id)),
    contarAdministradoresActivos(),
  ]);

  const usuarios = lista.map(({ correo, acceso, ...usuario }) => ({
    ...usuario,
    acceso: acceso ?? correo,
    esActual: usuario.id === actual.id,
  }));

  return { usuarios, administradoresActivos };
});
