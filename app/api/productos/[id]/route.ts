import { revalidatePath } from "next/cache";
import { noEncontrado } from "@/lib/api/errores";
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
import {
  editarProducto,
  exigirProductoGuardado,
  obtenerProducto,
} from "@/lib/productos/guardar";

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
  async ({ solicitud, usuario, params }) => {
    const id = leerId(params.id);
    const actual = await obtenerProducto(id);

    if (!actual) {
      throw noEncontrado("El producto");
    }

    const cambios = validar(esquemaProductoPatchApi, await leerJson(solicitud));
    const entrada = exigir(fusionarProducto({ actual, cambios }));
    exigirProductoGuardado(await editarProducto({ id, entrada, usuario }));

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
