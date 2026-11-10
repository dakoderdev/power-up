import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { esDuplicado } from "@/lib/db/errores";
import { movimientosStock, productos } from "@/lib/db/schema";
import { MOTIVO_STOCK_INICIAL } from "@/lib/stock/etiquetas";
import type { ProductoEdicion, ProductoNuevo } from "./esquemas";

const MENSAJE_DUPLICADO =
  "Ya hay un producto con ese código. Usá otro o editá el existente.";

export type ErroresProducto = Partial<Record<keyof ProductoNuevo, string[]>>;

export type ResultadoGuardar =
  | { guardado: true; productoId: number }
  | { guardado: false; errores: ErroresProducto; mensaje?: string };

const CODIGO_DUPLICADO: ResultadoGuardar = {
  guardado: false,
  errores: { codigo: [MENSAJE_DUPLICADO] },
};

async function codigoEnUso({
  codigo,
  exceptoId,
}: {
  codigo: string;
  exceptoId?: number;
}) {
  const [existente] = await db
    .select({ id: productos.id })
    .from(productos)
    .where(
      and(
        eq(productos.codigo, codigo),
        exceptoId === undefined ? undefined : ne(productos.id, exceptoId),
      ),
    );

  return Boolean(existente);
}

async function atraparDuplicado(
  guardar: () => Promise<ResultadoGuardar>,
): Promise<ResultadoGuardar> {
  try {
    return await guardar();
  } catch (error) {
    if (esDuplicado(error)) {
      return CODIGO_DUPLICADO;
    }

    throw error;
  }
}

export async function obtenerProducto(id: number) {
  const [producto] = await db
    .select()
    .from(productos)
    .where(eq(productos.id, id));

  return producto ?? null;
}

export async function crearProducto({
  entrada,
  usuarioId,
}: {
  entrada: ProductoNuevo;
  usuarioId: string;
}): Promise<ResultadoGuardar> {
  if (await codigoEnUso({ codigo: entrada.codigo })) {
    return CODIGO_DUPLICADO;
  }

  return atraparDuplicado(() =>
    db.transaction(async (tx) => {
      const [producto] = await tx
        .insert(productos)
        .values(entrada)
        .returning({ id: productos.id, stock: productos.stock });

      if (producto.stock > 0) {
        await tx.insert(movimientosStock).values({
          productoId: producto.id,
          tipo: "entrada",
          origen: "manual",
          cantidad: producto.stock,
          motivo: MOTIVO_STOCK_INICIAL,
          usuarioId,
        });
      }

      return { guardado: true, productoId: producto.id };
    }),
  );
}

export async function editarProducto({
  id,
  entrada,
}: {
  id: number;
  entrada: ProductoEdicion;
}): Promise<ResultadoGuardar> {
  if (await codigoEnUso({ codigo: entrada.codigo, exceptoId: id })) {
    return CODIGO_DUPLICADO;
  }

  return atraparDuplicado(async () => {
    const [producto] = await db
      .update(productos)
      .set(entrada)
      .where(eq(productos.id, id))
      .returning({ id: productos.id });

    return producto
      ? { guardado: true, productoId: producto.id }
      : {
          guardado: false,
          errores: {},
          mensaje: "El producto ya no existe. Volvé al listado y elegí otro.",
        };
  });
}
