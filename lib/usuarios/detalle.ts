import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requerirAdministrador } from "./sesion";

export async function consultarUsuario(id: string) {
  const [usuario] = await db
    .select({
      id: user.id,
      nombre: user.name,
      correo: user.email,
      rol: user.role,
      activo: user.active,
      creadoEn: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, id));

  return usuario ?? null;
}

// RF-U4: ficha de un usuario para la pantalla de edición (solo administrador).
export async function obtenerUsuario(id: string) {
  const actual = await requerirAdministrador();
  const usuario = await consultarUsuario(id);

  return usuario ? { usuario, esActual: usuario.id === actual.id } : null;
}

export type UsuarioDetalle = NonNullable<
  Awaited<ReturnType<typeof obtenerUsuario>>
>["usuario"];
