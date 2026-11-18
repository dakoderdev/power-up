import { and, count, eq } from "drizzle-orm";
import { ApiError, detallesDeCampos } from "@/lib/api/errores";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exigirAdministrador, type UsuarioServicio } from "@/lib/servicio";
import { esDuplicado } from "@/lib/db/errores";
import { account, session, user } from "@/lib/db/schema";
import type { UsuarioEdicion, UsuarioNuevo } from "./esquemas";
import { ROL_ADMINISTRADOR } from "./sesion";

const MENSAJE_DUPLICADO = "Ya hay un usuario con ese correo.";
const PROVEEDOR_CREDENCIALES = "credential";
const BYTES_CLAVE_TEMPORAL = 9;

export type ErroresUsuario = Partial<
  Record<keyof UsuarioNuevo | keyof UsuarioEdicion, string[]>
>;

export type CodigoErrorUsuario =
  | "EMAIL_DUPLICADO"
  | "NO_ENCONTRADO"
  | "OPERACION_SOBRE_SI_MISMO"
  | "ULTIMO_ADMINISTRADOR";

const CORREO_DUPLICADO = {
  codigo: "EMAIL_DUPLICADO" as const,
  errores: { correo: [MENSAJE_DUPLICADO] } as ErroresUsuario,
};

export type ResultadoCrear =
  | { creado: true; id: string }
  | { creado: false; codigo?: CodigoErrorUsuario; errores: ErroresUsuario };

export type ResultadoEditar =
  | { guardado: true }
  | {
      guardado: false;
      codigo?: CodigoErrorUsuario;
      errores: ErroresUsuario;
      mensaje?: string;
    };

// RF-U4 y US-06: alta con contraseña hasheada por Better Auth, sin abrir sesión como el nuevo usuario.
export async function crearUsuario({
  usuario,
  entrada,
}: {
  usuario: UsuarioServicio;
  entrada: UsuarioNuevo;
}): Promise<ResultadoCrear> {
  exigirAdministrador(usuario);
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
        providerId: PROVEEDOR_CREDENCIALES,
        userId: id,
        password: hash,
      });
    });

    return { creado: true, id };
  } catch (error) {
    if (esDuplicado(error)) {
      return { creado: false, ...CORREO_DUPLICADO };
    }

    throw error;
  }
}

// RF-U4, US-16, US-28 y US-29: edición con rol y estado; nunca queda el
// sistema sin administrador ni un admin se desactiva a sí mismo.
export async function editarUsuario({
  id,
  entrada,
  usuario,
}: {
  id: string;
  entrada: UsuarioEdicion;
  usuario: UsuarioServicio;
}): Promise<ResultadoEditar> {
  exigirAdministrador(usuario);
  const actualId = usuario.id;

  try {
    return await db.transaction(async (tx): Promise<ResultadoEditar> => {
      const [objetivo] = await tx
        .select({ rol: user.role, activo: user.active })
        .from(user)
        .where(eq(user.id, id));

      if (!objetivo) {
        return {
          guardado: false,
          codigo: "NO_ENCONTRADO",
          errores: {},
          mensaje: "El usuario ya no existe. Volvé al listado y elegí otro.",
        };
      }

      const cambiaRol = objetivo.rol !== entrada.rol;
      const seDesactiva = objetivo.activo && !entrada.activo;

      if (id === actualId && (cambiaRol || seDesactiva)) {
        return {
          guardado: false,
          codigo: "OPERACION_SOBRE_SI_MISMO",
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
            codigo: "ULTIMO_ADMINISTRADOR",
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

function generarClaveTemporal() {
  const bytes = crypto.getRandomValues(new Uint8Array(BYTES_CLAVE_TEMPORAL));

  return Buffer.from(bytes).toString("base64url");
}

// RF-U5 y US-19: el administrador restablece la contraseña de otro usuario;
// la temporal se muestra una sola vez y cierra sus sesiones abiertas.
export async function restablecerContrasena({
  usuario,
  id,
}: {
  usuario: UsuarioServicio;
  id: string;
}) {
  exigirAdministrador(usuario);
  const contexto = await auth.$context;
  const passwordTemporal = generarClaveTemporal();
  const hash = await contexto.password.hash(passwordTemporal);

  return db.transaction(async (tx) => {
    const [actualizada] = await tx
      .update(account)
      .set({ password: hash })
      .where(
        and(
          eq(account.userId, id),
          eq(account.providerId, PROVEEDOR_CREDENCIALES),
        ),
      )
      .returning({ id: account.id });

    if (!actualizada) {
      return null;
    }

    await tx.delete(session).where(eq(session.userId, id));

    return { passwordTemporal };
  });
}

const ESTADO_USUARIO: Record<CodigoErrorUsuario, number> = {
  EMAIL_DUPLICADO: 409,
  NO_ENCONTRADO: 404,
  OPERACION_SOBRE_SI_MISMO: 422,
  ULTIMO_ADMINISTRADOR: 422,
};

// Sección 10.4 y RF-U4: un alta fallida pasa a ApiError (409 EMAIL_DUPLICADO).
export function exigirUsuarioCreado(resultado: ResultadoCrear) {
  if (resultado.creado) {
    return resultado.id;
  }

  const detalles = detallesDeCampos(resultado.errores);

  throw new ApiError(
    ESTADO_USUARIO[resultado.codigo ?? "EMAIL_DUPLICADO"],
    resultado.codigo ?? "EMAIL_DUPLICADO",
    detalles[0]?.mensaje ?? MENSAJE_DUPLICADO,
    detalles,
  );
}

// Sección 10.4, RF-U4 y US-29: una edición fallida pasa a ApiError (409, 404 o 422 OPERACION_SOBRE_SI_MISMO).
export function exigirUsuarioGuardado(resultado: ResultadoEditar) {
  if (resultado.guardado) {
    return;
  }

  const codigo = resultado.codigo ?? "NO_ENCONTRADO";
  const detalles = detallesDeCampos(resultado.errores);

  throw new ApiError(
    ESTADO_USUARIO[codigo],
    codigo,
    resultado.mensaje ?? detalles[0]?.mensaje ?? "El usuario no existe.",
    detalles,
  );
}
