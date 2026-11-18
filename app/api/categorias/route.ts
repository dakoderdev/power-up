import { revalidatePath } from "next/cache";
import { leerJson, responder, ruta } from "@/lib/api/ruta";
import { crearCategoria, listarCategorias } from "@/lib/categorias/servicio";

// RF-P7: todas las categorías activas, sin paginar.
export const GET = ruta({}, async () => {
  const lista = await listarCategorias();

  return responder(
    lista.map(({ id, nombre, activa }) => ({ id, nombre, activa })),
  );
});

// RF-P7: alta de categoría (admin); 409 NOMBRE_DUPLICADO.
export const POST = ruta({ admin: true }, async ({ solicitud, usuario }) => {
  const categoria = await crearCategoria({
    usuario,
    datos: await leerJson(solicitud),
  });

  revalidatePath("/productos/categorias");

  return responder(
    { id: categoria.id, nombre: categoria.nombre, activa: categoria.activa },
    201,
  );
});
