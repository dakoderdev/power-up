import { z } from "zod";

export const CODIGOS_API = [
  "JSON_INVALIDO",
  "NO_AUTENTICADO",
  "CREDENCIALES_INVALIDAS",
  "SIN_PERMISO",
  "NO_ENCONTRADO",
  "CODIGO_DUPLICADO",
  "DOCUMENTO_DUPLICADO",
  "EMAIL_DUPLICADO",
  "STOCK_INSUFICIENTE",
  "FACTURA_ANULADA",
  "VALIDACION",
  "PRODUCTO_INACTIVO",
  "CUENTA_CORRIENTE_NO_HABILITADA",
  "LIMITE_CREDITO_EXCEDIDO",
  "PAGO_SUPERA_DEUDA",
  "SALDO_PENDIENTE",
  "CONTRASENA_ACTUAL_INCORRECTA",
  "OPERACION_SOBRE_SI_MISMO",
  "ULTIMO_ADMINISTRADOR",
  "SALDO_INSUFICIENTE",
  "ERROR_INTERNO",
] as const;

export type CodigoApi = (typeof CODIGOS_API)[number];

export type DetalleCampo = { campo: string; mensaje: string };

// Sección 10.4: los servicios y adaptadores lanzan una única clase de error.
export class ApiError extends Error {
  readonly status: number;
  readonly code: CodigoApi;
  readonly details?: unknown;

  constructor(
    status: number,
    code: CodigoApi,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function noEncontrado(recurso: string) {
  return new ApiError(404, "NO_ENCONTRADO", `${recurso} no existe.`);
}

export function detallesDeZod(error: z.ZodError): DetalleCampo[] {
  return error.issues.map((problema) => ({
    campo: problema.path.join(".") || "(cuerpo)",
    mensaje: problema.message,
  }));
}

export function detallesDeCampos(
  errores: Partial<Record<string, string[]>>,
): DetalleCampo[] {
  return Object.entries(errores).flatMap(([campo, mensajes]) =>
    (mensajes ?? []).map((mensaje) => ({ campo, mensaje })),
  );
}

// Sección 11.1: toda respuesta de error tiene la misma forma.
export function responderError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      },
      { status: error.status },
    );
  }

  console.error(error);

  return Response.json(
    {
      error: {
        code: "ERROR_INTERNO" satisfies CodigoApi,
        message: "Ocurrió un error inesperado.",
      },
    },
    { status: 500 },
  );
}
