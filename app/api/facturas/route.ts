import { revalidatePath } from "next/cache";
import { ApiError, noEncontrado } from "@/lib/api/errores";
import { esquemaFacturaApi } from "@/lib/api/esquemas";
import {
  enCentavos,
  formatearFacturaApi,
  formatearFacturaResumenApi,
  respuestaPaginada,
} from "@/lib/api/formato";
import {
  leerBusqueda,
  leerEnteroOpcional,
  leerOpcion,
  leerPaginacion,
  leerRangoDias,
} from "@/lib/api/parametros";
import { leerJson, responder, ruta, validar } from "@/lib/api/ruta";
import { obtenerSaldo } from "@/lib/cuentas/saldo";
import { db } from "@/lib/db";
import { FORMAS_PAGO } from "@/lib/db/schema";
import { confirmarVenta, type ErrorVenta } from "@/lib/ventas/confirmar";
import { obtenerVenta } from "@/lib/ventas/detalle";
import { buscarVentas, ESTADOS_VENTA } from "@/lib/ventas/listado";

// RF-V8: facturas paginadas con filtros y el total emitido que cumple el filtro.
export const GET = ruta({}, async ({ solicitud }) => {
  const parametros = solicitud.nextUrl.searchParams;
  const { page, pageSize } = leerPaginacion(parametros);
  const { desde, hasta } = leerRangoDias(parametros);

  const { lista, cantidad, totalEmitido, pagina } = await buscarVentas({
    busqueda: leerBusqueda(parametros),
    desde,
    hasta,
    clienteId: leerEnteroOpcional(parametros, "clienteId"),
    vendedorId: parametros.get("vendedorId") ?? undefined,
    formaPago: leerOpcion({
      parametros,
      nombre: "forma",
      opciones: FORMAS_PAGO,
    }),
    estado: leerOpcion({
      parametros,
      nombre: "estado",
      opciones: ESTADOS_VENTA,
    }),
    paginaPedida: page,
    porPagina: pageSize,
  });

  return responder(
    respuestaPaginada({
      data: lista.map(formatearFacturaResumenApi),
      page: pagina,
      pageSize,
      total: cantidad,
      extra: { totalEmitido: enCentavos(totalEmitido) },
    }),
  );
});

function errorDeVenta(errores: ErrorVenta[]): ApiError {
  const sinStock = errores.filter((e) => e.codigo === "STOCK_INSUFICIENTE");

  if (sinStock.length > 0) {
    return new ApiError(
      409,
      "STOCK_INSUFICIENTE",
      "No hay existencia suficiente.",
      sinStock.map((e) => ({
        productoId: e.productoId,
        solicitado: e.solicitado,
        disponible: e.disponible,
        mensaje: e.mensaje,
      })),
    );
  }

  const [primero] = errores;

  switch (primero.codigo) {
    case "CLIENTE_INEXISTENTE":
      return noEncontrado("El cliente");
    case "PRODUCTO_INEXISTENTE":
      return noEncontrado("El producto");
    case "LIMITE_CREDITO_EXCEDIDO":
      return new ApiError(422, primero.codigo, primero.mensaje, {
        saldoActual: enCentavos(primero.saldoActual ?? "0"),
        limite: enCentavos(primero.limite ?? "0"),
        excedente: enCentavos(primero.excedente ?? "0"),
      });
    default:
      return new ApiError(422, primero.codigo, primero.mensaje);
  }
}

// RF-V1 a RF-V6: emite la factura en una sola transacción; precios y total los calcula el servidor.
export const POST = ruta({}, async ({ solicitud, usuario }) => {
  const entrada = validar(esquemaFacturaApi, await leerJson(solicitud));
  const resultado = await confirmarVenta({ entrada, usuarioId: usuario.id });

  if (!resultado.confirmada) {
    throw errorDeVenta(resultado.errores);
  }

  const venta = await obtenerVenta(resultado.ventaId);

  if (!venta) {
    throw noEncontrado("La factura");
  }

  const saldoCliente =
    venta.formaPago === "cuenta_corriente" && venta.clienteId !== null
      ? await obtenerSaldo({ consulta: db, clienteId: venta.clienteId })
      : undefined;

  revalidatePath("/");
  revalidatePath("/ventas");
  revalidatePath("/productos");
  revalidatePath("/stock");
  revalidatePath("/clientes");

  return responder(formatearFacturaApi({ venta, saldoCliente }), 201);
});
