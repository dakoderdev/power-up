import { z } from "zod";
import {
  esquemaClienteEdicion,
  esquemaClienteNuevo,
} from "@/lib/clientes/esquemas";
import { esquemaPago } from "@/lib/cuentas/esquemas";
import { FORMAS_PAGO, MEDIOS_PAGO, TIPOS_DOCUMENTO } from "@/lib/db/schema";
import { deCentavos } from "@/lib/moneda";
import {
  esquemaProductoEdicion,
  esquemaProductoNuevo,
} from "@/lib/productos/esquemas";
import { STOCK_MINIMO_INICIAL } from "@/lib/stock/etiquetas";
import { esquemaAjusteManual } from "@/lib/stock/esquemas";
import {
  esquemaCambioContrasena,
  esquemaUsuarioEdicion,
  esquemaUsuarioNuevo,
} from "@/lib/usuarios/esquemas";
import {
  esquemaAnulacion,
  esquemaTarjeta,
  esquemaVentaEntrada,
} from "@/lib/ventas/esquemas";

// Sección 10.4: la API habla en centavos y camelCase; estos esquemas son
// estrictos (rechazan campos no previstos) y se encadenan con los esquemas
// compartidos de lib/, donde viven las reglas.

const MENSAJE_CENTAVOS = "Debe ser un entero en centavos.";

const centavos = z
  .number(MENSAJE_CENTAVOS)
  .int(MENSAJE_CENTAVOS)
  .positive("Debe ser mayor que cero.");

const enteroNoNegativo = z
  .number("Debe ser un número entero.")
  .int("Debe ser un número entero.")
  .min(0, "No puede ser negativo.");

const idPositivo = z
  .number("Debe ser un entero.")
  .int("Debe ser un entero.")
  .positive("Debe ser mayor que cero.");

const texto = z.string("Debe ser texto.");

// Sección 11.1: la API habla de "vendedor"; en la base el rol se guarda como "operator".
export const ROLES_API = ["admin", "vendedor"] as const;

export type RolApi = (typeof ROLES_API)[number];

const ROL_INTERNO = { admin: "admin", vendedor: "operator" } as const;

export function aRolApi(rol: "admin" | "operator"): RolApi {
  return rol === "admin" ? "admin" : "vendedor";
}

const rolApi = z
  .enum(ROLES_API, "El rol es admin o vendedor.")
  .transform((rol) => ROL_INTERNO[rol]);

export const esquemaLoginApi = z.strictObject({
  email: texto.trim().min(1, "El correo es obligatorio."),
  password: texto.min(1, "La contraseña es obligatoria."),
});

export const esquemaContrasenaApi = z
  .strictObject({ actual: texto, nueva: texto })
  .pipe(esquemaCambioContrasena);

export const esquemaUsuarioNuevoApi = z
  .strictObject({
    nombre: texto,
    email: texto,
    rol: rolApi,
    password: texto,
  })
  .transform(({ email, password, ...resto }) => ({
    ...resto,
    correo: email,
    contrasena: password,
  }))
  .pipe(esquemaUsuarioNuevo);

export const esquemaUsuarioPatchApi = z.strictObject({
  nombre: texto.optional(),
  email: texto.optional(),
  rol: rolApi.optional(),
  activo: z.boolean().optional(),
});

export function fusionarUsuario({
  actual,
  cambios,
}: {
  actual: { nombre: string; correo: string; rol: string; activo: boolean };
  cambios: z.infer<typeof esquemaUsuarioPatchApi>;
}) {
  return esquemaUsuarioEdicion.safeParse({
    nombre: cambios.nombre ?? actual.nombre,
    correo: cambios.email ?? actual.correo,
    rol: cambios.rol ?? actual.rol,
    activo: cambios.activo ?? actual.activo,
  });
}

