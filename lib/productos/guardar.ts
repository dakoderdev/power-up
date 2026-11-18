import { and, eq, ne } from "drizzle-orm";
import { ApiError, detallesDeCampos } from "@/lib/api/errores";
import { db } from "@/lib/db";
import { exigirAdministrador, type UsuarioServicio } from "@/lib/servicio";
import { esDuplicado } from "@/lib/db/errores";
import { categorias, productos } from "@/lib/db/schema";
import { MOTIVO_STOCK_INICIAL } from "@/lib/stock/etiquetas";
import { moverStock } from "@/lib/stock/mover";
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

// RF-P1: un producto con su categoría.
export async function obtenerProducto(id: number) {
  const [fila] = await db
    .select({ producto: productos, categoriaNombre: categorias.nombre })
    .from(productos)
    .leftJoin(categorias, eq(categorias.id, productos.categoriaId))
    .where(eq(productos.id, id));

  return fila
    ? { ...fila.producto, categoriaNombre: fila.categoriaNombre }
    : null;
}

// RF-P2 y regla 2: alta de producto; el stock inicial entra como ingreso por moverStock.
export async function crearProducto({
  entrada,
  usuario,
}: {
  entrada: ProductoNuevo;
  usuario: UsuarioServicio;
}): Promise<ResultadoGuardar> {
  exigirAdministrador(usuario);
  const usuarioId = usuario.id;

  if (await codigoEnUso({ codigo: entrada.codigo })) {
    return CODIGO_DUPLICADO;
  }

  return atraparDuplicado(() =>
    db.transaction(async (tx) => {
      const { stock, ...datos } = entrada;
      const [producto] = await tx
        .insert(productos)
        .values({ ...datos, stock: 0 })
        .returning({ id: productos.id });

      if (stock > 0) {
        await moverStock({
          tx,
          productoId: producto.id,
          tipo: "entrada",
          origen: "manual",
          cantidad: stock,
          motivo: MOTIVO_STOCK_INICIAL,
          usuarioId,
        });
      }

      return { guardado: true, productoId: producto.id };
    }),
  );
}

// RF-P2 y RF-P3: edición y baja lógica; la existencia no se edita.
export async function editarProducto({
  id,
  entrada,
  usuario,
}: {
  id: number;
  entrada: ProductoEdicion;
  usuario: UsuarioServicio;
}): Promise<ResultadoGuardar> {
  exigirAdministrador(usuario);

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

// Sección 10.4: un guardado fallido pasa a ApiError, igual para la API y las Server Actions.
export function exigirProductoGuardado(resultado: ResultadoGuardar) {
  if (resultado.guardado) {
    return resultado.productoId;
  }

  const detalles = detallesDeCampos(resultado.errores);

  if (resultado.errores.codigo) {
    throw new ApiError(
      409,
      "CODIGO_DUPLICADO",
      resultado.errores.codigo[0],
      detalles,
    );
  }

  if (detalles.length === 0) {
    throw new ApiError(
      404,
      "NO_ENCONTRADO",
      resultado.mensaje ?? "El producto no existe.",
    );
  }

  throw new ApiError(
    422,
    "VALIDACION",
    resultado.mensaje ?? "Hay campos con errores.",
    detalles,
  );
}
