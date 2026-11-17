import type { PagoDetalle } from "@/lib/cuentas/pagar";
import { formatearRecibo } from "@/lib/cuentas/recibo";
import type { Tablero } from "@/lib/inicio/tablero";
import { aCentavos } from "@/lib/moneda";
import { esStockBajo } from "@/lib/stock/etiquetas";
import type { MovimientoStockFila } from "@/lib/stock/listado";
import { formatearComprobante } from "@/lib/ventas/comprobante";
import { calcularVuelto } from "@/lib/ventas/vuelto";
import type { VentaDetalle } from "@/lib/ventas/detalle";
import type { VentaFila } from "@/lib/ventas/listado";

// Sección 11.1: importes en centavos enteros y fechas ISO 8601 en UTC.
export function enCentavos(importe: string) {
  return aCentavos(importe);
}

export function enIso(fecha: Date) {
  return fecha.toISOString();
}

type ProductoBase = {
  id: number;
  codigo: string;
  nombre: string;
  precio: string;
  stock: number;
  stockMinimo: number;
  activo: boolean;
  imagenUrl: string | null;
  creadoEn?: Date;
};

export function formatearProductoApi(producto: ProductoBase) {
  return {
    id: producto.id,
    codigo: producto.codigo,
    descripcion: producto.nombre,
    precio: enCentavos(producto.precio),
    existencia: producto.stock,
    stockMinimo: producto.stockMinimo,
    bajoMinimo: esStockBajo(producto),
    activo: producto.activo,
    imagenUrl: producto.imagenUrl,
    ...(producto.creadoEn ? { creadoEn: enIso(producto.creadoEn) } : {}),
  };
}

type ClienteBase = {
  id: number;
  nombre: string;
  documento: string;
  telefono: string | null;
  email: string | null;
  limiteCredito: string | null;
  creadoEn?: Date;
};

export function formatearClienteApi({
  cliente,
  saldo,
}: {
  cliente: ClienteBase;
  saldo: string;
}) {
  const saldoCentavos = enCentavos(saldo);
  const limite =
    cliente.limiteCredito === null ? null : enCentavos(cliente.limiteCredito);

  return {
    id: cliente.id,
    nroDoc: cliente.documento,
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    email: cliente.email,
    limiteCredito: limite,
    saldo: saldoCentavos,
    disponible: limite === null ? null : limite - saldoCentavos,
    ...(cliente.creadoEn ? { creadoEn: enIso(cliente.creadoEn) } : {}),
  };
}

export const TIPOS_MOVIMIENTO_API = [
  "venta",
  "anulacion",
  "ingreso",
  "egreso",
] as const;

export type TipoMovimientoApi = (typeof TIPOS_MOVIMIENTO_API)[number];

function tipoMovimientoApi(
  movimiento: Pick<MovimientoStockFila, "tipo" | "origen">,
): TipoMovimientoApi {
  if (movimiento.origen !== "manual") {
    return movimiento.origen;
  }

  return movimiento.tipo === "entrada" ? "ingreso" : "egreso";
}

export function formatearMovimientoStockApi(
  movimiento: MovimientoStockFila,
  existenciaResultante?: number,
) {
  return {
    id: movimiento.id,
    producto: {
      id: movimiento.productoId,
      codigo: movimiento.productoCodigo,
      descripcion: movimiento.productoNombre,
    },
    tipo: tipoMovimientoApi(movimiento),
    cantidad:
      movimiento.tipo === "salida" ? -movimiento.cantidad : movimiento.cantidad,
    existenciaResultante:
      existenciaResultante ?? movimiento.existenciaResultante,
    motivo: movimiento.motivo,
    referencia:
      movimiento.ventaId === null ||
      movimiento.puntoVenta === null ||
      movimiento.numeroVenta === null
        ? null
        : {
            facturaId: movimiento.ventaId,
            numero: formatearComprobante({
              puntoVenta: movimiento.puntoVenta,
              numero: movimiento.numeroVenta,
            }),
          },
    usuario: { id: movimiento.usuarioId, nombre: movimiento.usuarioNombre },
    fecha: enIso(movimiento.creadoEn),
  };
}

function clienteDeFactura(venta: {
  clienteId: number | null;
  clienteNombre: string;
  clienteDocumento: string | null;
}) {
  return venta.clienteId === null
    ? null
    : {
        id: venta.clienteId,
        nombre: venta.clienteNombre,
        nroDoc: venta.clienteDocumento,
      };
}