export const esquemaProductoNuevoApi = z
  .strictObject({
    codigo: texto,
    descripcion: texto,
    categoriaId: idPositivo,
    precio: centavos,
    stockInicial: enteroNoNegativo.optional(),
    stockMinimo: enteroNoNegativo.optional(),
    imagenUrl: texto.nullish(),
    activo: z.boolean().optional(),
  })
  .transform((producto): z.input<typeof esquemaProductoNuevo> => ({
    codigo: producto.codigo,
    nombre: producto.descripcion,
    categoriaId: producto.categoriaId,
    precio: deCentavos(producto.precio),
    stock: producto.stockInicial ?? 0,
    stockMinimo: producto.stockMinimo ?? STOCK_MINIMO_INICIAL,
    imagenUrl: producto.imagenUrl ?? null,
    activo: producto.activo ?? true,
  }))
  .pipe(esquemaProductoNuevo);

export const esquemaProductoPatchApi = z.strictObject({
  codigo: texto.optional(),
  descripcion: texto.optional(),
  categoriaId: idPositivo.optional(),
  precio: centavos.optional(),
  stockMinimo: enteroNoNegativo.optional(),
  imagenUrl: texto.nullish(),
  activo: z.boolean().optional(),
});

export function fusionarProducto({
  actual,
  cambios,
}: {
  actual: {
    codigo: string;
    nombre: string;
    categoriaId: number | null;
    precio: string;
    stockMinimo: number;
    imagenUrl: string | null;
    activo: boolean;
  };
  cambios: z.infer<typeof esquemaProductoPatchApi>;
}) {
  return esquemaProductoEdicion.safeParse({
    codigo: cambios.codigo ?? actual.codigo,
    nombre: cambios.descripcion ?? actual.nombre,
    categoriaId: cambios.categoriaId ?? actual.categoriaId,
    precio:
      cambios.precio === undefined ? actual.precio : deCentavos(cambios.precio),
    stockMinimo: cambios.stockMinimo ?? actual.stockMinimo,
    imagenUrl:
      cambios.imagenUrl === undefined ? actual.imagenUrl : cambios.imagenUrl,
    activo: cambios.activo ?? actual.activo,
  });
}

export const TIPOS_AJUSTE_API = ["ingreso", "egreso"] as const;

export const esquemaMovimientoApi = z.strictObject({
  tipo: z.enum(TIPOS_AJUSTE_API, "El tipo es ingreso o egreso."),
  cantidad: idPositivo,
  motivo: texto,
  observacion: texto.trim().optional(),
});

export function aAjusteManual({
  productoId,
  entrada,
}: {
  productoId: number;
  entrada: z.infer<typeof esquemaMovimientoApi>;
}) {
  return esquemaAjusteManual.safeParse({
    productoId,
    tipo: entrada.tipo === "ingreso" ? "entrada" : "salida",
    cantidad: entrada.cantidad,
    motivo: entrada.observacion
      ? `${entrada.motivo}: ${entrada.observacion}`
      : entrada.motivo,
  });
}

const tipoDoc = z.enum(TIPOS_DOCUMENTO, "El tipo de documento es DNI o CUIT.");

const camposCliente = {
  tipoDoc,
  nroDoc: texto,
  nombre: texto,
  domicilio: texto.nullish(),
  telefono: texto.nullish(),
  email: texto.nullish(),
  cuentaCorriente: z.boolean().optional(),
  limiteCredito: centavos.nullish(),
};

export const esquemaClienteNuevoApi = z
  .strictObject(camposCliente)
  .transform((cliente): z.input<typeof esquemaClienteNuevo> => ({
    tipoDoc: cliente.tipoDoc,
    nombre: cliente.nombre,
    documento: cliente.nroDoc,
    domicilio: cliente.domicilio ?? null,
    telefono: cliente.telefono ?? null,
    email: cliente.email ?? null,
    cuentaCorriente: cliente.cuentaCorriente ?? false,
    limiteCredito:
      cliente.limiteCredito == null ? null : deCentavos(cliente.limiteCredito),
  }))
  .pipe(esquemaClienteNuevo);

