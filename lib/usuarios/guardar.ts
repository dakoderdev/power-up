import { and, count, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { esDuplicado } from "@/lib/db/errores";
import { account, session, user } from "@/lib/db/schema";
import type { UsuarioEdicion, UsuarioNuevo } from "./esquemas";
import { ROL_ADMINISTRADOR } from "./sesion";

const MENSAJE_DUPLICADO = "Ya hay un usuario con ese correo.";

export type ErroresUsuario = Partial<
  Record<keyof UsuarioNuevo | keyof UsuarioEdicion, string[]>
>;

const CORREO_DUPLICADO = {
  errores: { correo: [MENSAJE_DUPLICADO] } as ErroresUsuario,
};

export type ResultadoCrear =
  { creado: true } | { creado: false; errores: ErroresUsuario };

export type ResultadoEditar =
  | { guardado: true }
  | { guardado: false; errores: ErroresUsuario; mensaje?: string };

export async function crearUsuario(
  entrada: UsuarioNuevo,
): Promise<ResultadoCrear> {
  const contexto = await auth.$context;
  const hash = await contexto.password.hash(entrada.contrasena);
  const id = crypto.randomUUID();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(user).values({
        id,
        name: entrada.nombre,
        email: entrada.correo,
        emailVerified: false,
        username: entrada.correo,
        displayUsername: entrada.correo,
        role: entrada.rol,
        active: true,
      });
      await tx.insert(account).values({
        id: crypto.randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: hash,
      });
    });

    return { creado: true };
  } catch (error) {
    if (esDuplicado(error)) {
      return { creado: false, ...CORREO_DUPLICADO };
    }

    throw error;
  }
}

export async function editarUsuario({
  id,
  entrada,
  actualId,
}: {
  id: string;
  entrada: UsuarioEdicion;
  actualId: string;
}): Promise<ResultadoEditar> {
  try {
    return await db.transaction(async (tx): Promise<ResultadoEditar> => {
      const [objetivo] = await tx
        .select({ rol: user.role, activo: user.active })
        .from(user)
        .where(eq(user.id, id));

      if (!objetivo) {
        return {
          guardado: false,
          errores: {},
          mensaje: "El usuario ya no existe. Volvé al listado y elegí otro.",
        };
      }

      const cambiaRol = objetivo.rol !== entrada.rol;
      const seDesactiva = objetivo.activo && !entrada.activo;

      if (id === actualId && (cambiaRol || seDesactiva)) {
        return {
          guardado: false,
          errores: {},
          mensaje:
            "No podés cambiar tu propio rol ni desactivarte. Pedíselo a otro administrador.",
        };
      }

      const dejaDeAdministrar =
        objetivo.activo &&
        objetivo.rol === ROL_ADMINISTRADOR &&
        (cambiaRol || seDesactiva);

      if (dejaDeAdministrar) {
        const [{ cantidad }] = await tx
          .select({ cantidad: count() })
          .from(user)
          .where(and(eq(user.active, true), eq(user.role, ROL_ADMINISTRADOR)));

        if (cantidad <= 1) {
          return {
            guardado: false,
            errores: {},
            mensaje:
              "Siempre tiene que quedar al menos un administrador activo.",
          };
        }
      }

      await tx
        .update(user)
        .set({
          name: entrada.nombre,
          email: entrada.correo,
          username: entrada.correo,
          displayUsername: entrada.correo,
          role: entrada.rol,
          active: entrada.activo,
        })
        .where(eq(user.id, id));

      if (seDesactiva) {
        await tx.delete(session).where(eq(session.userId, id));
      }

      return { guardado: true };
    });
  } catch (error) {
    if (esDuplicado(error)) {
      return { guardado: false, ...CORREO_DUPLICADO };
    }

    throw error;
  }
}
