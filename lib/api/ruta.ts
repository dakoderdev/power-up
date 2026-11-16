import { connection, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ROL_ADMINISTRADOR } from "@/lib/usuarios/sesion";
import { ApiError, detallesDeZod, responderError } from "./errores";

export type UsuarioApi = {
  id: string;
  nombre: string;
  email: string;
  rol: "admin" | "operator";
  esAdministrador: boolean;
};

type Contexto<P> = {
  solicitud: NextRequest;
  usuario: UsuarioApi;
  params: P;
};

type ContextoPublico<P> = Omit<Contexto<P>, "usuario">;

type Opciones = { admin?: boolean };

// Sección 10.5: el usuario se resuelve contra la base en cada pedido.
export async function obtenerUsuarioApi(
  solicitud: NextRequest,
): Promise<UsuarioApi | null> {
  const sesion = await auth.api.getSession({ headers: solicitud.headers });

  if (!sesion || !sesion.user.active) {
    return null;
  }

  return {
    id: sesion.user.id,
    nombre: sesion.user.name,
    email: sesion.user.email,
    rol: sesion.user.role,
    esAdministrador: sesion.user.role === ROL_ADMINISTRADOR,
  };
}

// RF-U2 y sección 11.1: toda ruta exige sesión; una ruta de admin responde 403.
async function requerirUsuarioApi({
  solicitud,
  admin,
}: {
  solicitud: NextRequest;
  admin: boolean;
}) {
  const usuario = await obtenerUsuarioApi(solicitud);

  if (!usuario) {
    throw new ApiError(401, "NO_AUTENTICADO", "Iniciá sesión para continuar.");
  }

  if (admin && !usuario.esAdministrador) {
    throw new ApiError(
      403,
      "SIN_PERMISO",
      "Esta operación es solo para administradores.",
    );
  }

  return usuario;
}

// Sección 10.3: envoltorio común de los Route Handlers.
export function ruta<P = Record<string, never>>(
  { admin = false }: Opciones,
  controlador: (contexto: Contexto<P>) => Promise<Response>,
) {
  return async (
    solicitud: NextRequest,
    { params }: { params: Promise<P> },
  ): Promise<Response> => {
    await connection();

    try {
      const usuario = await requerirUsuarioApi({ solicitud, admin });

      return await controlador({ solicitud, usuario, params: await params });
    } catch (error) {
      return responderError(error);
    }
  };
}

export function rutaPublica<P = Record<string, never>>(
  controlador: (contexto: ContextoPublico<P>) => Promise<Response>,
) {
  return async (
    solicitud: NextRequest,
    { params }: { params: Promise<P> },
  ): Promise<Response> => {
    await connection();

    try {
      return await controlador({ solicitud, params: await params });
    } catch (error) {
      return responderError(error);
    }
  };
}

export async function leerJson(solicitud: NextRequest): Promise<unknown> {
  try {
    return await solicitud.json();
  } catch {
    throw new ApiError(400, "JSON_INVALIDO", "El cuerpo no es JSON válido.");
  }
}

// Sección 10.4: el mismo esquema de Zod valida en el servidor; 422 con detalle por campo.
export function validar<S extends z.ZodType>(
  esquema: S,
  datos: unknown,
): z.output<S> {
  const resultado = esquema.safeParse(datos);

  if (!resultado.success) {
    throw new ApiError(
      422,
      "VALIDACION",
      "Hay campos con errores.",
      detallesDeZod(resultado.error),
    );
  }

  return resultado.data;
}

export function exigir<T>(resultado: z.ZodSafeParseResult<T>): T {
  if (!resultado.success) {
    throw new ApiError(
      422,
      "VALIDACION",
      "Hay campos con errores.",
      detallesDeZod(resultado.error),
    );
  }

  return resultado.data;
}

export function leerId(texto: string) {
  const id = Number(texto);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "El recurso no existe.");
  }

  return id;
}

export function responder(datos: unknown, status = 200) {
  return Response.json(datos, { status });
}

export function responderVacio() {
  return new Response(null, { status: 204 });
}