export const esquemaClientePatchApi = z.strictObject({
  tipoDoc: tipoDoc.optional(),
  nroDoc: texto.optional(),
  nombre: texto.optional(),
  domicilio: texto.nullish(),
  telefono: texto.nullish(),
  email: texto.nullish(),
  cuentaCorriente: z.boolean().optional(),
  limiteCredito: centavos.nullish(),
  activo: z.boolean().optional(),
});

export function fusionarCliente({
  actual,
  cambios,
}: {
  actual: {
    tipoDoc: (typeof TIPOS_DOCUMENTO)[number];
    nombre: string;
    documento: string;
    domicilio: string | null;
    telefono: string | null;
    email: string | null;
    cuentaCorriente: boolean;
    limiteCredito: string | null;
    activo: boolean;
  };
  cambios: z.infer<typeof esquemaClientePatchApi>;
}) {
  return esquemaClienteEdicion.safeParse({
    activo: cambios.activo ?? actual.activo,
    tipoDoc: cambios.tipoDoc ?? actual.tipoDoc,
    nombre: cambios.nombre ?? actual.nombre,
    documento: cambios.nroDoc ?? actual.documento,
    domicilio:
      cambios.domicilio === undefined ? actual.domicilio : cambios.domicilio,
    cuentaCorriente: cambios.cuentaCorriente ?? actual.cuentaCorriente,
    telefono:
      cambios.telefono === undefined ? actual.telefono : cambios.telefono,
    email: cambios.email === undefined ? actual.email : cambios.email,
    limiteCredito:
      cambios.limiteCredito === undefined
        ? actual.limiteCredito
        : cambios.limiteCredito === null
          ? null
          : deCentavos(cambios.limiteCredito),
  });
}

export const esquemaPagoApi = z.strictObject({
  importe: centavos,
  medio: z.enum(
    MEDIOS_PAGO,
    "El medio es efectivo, transferencia o tarjeta_debito.",
  ),
  observacion: texto.nullish(),
});

export function aPagoEntrada({
  clienteId,
  entrada,
}: {
  clienteId: number;
  entrada: z.infer<typeof esquemaPagoApi>;
}) {
  return esquemaPago.safeParse({
    clienteId,
    importe: deCentavos(entrada.importe),
    medio: entrada.medio,
    observacion: entrada.observacion ?? null,
  });
}

export const esquemaFacturaApi = z
  .strictObject({
    clienteId: idPositivo.nullable(),
    items: z
      .array(
        z.strictObject({ productoId: idPositivo, cantidad: idPositivo }),
        "Los ítems deben ser una lista.",
      )
      .min(1, "Agregá al menos un producto.")
      .refine(
        (items) =>
          new Set(items.map((item) => item.productoId)).size === items.length,
        "No se admiten productos repetidos.",
      ),
    pago: z.strictObject({
      forma: z.enum(FORMAS_PAGO, "Forma de pago inválida."),
      montoRecibido: centavos.nullish(),
      tarjeta: esquemaTarjeta.nullish(),
    }),
  })
  .transform((factura): z.input<typeof esquemaVentaEntrada> => ({
    clienteId: factura.clienteId,
    formaPago: factura.pago.forma,
    items: factura.items,
    tarjeta: factura.pago.tarjeta,
    montoRecibido:
      factura.pago.montoRecibido == null
        ? factura.pago.montoRecibido
        : deCentavos(factura.pago.montoRecibido),
  }))
  .pipe(esquemaVentaEntrada);

export const esquemaAnulacionApi = z.strictObject({ motivo: texto });

export function aAnulacion({ id, motivo }: { id: number; motivo: string }) {
  return esquemaAnulacion.safeParse({ id, motivoAnulacion: motivo });
}
