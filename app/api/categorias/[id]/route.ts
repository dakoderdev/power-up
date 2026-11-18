import { revalidatePath } from "next/cache";
import { leerId, leerJson, responder, ruta } from "@/lib/api/ruta";
import { editarCategoria } from "@/lib/categorias/servicio";

type Params = { id: string };

// RF-P7: edición y baja lógica (admin); 409 CATEGORIA_EN_USO con productos activos.
export const PATCH = ruta<Params>(
  { admin: true },
  async ({ solicitud, usuario, params }) => {
    const categoria = await editarCategoria({
      usuario,
      id: leerId(params.id),
      datos: await leerJson(solicitud),
    });

    revalidatePath("/productos");
    revalidatePath("/productos/categorias");

    return responder({
      id: categoria.id,
      nombre: categoria.nombre,
      activa: categoria.activa,
    });
  },
);
