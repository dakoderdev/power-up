import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clientes,
  itemsVenta,
  movimientosCuenta,
  movimientosStock,
  productos,
  ventas,
} from "@/lib/db/schema";
import { aCentavos, deCentavos } from "@/lib/moneda";
import type { VentaEntrada } from "./esquemas";
import { CONSUMIDOR_FINAL } from "./etiquetas";

type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];
type ErrorVenta = { productoId?: number; mensaje: string };

type ResultadoConfirmar =
  | { confirmada: true; ventaId: number; numero: number }
  | { confirmada: false; errores: ErrorVenta[] };

function unificarItems(items: VentaEntrada["items"]) {
  const cantidades = new Map<number, number>();

  for (const item of items) {
    cantidades.set(
      item.productoId,
      (cantidades.get(item.productoId) ?? 0) + item.cantidad,
    );
  }

  return cantidades;
}

async function bloquearProductos(tx: Transaccion, ids: number[]) {
  return tx
    .select()
    .from(productos)
    .where(inArray(productos.id, ids))
    .orderBy(asc(productos.id))
    .for("update");
}

export async function confirmarVenta({
  entrada,
  usuarioId,
}: {
  entrada: VentaEntrada;
  usuarioId: string;
}): Promise<ResultadoConfirmar> {
  const cantidades = unificarItems(entrada.items);

  return db.transaction(async (tx) => {
    const [cliente] =
      entrada.clienteId === null
        ? []
        : await tx
            .select()
            .from(clientes)
            .where(eq(clientes.id, entrada.clienteId));

    // TODO #4 (VE-15): si vino clienteId y `cliente` no existe, devolver
    // { confirmada: false, errores: [{ mensaje }] } antes de escribir nada;
    // hoy se grabaría como consumidor final. El rechazo de cuenta corriente
    // sin cliente ya está en esquemaVentaEntrada: la server action tiene que
    // correr safeParse antes de llamar a confirmarVenta.

    const encontrados = await bloquearProductos(tx, [...cantidades.keys()]);

    // TODO #2 (VE-03, VE-13, VE-14): recorrer `cantidades` contra `encontrados`
    // y juntar un ErrorVenta por cada producto inexistente, inactivo o con
    // stock < cantidad. Si hay errores, devolver { confirmada: false, errores }
    // acá, antes del primer insert. Tiene que ir después del bloqueo para que
    // el stock leído no cambie (VE-22). Las cantidades enteras positivas
    // (VE-04) las valida esquemaVentaEntrada en la server action.

    const lineas = encontrados.map((producto) => {
      const cantidad = cantidades.get(producto.id)!;

      return {
        producto,
        cantidad,
        centavos: aCentavos(producto.precio) * cantidad,
      };
    });
    const total = deCentavos(
      lineas.reduce((suma, linea) => suma + linea.centavos, 0),
    );

    const [{ ventaId, numero }] = await tx
      .insert(ventas)
      .values({
        clienteId: cliente?.id ?? null,
        clienteNombre: cliente?.nombre ?? CONSUMIDOR_FINAL,
        clienteDocumento: cliente?.documento ?? null,
        formaPago: entrada.formaPago,
        total,
        usuarioId,
      })
      .returning({ ventaId: ventas.id, numero: ventas.numero });

    await tx.insert(itemsVenta).values(
      lineas.map((linea) => ({
        ventaId,
        productoId: linea.producto.id,
        codigo: linea.producto.codigo,
        descripcion: linea.producto.nombre,
        cantidad: linea.cantidad,
        precioUnitario: linea.producto.precio,
        subtotal: deCentavos(linea.centavos),
      })),
    );

    await tx.insert(movimientosStock).values(
      lineas.map((linea) => ({
        productoId: linea.producto.id,
        tipo: "salida" as const,
        origen: "venta" as const,
        cantidad: linea.cantidad,
        ventaId,
        usuarioId,
      })),
    );

    for (const linea of lineas) {
      await tx
        .update(productos)
        .set({ stock: sql`${productos.stock} - ${linea.cantidad}` })
        .where(eq(productos.id, linea.producto.id));
    }

    if (entrada.formaPago === "cuenta_corriente" && cliente) {
      await tx.insert(movimientosCuenta).values({
        clienteId: cliente.id,
        tipo: "venta",
        importe: total,
        ventaId,
        usuarioId,
      });
    }

    return { confirmada: true, ventaId, numero };
  });
}
