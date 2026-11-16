import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { itemsVenta, TIPOS_TARJETA, ventas } from "@/lib/db/schema";
import {
  enteroPositivo,
  idPositivo,
  importePositivo,
} from "@/lib/esquemas-comunes";
import { aCentavos } from "@/lib/moneda";

const MENSAJE_CUENTA =
  "Cuenta corriente solo se admite con cliente registrado.";

const baseVenta = createInsertSchema(ventas);

export const esquemaItemEntrada = z.object({
  productoId: idPositivo,
  cantidad: enteroPositivo,
});

// VE-12 y regla 9: de la tarjeta solo tipo, marca y últimos 4; cualquier otro
// campo (como un número completo) se rechaza.
export const esquemaTarjeta = z.strictObject({
  tipo: z.enum(TIPOS_TARJETA, "Elegí débito o crédito."),
  marca: z
    .string("Indicá la marca.")
    .trim()
    .min(1, "Indicá la marca.")
    .max(30, "La marca es demasiado larga."),
  ultimos4: z
    .string("Ingresá los últimos 4 dígitos.")
    .trim()
    .regex(/^\d{4}$/, "Ingresá exactamente los últimos 4 dígitos."),
});

export const esquemaVentaEntrada = baseVenta
  .pick({ clienteId: true, formaPago: true })
  .extend({
    clienteId: idPositivo.nullable(),
    items: z.array(esquemaItemEntrada).min(1, "Agregá al menos un producto."),
    tarjeta: esquemaTarjeta.nullish(),
    montoRecibido: importePositivo.nullish(),
  })
  .refine(
    (venta) =>
      venta.formaPago !== "cuenta_corriente" || venta.clienteId !== null,
    { message: MENSAJE_CUENTA, path: ["formaPago"] },
  )
  .refine((venta) => venta.formaPago !== "tarjeta" || venta.tarjeta, {
    message: "Completá los datos de la tarjeta.",
    path: ["tarjeta"],
  })
  .refine((venta) => venta.formaPago === "tarjeta" || !venta.tarjeta, {
    message: "Los datos de tarjeta solo van con pago con tarjeta.",
    path: ["tarjeta"],
  })
  .refine((venta) => venta.formaPago === "contado" || !venta.montoRecibido, {
    message: "El monto recibido solo va con pago de contado.",
    path: ["montoRecibido"],
  });

export const esquemaVentaRegistro = createInsertSchema(ventas, {
  clienteNombre: (esquema) =>
    esquema.trim().min(1, "El nombre del cliente es obligatorio."),
  total: () => importePositivo,
})
  .omit({
    id: true,
    creadoEn: true,
    puntoVenta: true,
    numero: true,
    anuladaEn: true,
    anuladaPor: true,
    motivoAnulacion: true,
  })
  .refine(
    (venta) => venta.clienteId != null || venta.clienteDocumento == null,
    {
      message: "El consumidor final no lleva documento.",
      path: ["clienteDocumento"],
    },
  )
  .refine(
    (venta) =>
      venta.formaPago !== "cuenta_corriente" || venta.clienteId != null,
    { message: MENSAJE_CUENTA, path: ["formaPago"] },
  );

export const esquemaItemRegistro = createInsertSchema(itemsVenta, {
  codigo: (esquema) => esquema.trim().min(1),
  descripcion: (esquema) => esquema.trim().min(1),
  cantidad: () => enteroPositivo,
  precioUnitario: () => importePositivo,
  subtotal: () => importePositivo,
})
  .omit({ id: true })
  .refine(
    (item) =>
      aCentavos(item.subtotal) ===
      aCentavos(item.precioUnitario) * item.cantidad,
    {
      message: "El subtotal debe ser precio unitario × cantidad.",
      path: ["subtotal"],
    },
  );

export const esquemaAnulacion = baseVenta
  .pick({ id: true, motivoAnulacion: true })
  .extend({
    id: idPositivo,
    motivoAnulacion: z
      .string()
      .trim()
      .min(1, "Escribí el motivo de la anulación."),
  });

export type VentaEntrada = z.infer<typeof esquemaVentaEntrada>;
export type VentaRegistro = z.infer<typeof esquemaVentaRegistro>;
export type ItemRegistro = z.infer<typeof esquemaItemRegistro>;
export type Anulacion = z.infer<typeof esquemaAnulacion>;
