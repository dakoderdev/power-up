import {
  formatearMovimientoStockApi,
  respuestaPaginada,
  TIPOS_MOVIMIENTO_API,
  type TipoMovimientoApi,
} from "@/lib/api/formato";
import {
  leerEnteroOpcional,
  leerOpcion,
  leerPaginacion,
  leerRangoDias,
} from "@/lib/api/parametros";
import { responder, ruta } from "@/lib/api/ruta";
import {
  listarMovimientos,
  type OrigenStock,
  type TipoStock,
} from "@/lib/stock/listado";

const FILTRO_POR_TIPO: Record<
  TipoMovimientoApi,
  { origen: OrigenStock; tipo?: TipoStock }
> = {
  venta: { origen: "venta" },
  anulacion: { origen: "anulacion" },
  ingreso: { origen: "manual", tipo: "entrada" },
  egreso: { origen: "manual", tipo: "salida" },
};

// RF-P6: movimientos de todos los productos, con filtros por producto, tipo y fechas.
export const GET = ruta({}, async ({ solicitud }) => {
  const parametros = solicitud.nextUrl.searchParams;
  const { page, pageSize } = leerPaginacion(parametros);
  const tipo = leerOpcion({
    parametros,
    nombre: "tipo",
    opciones: TIPOS_MOVIMIENTO_API,
  });
  const { desde, hasta } = leerRangoDias(parametros);

  const { movimientos, cantidad, pagina } = await listarMovimientos({
    productoId: leerEnteroOpcional(parametros, "productoId"),
    ...(tipo ? FILTRO_POR_TIPO[tipo] : {}),
    desde,
    hasta,
    paginaPedida: page,
    porPagina: pageSize,
  });

  return responder(
    respuestaPaginada({
      data: movimientos.map((movimiento) =>
        formatearMovimientoStockApi(movimiento),
      ),
      page: pagina,
      pageSize,
      total: cantidad,
    }),
  );
});
