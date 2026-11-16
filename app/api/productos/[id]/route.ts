import { revalidatePath } from "next/cache";
import { ApiError, detallesDeCampos, noEncontrado } from "@/lib/api/errores";
import { esquemaProductoPatchApi, fusionarProducto } from "@/lib/api/esquemas";
import { formatearProductoApi } from "@/lib/api/formato";
import {
  exigir,
  leerId,
  leerJson,
  responder,
  ruta,
  validar,
} from "@/lib/api/ruta";
import { editarProducto, obtenerProducto } from "@/lib/productos/guardar";

type Params = { id: string };

// RF-P1: un producto por id.
export const GET = ruta<Params>({}, async ({ params }) => {
  const producto = await obtenerProducto(leerId(params.id));

  if (!producto) {
    throw noEncontrado("El producto");
  }

  return responder(formatearProductoApi(producto));
});

// RF-P2 y RF-P3: edición parcial y baja lógica; existencia no se acepta (admin).
export const PATCH = ruta<Params>(
  { admin: true },
  async ({ solicitud, params }) => {
    const id = leerId(params.id);
    const actual = await obtenerProducto(id);

    if (!actual) {
      throw noEncontrado("El producto");
    }

    const cambios = validar(esquemaProductoPatchApi, await leerJson(solicitud));
    const entrada = exigir(fusionarProducto({ actual, cambios }));
    const resultado = await editarProducto({ id, entrada });

    if (!resultado.guardado) {
      if (resultado.errores.codigo) {
        throw new ApiError(
          409,
          "CODIGO_DUPLICADO",
          resultado.errores.codigo[0],
        );
      }

      throw new ApiError(
        422,
        "VALIDACION",
        resultado.mensaje ?? "Hay campos con errores.",
        detallesDeCampos(resultado.errores),
      );
    }

    const editado = await obtenerProducto(id);

    if (!editado) {
      throw noEncontrado("El producto");
    }

    revalidatePath("/productos");
    revalidatePath(`/productos/${id}`);
    revalidatePath("/stock");

    return responder(formatearProductoApi(editado));
  },
);
