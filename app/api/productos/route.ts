import { revalidatePath } from "next/cache";
import { ApiError, detallesDeCampos, noEncontrado } from "@/lib/api/errores";
import { esquemaProductoNuevoApi } from "@/lib/api/esquemas";
import { formatearProductoApi, respuestaPaginada } from "@/lib/api/formato";
import {
  leerBooleano,
  leerBusqueda,
  leerOpcion,
  leerPaginacion,
} from "@/lib/api/parametros";
import { leerJson, responder, ruta, validar } from "@/lib/api/ruta";
import { crearProducto, obtenerProducto } from "@/lib/productos/guardar";
import { listarProductos } from "@/lib/productos/listado";

const FILTROS_ACTIVO = ["true", "false", "todos"] as const;

// RF-P1: catálogo paginado con búsqueda, filtro por estado y bajo mínimo.
export const GET = ruta({}, async ({ solicitud }) => {
  const parametros = solicitud.nextUrl.searchParams;
  const { page, pageSize } = leerPaginacion(parametros);
  const activo =
    leerOpcion({ parametros, nombre: "activo", opciones: FILTROS_ACTIVO }) ??
    "true";

  const { lista, cantidad, pagina } = await listarProductos({
    busqueda: leerBusqueda(parametros),
    orden: "nombre",
    paginaPedida: page,
    porPagina: pageSize,
    activo: activo === "todos" ? undefined : activo === "true",
    bajoMinimo: leerBooleano(parametros, "bajoMinimo"),
  });

  return responder(
    respuestaPaginada({
      data: lista.map(formatearProductoApi),
      page: pagina,
      pageSize,
      total: cantidad,
    }),
  );
});

// RF-P2: alta de producto; el stock inicial se registra como ingreso (admin).
export const POST = ruta({ admin: true }, async ({ solicitud, usuario }) => {
  const entrada = validar(esquemaProductoNuevoApi, await leerJson(solicitud));
  const resultado = await crearProducto({ entrada, usuarioId: usuario.id });

  if (!resultado.guardado) {
    if (resultado.errores.codigo) {
      throw new ApiError(409, "CODIGO_DUPLICADO", resultado.errores.codigo[0]);
    }

    throw new ApiError(
      422,
      "VALIDACION",
      resultado.mensaje ?? "Hay campos con errores.",
      detallesDeCampos(resultado.errores),
    );
  }

  const producto = await obtenerProducto(resultado.productoId);

  if (!producto) {
    throw noEncontrado("El producto");
  }

  revalidatePath("/productos");
  revalidatePath("/stock");

  return responder(formatearProductoApi(producto), 201);
});
