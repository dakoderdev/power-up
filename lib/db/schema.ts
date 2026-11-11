import { sql } from "drizzle-orm";
import {
  sqliteTable,
  customType,
  integer,
  text,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/sqlite-core";
import { aCentavos, deCentavos } from "../moneda";
import { AHORA, booleano, enLista, fecha, user } from "./auth-schema";

export * from "./auth-schema";

export const FORMAS_PAGO = ["contado", "tarjeta", "cuenta_corriente"] as const;
export const TIPOS_STOCK = ["entrada", "salida"] as const;
export const ORIGENES_STOCK = ["manual", "venta"] as const;
export const TIPOS_CUENTA = ["venta", "pago"] as const;

const dinero = customType<{ data: string; driverData: number }>({
  dataType: () => "integer",
  toDriver: (importe) => aCentavos(importe),
  fromDriver: (centavos) => deCentavos(centavos),
});

function id() {
  return integer("id").primaryKey({ autoIncrement: true });
}

export const productos = sqliteTable(
  "productos",
  {
    id: id(),
    codigo: text("codigo", { length: 30 }).notNull().unique(),
    nombre: text("nombre", { length: 120 }).notNull(),
    precio: dinero("precio").notNull(),
    stock: integer("stock").notNull().default(0),
    activo: booleano("activo").notNull().default(true),
    imagenUrl: text("imagen_url"),
    creadoEn: fecha("creado_en").notNull().default(AHORA),
  },
  (t) => [
    check("productos_precio_positivo", sql`${t.precio} > 0`),
    check("productos_stock_no_negativo", sql`${t.stock} >= 0`),
    check("productos_codigo_no_vacio", sql`length(trim(${t.codigo})) > 0`),
    check("productos_nombre_no_vacio", sql`length(trim(${t.nombre})) > 0`),
    index("productos_nombre_idx").on(t.nombre),
  ],
);

export const clientes = sqliteTable(
  "clientes",
  {
    id: id(),
    nombre: text("nombre").notNull(),
    documento: text("documento").notNull().unique(),
    telefono: text("telefono"),
    email: text("email"),
    creadoEn: fecha("creado_en").notNull().default(AHORA),
  },
  (t) => [
    check(
      "clientes_contacto_requerido",
      sql`${t.telefono} IS NOT NULL OR ${t.email} IS NOT NULL`,
    ),
    check("clientes_nombre_no_vacio", sql`length(trim(${t.nombre})) > 0`),
    check(
      "clientes_documento_numerico",
      sql`length(${t.documento}) > 0 AND ${t.documento} NOT GLOB '*[^0-9]*'`,
    ),
    index("clientes_nombre_idx").on(t.nombre),
  ],
);

export const ventas = sqliteTable(
  "ventas",
  {
    id: id(),
    numero: integer("numero")
      .notNull()
      .unique()
      .$defaultFn(() => sql`(select coalesce(max(numero), 0) + 1 from ventas)`),
    creadoEn: fecha("creado_en").notNull().default(AHORA),
    clienteId: integer("cliente_id").references(() => clientes.id),
    clienteNombre: text("cliente_nombre").notNull(),
    clienteDocumento: text("cliente_documento"),
    formaPago: text("forma_pago", { enum: FORMAS_PAGO }).notNull(),
    total: dinero("total").notNull(),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id),
  },
  (t) => [
    check(
      "ventas_forma_pago_valida",
      sql`${t.formaPago} in ${enLista(FORMAS_PAGO)}`,
    ),
    check("ventas_total_positivo", sql`${t.total} > 0`),
    check(
      "ventas_final_sin_documento",
      sql`${t.clienteId} IS NOT NULL OR ${t.clienteDocumento} IS NULL`,
    ),
    check(
      "ventas_cuenta_requiere_cliente",
      sql`${t.formaPago} <> 'cuenta_corriente' OR ${t.clienteId} IS NOT NULL`,
    ),
    index("ventas_creado_en_idx").on(t.creadoEn),
    index("ventas_cliente_idx").on(t.clienteId),
  ],
);

export const itemsVenta = sqliteTable(
  "items_venta",
  {
    id: id(),
    ventaId: integer("venta_id")
      .notNull()
      .references(() => ventas.id),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    codigo: text("codigo").notNull(),
    descripcion: text("descripcion").notNull(),
    cantidad: integer("cantidad").notNull(),
    precioUnitario: dinero("precio_unitario").notNull(),
    subtotal: dinero("subtotal").notNull(),
  },
  (t) => [
    check("items_venta_cantidad_positiva", sql`${t.cantidad} > 0`),
    check("items_venta_precio_positivo", sql`${t.precioUnitario} > 0`),
    check(
      "items_venta_subtotal_coincide",
      sql`${t.subtotal} = ${t.precioUnitario} * ${t.cantidad}`,
    ),
    index("items_venta_venta_idx").on(t.ventaId),
  ],
);

export const movimientosStock = sqliteTable(
  "movimientos_stock",
  {
    id: id(),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    tipo: text("tipo", { enum: TIPOS_STOCK }).notNull(),
    origen: text("origen", { enum: ORIGENES_STOCK }).notNull(),
    cantidad: integer("cantidad").notNull(),
    motivo: text("motivo"),
    ventaId: integer("venta_id").references(() => ventas.id),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id),
    creadoEn: fecha("creado_en").notNull().default(AHORA),
  },
  (t) => [
    check("mov_stock_tipo_valido", sql`${t.tipo} in ${enLista(TIPOS_STOCK)}`),
    check(
      "mov_stock_origen_valido",
      sql`${t.origen} in ${enLista(ORIGENES_STOCK)}`,
    ),
    check("mov_stock_cantidad_positiva", sql`${t.cantidad} > 0`),
    check(
      "mov_stock_manual_con_motivo",
      sql`${t.origen} <> 'manual' OR length(trim(coalesce(${t.motivo}, ''))) > 0`,
    ),
    check(
      "mov_stock_venta_vinculada",
      sql`(${t.origen} = 'venta') = (${t.ventaId} IS NOT NULL)`,
    ),
    check(
      "mov_stock_venta_es_salida",
      sql`${t.origen} <> 'venta' OR ${t.tipo} = 'salida'`,
    ),
    index("mov_stock_producto_idx").on(t.productoId),
  ],
);

export const movimientosCuenta = sqliteTable(
  "movimientos_cuenta",
  {
    id: id(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    tipo: text("tipo", { enum: TIPOS_CUENTA }).notNull(),
    importe: dinero("importe").notNull(),
    ventaId: integer("venta_id").references(() => ventas.id),
    observacion: text("observacion"),
    fecha: fecha("fecha").notNull().default(AHORA),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id),
  },
  (t) => [
    check("mov_cuenta_tipo_valido", sql`${t.tipo} in ${enLista(TIPOS_CUENTA)}`),
    check("mov_cuenta_importe_positivo", sql`${t.importe} > 0`),
    check(
      "mov_cuenta_venta_vinculada",
      sql`(${t.tipo} = 'venta') = (${t.ventaId} IS NOT NULL)`,
    ),
    uniqueIndex("mov_cuenta_venta_unica")
      .on(t.ventaId)
      .where(sql`${t.ventaId} IS NOT NULL`),
    index("mov_cuenta_cliente_idx").on(t.clienteId),
  ],
);
