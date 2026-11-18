import { ApiError, type CodigoApi, type DetalleCampo } from "@/lib/api/errores";

export type ErrorAccion = {
  code: CodigoApi;
  message: string;
  details?: DetalleCampo[];
};

export type ResultadoAccion<T> =
  { ok: true; data: T } | { ok: false; error: ErrorAccion };

function esDetalleCampo(valor: unknown): valor is DetalleCampo[] {
  return (
    Array.isArray(valor) &&
    valor.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "campo" in item &&
        "mensaje" in item,
    )
  );
}

// Sección 10.3: envoltorio de las Server Actions; devuelve el error en vez de lanzarlo.
export async function ejecutarAccion<T>(
  operacion: () => Promise<T>,
): Promise<ResultadoAccion<T>> {
  try {
    return { ok: true, data: await operacion() };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...(esDetalleCampo(error.details) ? { details: error.details } : {}),
        },
      };
    }

    if (esRedireccion(error)) {
      throw error;
    }

    console.error(error);

    return {
      ok: false,
      error: { code: "ERROR_INTERNO", message: "Ocurrió un error inesperado." },
    };
  }
}

function esRedireccion(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

// Sección 10.6: errores por campo para el formulario (primero Zod, después el servidor).
export function erroresPorCampo(error: ErrorAccion) {
  return (error.details ?? []).reduce<Record<string, string[]>>(
    (errores, { campo, mensaje }) => ({
      ...errores,
      [campo]: [...(errores[campo] ?? []), mensaje],
    }),
    {},
  );
}
