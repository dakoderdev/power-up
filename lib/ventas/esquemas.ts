import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { itemsVenta, ventas } from "@/lib/db/schema";
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

export const esquemaVentaEntrada = baseVenta
  .pick({ clienteId: true, formaPago: true })
  .extend({
    clienteId: idPositivo.nullable(),
    items: z.array(esquemaItemEntrada).min(1, "Agregá al menos un producto."),
  })
  .refine(
    (venta) =>
      venta.formaPago !== "cuenta_corriente" || venta.clienteId !== null,
    { message: MENSAJE_CUENTA, path: ["formaPago"] },
  );

export const esquemaVentaRegistro = createInsertSchema(ventas, {
  clienteNombre: (esquema) =>
    esquema.trim().min(1, "El nombre del cliente es obligatorio."),
  total: () => importePositivo,
})
  .omit({ id: true, creadoEn: true })
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

export type VentaEntrada = z.infer<typeof esquemaVentaEntrada>;
export type VentaRegistro = z.infer<typeof esquemaVentaRegistro>;
export type ItemRegistro = z.infer<typeof esquemaItemRegistro>;
