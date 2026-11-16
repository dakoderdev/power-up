import { cache } from "react";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { coincideBusqueda } from "@/lib/db/busqueda";
import { user } from "@/lib/db/schema";
import { ROL_ADMINISTRADOR, requerirAdministrador } from "./sesion";

async function contarAdministradores() {
  const [{ cantidad }] = await db
    .select({ cantidad: count() })
    .from(user)
    .where(and(eq(user.active, true), eq(user.role, ROL_ADMINISTRADOR)));

  return cantidad;
}

export const contarAdministradoresActivos = cache(async () => {
  await requerirAdministrador();

  return contarAdministradores();
});

// RF-U4 y US-26: usuarios sin el hash, primero los activos, por nombre;
// con filtro por búsqueda y estado.
export async function consultarUsuarios({
  busqueda,
  activo,
}: {
  busqueda: string;
  activo?: boolean;
}) {
  return db
    .select({
      id: user.id,
      nombre: user.name,
      correo: user.email,
      acceso: user.displayUsername,
      rol: user.role,
      activo: user.active,
      creadoEn: user.createdAt,
    })
    .from(user)
    .where(
      and(
        busqueda
          ? coincideBusqueda({
              columnas: [user.name, user.email, user.displayUsername],
              busqueda,
            })
          : undefined,
        activo === undefined ? undefined : eq(user.active, activo),
      ),
    )
    .orderBy(desc(user.active), asc(user.name), asc(user.id));
}

export const listarUsuarios = cache(async (busqueda: string) => {
  const actual = await requerirAdministrador();

  const [lista, administradoresActivos] = await Promise.all([
    consultarUsuarios({ busqueda }),
    contarAdministradoresActivos(),
  ]);

  const usuarios = lista.map(({ correo, acceso, ...usuario }) => ({
    ...usuario,
    acceso: acceso ?? correo,
    esActual: usuario.id === actual.id,
  }));

  return { usuarios, administradoresActivos };
});
