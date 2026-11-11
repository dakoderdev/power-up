import { asc, eq, inArray, sql } from "drizzle-orm";
import { obtenerSaldo } from "@/lib/cuentas/saldo";
import { db, type Transaccion } from "@/lib/db";
import {
  clientes,
  itemsVenta,
  movimientosCuenta,
  movimientosStock,
  productos,
  ventas,
} from "@/lib/db/schema";
import { aCentavos, deCentavos, formatearMoneda } from "@/lib/moneda";
import { formatearComprobante, PUNTO_VENTA } from "./comprobante";
import type { VentaEntrada } from "./esquemas";
import { CONSUMIDOR_FINAL } from "./etiquetas";
import { siguienteNumero } from "./numeracion";

type ErrorVenta = { productoId?: number; mensaje: string };
type Cliente = typeof clientes.$inferSelect;

type ResultadoConfirmar =
  | { confirmada: true; ventaId: number; comprobante: string }
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

async function buscarProductos(tx: Transaccion, ids: number[]) {
  return tx
    .select()
    .from(productos)
    .where(inArray(productos.id, ids))
    .orderBy(asc(productos.id));
}

async function excedeLimite({
  tx,
  cliente,
  centavos,
}: {
  tx: Transaccion;
  cliente: Cliente;
  centavos: number;
}) {
  if (cliente.limiteCredito === null) {
    return null;
  }

  const saldo = await obtenerSaldo({ consulta: tx, clienteId: cliente.id });
  const disponible = aCentavos(cliente.limiteCredito) - aCentavos(saldo);

  return centavos > disponible
    ? `La venta supera el límite de crédito de ${cliente.nombre}: le quedan ${formatearMoneda(deCentavos(Math.max(0, disponible)))} disponibles.`
    : null;
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

    if (entrada.clienteId !== null && !cliente) {
      return {
        confirmada: false,
        errores: [{ mensaje: "El cliente no existe." }],
      };
    }

    if (entrada.formaPago === "cuenta_corriente" && !cliente) {
      return {
        confirmada: false,
        errores: [
          {
            mensaje: "Cuenta corriente solo se admite con cliente registrado.",
          },
        ],
      };
    }

    const encontrados = await buscarProductos(tx, [...cantidades.keys()]);

    const errores: ErrorVenta[] = [];

    for (const [id, cantidad] of cantidades) {
      const prod = encontrados.find((p) => p.id === id);

      if (!prod) {
        errores.push({ productoId: id, mensaje: "El producto no existe." });
      } else if (!prod.activo) {
        errores.push({
          productoId: id,
          mensaje: `${prod.nombre} está inactivo.`,
        });
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
    const centavos = lineas.reduce((suma, linea) => suma + linea.centavos, 0);
    const total = deCentavos(centavos);

    const sinCredito =
      entrada.formaPago === "cuenta_corriente" && cliente
        ? await excedeLimite({ tx, cliente, centavos })
        : null;

    if (sinCredito) {
      return { confirmada: false, errores: [{ mensaje: sinCredito }] };
    }

    const [{ ventaId, numero }] = await tx
      .insert(ventas)
      .values({
        puntoVenta: PUNTO_VENTA,
        numero: siguienteNumero(PUNTO_VENTA),
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

    return {
      confirmada: true,
      ventaId,
      comprobante: formatearComprobante({ puntoVenta: PUNTO_VENTA, numero }),
    };
  });
}
