import { and, eq, ne } from "drizzle-orm";
import { ApiError, detallesDeCampos } from "@/lib/api/errores";
import { db } from "@/lib/db";
import { esDuplicado } from "@/lib/db/errores";
import { obtenerSaldo } from "@/lib/cuentas/saldo";
import { clientes } from "@/lib/db/schema";
import { aCentavos } from "@/lib/moneda";
import type { ClienteEdicion, ClienteNuevo } from "./esquemas";

const MENSAJE_DUPLICADO = "Ya hay un cliente con ese documento.";

export type ErroresCliente = Partial<Record<keyof ClienteEdicion, string[]>>;

export const MENSAJE_SALDO_PENDIENTE =
  "No se puede dar de baja: el cliente tiene saldo pendiente. Registrá el pago antes.";

export const MENSAJE_SALDO_CUENTA =
  "No se puede quitar la cuenta corriente: el cliente tiene saldo pendiente.";

const DOCUMENTO_DUPLICADO = {
  errores: { documento: [MENSAJE_DUPLICADO] } as ErroresCliente,
};

async function documentoEnUso({
  documento,
  exceptoId,
}: {
  documento: string;
  exceptoId?: number;
}) {
  const [existente] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(
      and(
        eq(clientes.documento, documento),
        exceptoId === undefined ? undefined : ne(clientes.id, exceptoId),
      ),
    );

  return Boolean(existente);
}

// RF-C2 y RF-V2: alta de cliente con documento único; la usa también el alta rápida de la venta.
export async function crearCliente(entrada: ClienteNuevo) {
  if (await documentoEnUso({ documento: entrada.documento })) {
    return { creado: false as const, ...DOCUMENTO_DUPLICADO };
  }

  try {
    const [cliente] = await db.insert(clientes).values(entrada).returning({
      id: clientes.id,
      nombre: clientes.nombre,
      tipoDoc: clientes.tipoDoc,
      documento: clientes.documento,
      cuentaCorriente: clientes.cuentaCorriente,
    });

    return { creado: true as const, cliente };
  } catch (error) {
    if (esDuplicado(error)) {
      return { creado: false as const, ...DOCUMENTO_DUPLICADO };
    }

    throw error;
  }
}

export type ResultadoEditar =
  | { guardado: true }
  | {
      guardado: false;
      codigo?: "SALDO_PENDIENTE";
      errores: ErroresCliente;
      mensaje?: string;
    };

// RF-C2 y RF-C7: edita el cliente; la baja es lógica y no se admite con saldo pendiente.
export async function editarCliente({
  id,
  entrada,
}: {
  id: number;
  entrada: ClienteEdicion;
}): Promise<ResultadoEditar> {
  if (await documentoEnUso({ documento: entrada.documento, exceptoId: id })) {
    return { guardado: false, ...DOCUMENTO_DUPLICADO };
  }

  if (!entrada.activo || !entrada.cuentaCorriente) {
    const saldo = await obtenerSaldo({ consulta: db, clienteId: id });

    if (aCentavos(saldo) !== 0) {
      return {
        guardado: false,
        codigo: "SALDO_PENDIENTE",
        errores: entrada.activo
          ? { cuentaCorriente: [MENSAJE_SALDO_CUENTA] }
          : { activo: [MENSAJE_SALDO_PENDIENTE] },
      };
    }
  }

  try {
    const [cliente] = await db
      .update(clientes)
      .set(entrada)
      .where(eq(clientes.id, id))
      .returning({ id: clientes.id });

    return cliente
      ? { guardado: true }
      : {
          guardado: false,
          errores: {},
          mensaje: "El cliente ya no existe. Volvé al listado y elegí otro.",
        };
  } catch (error) {
    if (esDuplicado(error)) {
      return { guardado: false, ...DOCUMENTO_DUPLICADO };
    }

    throw error;
  }
}

// Sección 10.4 y RF-C2: un alta fallida pasa a ApiError (409 DOCUMENTO_DUPLICADO).
export function exigirClienteCreado(
  resultado: Awaited<ReturnType<typeof crearCliente>>,
) {
  if (resultado.creado) {
    return resultado.cliente;
  }

  throw new ApiError(
    409,
    "DOCUMENTO_DUPLICADO",
    resultado.errores.documento?.[0] ?? MENSAJE_DUPLICADO,
    detallesDeCampos(resultado.errores),
  );
}

// Sección 10.4, RF-C7 y CL-12: una edición fallida pasa a ApiError (422 SALDO_PENDIENTE, 409 DOCUMENTO_DUPLICADO).
export function exigirClienteGuardado(resultado: ResultadoEditar) {
  if (resultado.guardado) {
    return;
  }

  const detalles = detallesDeCampos(resultado.errores);

  if (resultado.codigo === "SALDO_PENDIENTE") {
    throw new ApiError(
      422,
      "SALDO_PENDIENTE",
      detalles[0]?.mensaje ?? MENSAJE_SALDO_PENDIENTE,
      detalles,
    );
  }

  if (resultado.errores.documento) {
    throw new ApiError(
      409,
      "DOCUMENTO_DUPLICADO",
      resultado.errores.documento[0],
      detalles,
    );
  }

  throw new ApiError(
    404,
    "NO_ENCONTRADO",
    resultado.mensaje ?? "El cliente no existe.",
  );
}
