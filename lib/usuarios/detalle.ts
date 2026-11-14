import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requerirAdministrador } from "./sesion";

export async function obtenerUsuario(id: string) {
  const actual = await requerirAdministrador();

  const [usuario] = await db
    .select({
      id: user.id,
      nombre: user.name,
      correo: user.email,
      rol: user.role,
      activo: user.active,
    })
    .from(user)
    .where(eq(user.id, id));

  return usuario ? { usuario, esActual: usuario.id === actual.id } : null;
}

export type UsuarioDetalle = NonNullable<
  Awaited<ReturnType<typeof obtenerUsuario>>
>["usuario"];
