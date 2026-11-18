import { and, asc, count, eq, ne } from "drizzle-orm";
import { ApiError, noEncontrado } from "@/lib/api/errores";
import { db } from "@/lib/db";
import { esDuplicado } from "@/lib/db/errores";
import { categorias, productos } from "@/lib/db/schema";
import {
  exigirAdministrador,
  validarEntrada,
  type UsuarioServicio,
} from "@/lib/servicio";
import { contar } from "@/lib/texto";
import { esquemaCategoriaEdicion, esquemaCategoriaNueva } from "./esquemas";

function nombreDuplicado() {
  return new ApiError(
    409,
    "NOMBRE_DUPLICADO",
    "Ya hay una categoría con ese nombre.",
  );
}

async function nombreEnUso({
  nombre,
  exceptoId,
}: {
  nombre: string;
  exceptoId?: number;
}) {
  const [existente] = await db
    .select({ id: categorias.id })
    .from(categorias)
    .where(
      and(
        eq(categorias.nombre, nombre),
        exceptoId === undefined ? undefined : ne(categorias.id, exceptoId),
      ),
    );

  return Boolean(existente);
}

async function atraparDuplicado<T>(guardar: () => Promise<T>) {
  try {
    return await guardar();
  } catch (error) {
    if (esDuplicado(error)) {
      throw nombreDuplicado();
    }

    throw error;
  }
}

// RF-P7: categorías con la cantidad de productos activos; por defecto solo las activas.
export async function listarCategorias({
  incluirInactivas = false,
}: { incluirInactivas?: boolean } = {}) {
  return db
    .select({
      id: categorias.id,
      nombre: categorias.nombre,
      activa: categorias.activa,
      productos: count(productos.id),
    })
    .from(categorias)
    .leftJoin(
      productos,
      and(eq(productos.categoriaId, categorias.id), eq(productos.activo, true)),
    )
    .where(incluirInactivas ? undefined : eq(categorias.activa, true))
    .groupBy(categorias.id)
    .orderBy(asc(categorias.nombre));
}

export type CategoriaFila = Awaited<
  ReturnType<typeof listarCategorias>
>[number];

// RF-P7 y sección 3: alta de categoría con nombre único; solo el administrador.
export async function crearCategoria({
  usuario,
  datos,
}: {
  usuario: UsuarioServicio;
  datos: unknown;
}) {
  const entrada = validarEntrada(esquemaCategoriaNueva, datos);
  exigirAdministrador(usuario);

  if (await nombreEnUso({ nombre: entrada.nombre })) {
    throw nombreDuplicado();
  }

  const [categoria] = await atraparDuplicado(() =>
    db.insert(categorias).values(entrada).returning(),
  );

  return categoria;
}

// RF-P7: edición y baja lógica; no se desactiva una categoría con productos activos.
export async function editarCategoria({
  usuario,
  id,
  datos,
}: {
  usuario: UsuarioServicio;
  id: number;
  datos: unknown;
}) {
  const cambios = validarEntrada(esquemaCategoriaEdicion, datos);
  exigirAdministrador(usuario);

  if (
    cambios.nombre !== undefined &&
    (await nombreEnUso({ nombre: cambios.nombre, exceptoId: id }))
  ) {
    throw nombreDuplicado();
  }

  if (cambios.activa === false) {
    const [{ enUso }] = await db
      .select({ enUso: count() })
      .from(productos)
      .where(and(eq(productos.categoriaId, id), eq(productos.activo, true)));

    if (enUso > 0) {
      const cuantos = contar({
        cantidad: enUso,
        singular: "producto activo",
        plural: "productos activos",
      });

      throw new ApiError(
        409,
        "CATEGORIA_EN_USO",
        `La categoría tiene ${cuantos}. Pasalos a otra categoría antes de darla de baja.`,
      );
    }
  }

  const [categoria] = await atraparDuplicado(() =>
    db.update(categorias).set(cambios).where(eq(categorias.id, id)).returning(),
  );

  if (!categoria) {
    throw noEncontrado("La categoría");
  }

  return categoria;
}