function cabeceraFactura(venta: VentaFila | VentaDetalle) {
  return {
    id: venta.id,
    puntoVenta: venta.puntoVenta,
    numero: venta.numero,
    numeroFormateado: formatearComprobante(venta),
    fecha: enIso(venta.creadoEn),
    estado: venta.anuladaEn ? "anulada" : "emitida",
    cliente: clienteDeFactura(venta),
    vendedor: { id: venta.vendedorId, nombre: venta.vendedorNombre },
    total: enCentavos(venta.total),
    pago: { forma: venta.formaPago },
  };
}

export function formatearFacturaResumenApi(venta: VentaFila) {
  return cabeceraFactura(venta);
}

export function formatearFacturaApi({
  venta,
  saldoCliente,
}: {
  venta: VentaDetalle;
  saldoCliente?: string;
}) {
  return {
    ...cabeceraFactura(venta),
    pago: {
      forma: venta.formaPago,
      ...(venta.montoRecibido === null
        ? {}
        : {
            montoRecibido: enCentavos(venta.montoRecibido),
            vuelto: enCentavos(
              calcularVuelto({
                recibido: venta.montoRecibido,
                total: venta.total,
              }),
            ),
          }),
      ...(venta.tarjetaTipo === null
        ? {}
        : {
            tarjeta: {
              tipo: venta.tarjetaTipo,
              marca: venta.tarjetaMarca,
              ultimos4: venta.tarjetaUltimos4,
            },
          }),
    },
    items: venta.items.map((item) => ({
      productoId: item.productoId,
      codigo: item.codigo,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnitario: enCentavos(item.precioUnitario),
      subtotal: enCentavos(item.subtotal),
    })),
    ...(venta.anuladaEn && venta.anuladaPorId && venta.anuladaPor
      ? {
          anulacion: {
            fecha: enIso(venta.anuladaEn),
            usuario: { id: venta.anuladaPorId, nombre: venta.anuladaPor },
            motivo: venta.motivoAnulacion,
          },
        }
      : {}),
    ...(saldoCliente === undefined
      ? {}
      : { saldoCliente: enCentavos(saldoCliente) }),
  };
}

export function formatearPagoApi(pago: PagoDetalle) {
  return {
    id: pago.id,
    reciboNumero: pago.reciboNumero,
    reciboFormateado:
      pago.reciboNumero === null ? null : formatearRecibo(pago.reciboNumero),
    fecha: enIso(pago.fecha),
    cliente: { id: pago.clienteId, nombre: pago.clienteNombre },
    importe: enCentavos(pago.importe),
    observacion: pago.observacion,
    usuario: { id: pago.usuarioId, nombre: pago.usuarioNombre },
    saldoCliente: enCentavos(pago.saldoCliente),
  };
}

type UsuarioBase = {
  id: string;
  nombre: string;
  correo: string;
  rol: "admin" | "operator";
  activo: boolean;
  creadoEn?: Date;
};

export function formatearUsuarioApi(usuario: UsuarioBase) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.correo,
    rol: usuario.rol,
    activo: usuario.activo,
    ...(usuario.creadoEn ? { creadoEn: enIso(usuario.creadoEn) } : {}),
  };
}

export function formatearTableroApi(tablero: Tablero) {
  return {
    hoy: {
      cantidad: tablero.hoy.cantidad,
      importe: enCentavos(tablero.hoy.importe),
    },
    mes: {
      cantidad: tablero.mes.cantidad,
      importe: enCentavos(tablero.mes.importe),
      ticketPromedio: enCentavos(tablero.mes.ticketPromedio),
    },
    cuentasCorrientes: {
      totalAdeudado: enCentavos(tablero.cuentasCorrientes.totalAdeudado),
      clientesConSaldo: tablero.cuentasCorrientes.clientesConSaldo,
    },
    bajoMinimo: tablero.bajoMinimo,
    ventasDiarias: tablero.ventasDiarias.map((dia) => ({
      fecha: dia.fecha,
      importe: enCentavos(dia.importe),
    })),
    porFormaDePago: tablero.porFormaDePago.map((fila) => ({
      forma: fila.forma,
      importe: enCentavos(fila.importe),
    })),
    masVendidos: tablero.masVendidos.map((producto) => ({
      ...producto,
      importe: enCentavos(producto.importe),
    })),
  };
}

export function respuestaPaginada<T>({
  data,
  page,
  pageSize,
  total,
  extra = {},
}: {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  extra?: Record<string, unknown>;
}) {
  return { data, page, pageSize, total, ...extra };
}
