import { revalidatePath } from "next/cache";
import { noEncontrado } from "@/lib/api/errores";
import { aAjusteManual, esquemaMovimientoApi } from "@/lib/api/esquemas";
import {
  formatearMovimientoStockApi,
  respuestaPaginada,
} from "@/lib/api/formato";
import { leerPaginacion } from "@/lib/api/parametros";
import {
  exigir,
  leerId,
  leerJson,
  responder,
  ruta,
  validar,
} from "@/lib/api/ruta";
import { obtenerProducto } from "@/lib/productos/guardar";
import { ajustarStock, exigirAjuste } from "@/lib/stock/ajustar";
import { listarMovimientos, obtenerMovimiento } from "@/lib/stock/listado";

type Params = { id: string };

// RF-P6: historial de un producto, del más nuevo al más viejo.
export const GET = ruta<Params>({}, async ({ solicitud, params }) => {
  const productoId = leerId(params.id);
  const producto = await obtenerProducto(productoId);

  if (!producto) {
    throw noEncontrado("El producto");
  }

  const { page, pageSize } = leerPaginacion(solicitud.nextUrl.searchParams);
  const { movimientos, cantidad, pagina } = await listarMovimientos({
    productoId,
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

// RF-P4 y RF-P5: ingreso o egreso manual con motivo; nunca deja la existencia en negativo (admin).
export const POST = ruta<Params>(
  { admin: true },
  async ({ solicitud, usuario, params }) => {
    const productoId = leerId(params.id);
    const producto = await obtenerProducto(productoId);

    if (!producto) {
      throw noEncontrado("El producto");
    }

    const cuerpo = validar(esquemaMovimientoApi, await leerJson(solicitud));
    const entrada = exigir(aAjusteManual({ productoId, entrada: cuerpo }));
    const ajuste = exigirAjuste(await ajustarStock({ entrada, usuario }));
    const movimiento = await obtenerMovimiento(ajuste.movimientoId);

    if (!movimiento) {
      throw noEncontrado("El movimiento");
    }

    revalidatePath("/");
    revalidatePath("/stock");
    revalidatePath("/productos");
    revalidatePath(`/productos/${productoId}`);

    return responder(
      formatearMovimientoStockApi(movimiento, ajuste.stock),
      201,
    );
  },
);
