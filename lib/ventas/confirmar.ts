import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
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

export type CodigoErrorVenta =
  | "CLIENTE_INEXISTENTE"
  | "CUENTA_CORRIENTE_NO_HABILITADA"
  | "PRODUCTO_INEXISTENTE"
  | "PRODUCTO_INACTIVO"
  | "STOCK_INSUFICIENTE"
  | "LIMITE_CREDITO_EXCEDIDO";

export type ErrorVenta = {
  codigo: CodigoErrorVenta;
  mensaje: string;
  productoId?: number;
  solicitado?: number;
  disponible?: number;
  saldoActual?: string;
  limite?: string;
  excedente?: string;
};

type Cliente = typeof clientes.$inferSelect;

type ResultadoConfirmar =
  | { confirmada: true; ventaId: number; comprobante: string }
  | { confirmada: false; errores: ErrorVenta[] };

class StockAgotado extends Error {
  readonly productoId: number;
  readonly nombre: string;
  readonly solicitado: number;

  constructor({
    productoId,
    nombre,
    solicitado,
  }: {
    productoId: number;
    nombre: string;
    solicitado: number;
  }) {
    super("Stock agotado durante la confirmación.");
    this.productoId = productoId;
    this.nombre = nombre;
    this.solicitado = solicitado;
  }
}

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

// Regla 7 y CC-11: una venta a cuenta no deja el saldo por encima del límite.
async function excedeLimite({
  tx,
  cliente,
  centavos,
}: {
  tx: Transaccion;
  cliente: Cliente;
  centavos: number;
}): Promise<ErrorVenta | null> {
  if (cliente.limiteCredito === null) {
    return null;
  }

  const saldo = await obtenerSaldo({ consulta: tx, clienteId: cliente.id });
  const limite = aCentavos(cliente.limiteCredito);
  const disponible = limite - aCentavos(saldo);

  if (centavos <= disponible) {
    return null;
  }

  return {
    codigo: "LIMITE_CREDITO_EXCEDIDO",
    mensaje: `La venta supera el límite de crédito de ${cliente.nombre}: le quedan ${formatearMoneda(deCentavos(Math.max(0, disponible)))} disponibles.`,
    saldoActual: saldo,
    limite: cliente.limiteCredito,
    excedente: deCentavos(centavos - disponible),
  };
}

// RF-V6 y reglas 1 a 4: vuelve a verificar stock, asigna el número, congela
// precio y descripción, descuenta existencias con condición y registra el
// débito en cuenta corriente, todo en una sola transacción (VE-13 a VE-22).
export async function confirmarVenta({
  entrada,
  usuarioId,
}: {
  entrada: VentaEntrada;
  usuarioId: string;
}): Promise<ResultadoConfirmar> {
  const cantidades = unificarItems(entrada.items);

  try {
    return await db.transaction(async (tx) => {
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
          errores: [
            { codigo: "CLIENTE_INEXISTENTE", mensaje: "El cliente no existe." },
          ],
        };
      }

      if (entrada.formaPago === "cuenta_corriente" && !cliente) {
        return {
          confirmada: false,
          errores: [
            {
              codigo: "CUENTA_CORRIENTE_NO_HABILITADA",
              mensaje:
                "Cuenta corriente solo se admite con cliente registrado.",
            },
          ],
        };
      }

      const encontrados = await buscarProductos(tx, [...cantidades.keys()]);

      const errores: ErrorVenta[] = [];

      for (const [id, cantidad] of cantidades) {
        const prod = encontrados.find((p) => p.id === id);

        if (!prod) {
          errores.push({
            codigo: "PRODUCTO_INEXISTENTE",
            productoId: id,
            mensaje: "El producto no existe.",
          });
        } else if (!prod.activo) {
          errores.push({
            codigo: "PRODUCTO_INACTIVO",
            productoId: id,
            mensaje: `${prod.nombre} está inactivo.`,
          });
        } else if (prod.stock < cantidad) {
          errores.push({
            codigo: "STOCK_INSUFICIENTE",
            productoId: id,
            solicitado: cantidad,
            disponible: prod.stock,
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
        return { confirmada: false, errores: [sinCredito] };
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
        const [descontado] = await tx
          .update(productos)
          .set({ stock: sql`${productos.stock} - ${linea.cantidad}` })
          .where(
            and(
              eq(productos.id, linea.producto.id),
              gte(productos.stock, linea.cantidad),
            ),
          )
          .returning({ id: productos.id });

        if (!descontado) {
          throw new StockAgotado({
            productoId: linea.producto.id,
            nombre: linea.producto.nombre,
            solicitado: linea.cantidad,
          });
        }
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
        comprobante: formatearComprobante({
          puntoVenta: PUNTO_VENTA,
          numero,
        }),
      };
    });
  } catch (error) {
    if (error instanceof StockAgotado) {
      return {
        confirmada: false,
        errores: [
          {
            codigo: "STOCK_INSUFICIENTE",
            productoId: error.productoId,
            solicitado: error.solicitado,
            mensaje: `Stock insuficiente de ${error.nombre}: otra venta se lo llevó. Revisá la cantidad.`,
          },
        ],
      };
    }

    throw error;
  }
}
