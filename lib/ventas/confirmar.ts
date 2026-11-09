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

    const encontrados = await bloquearProductos(tx, [...cantidades.keys()]);

    const errores: ErrorVenta[] = [];

    for (const [id, cantidad] of cantidades) {
      const prod = encontrados.find((p) => p.id === id);

      if (!prod) {
        errores.push({ productoId: id, mensaje: "El producto no existe." });
      } else if (!prod.activo) {
        errores.push({ productoId: id, mensaje: `${prod.nombre} está inactivo.` });
      } else if (prod.stock < cantidad) {
        errores.push({
          productoId: id,
          mensaje: `Stock insuficiente de ${prod.nombre} (hay ${prod.stock}).`,
        });
      }
    }

    if (errores.length > 0) {
      return { confirmada: false, errores };
    }

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