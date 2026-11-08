import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  varchar,
  boolean,
  uniqueIndex,
  numeric,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const formaPagoEnum = pgEnum("forma_pago", [
  "contado",
  "tarjeta",
  "cuenta_corriente",
]);
export const tipoStockEnum = pgEnum("tipo_stock", ["entrada", "salida"]);
export const origenStockEnum = pgEnum("origen_stock", ["manual", "venta"]);
export const tipoCuentaEnum = pgEnum("tipo_cuenta", ["venta", "pago"]);

const dinero = (nombre: string) => numeric(nombre, { precision: 12, scale: 2 });

export const productos = pgTable(
  "productos",
  {
    id: serial("id").primaryKey(),
    codigo: varchar("codigo", { length: 30 }).notNull().unique(),
    nombre: varchar("nombre", { length: 120 }).notNull(),
    precio: dinero("precio").notNull(),
    stock: integer("stock").notNull().default(0),
    activo: boolean("activo").notNull().default(true),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
  },
  (t) => [
    check("productos_precio_positivo", sql`${t.precio} > 0`),
    check("productos_stock_no_negativo", sql`${t.stock} >= 0`),
    check("productos_codigo_no_vacio", sql`length(trim(${t.codigo})) > 0`),
    check("productos_nombre_no_vacio", sql`length(trim(${t.nombre})) > 0`),
    index("productos_nombre_idx").on(t.nombre),
  ],
);

export const clientes = pgTable(
  "clientes",
  {
    id: serial("id").primaryKey(),
    nombre: text("nombre").notNull(),
    documento: text("documento").notNull().unique(),
    telefono: text("telefono"),
    email: text("email"),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
  },
  (t) => [
    check(
      "clientes_contacto_requerido",
      sql`${t.telefono} IS NOT NULL OR ${t.email} IS NOT NULL`,
    ),
    check("clientes_nombre_no_vacio", sql`length(trim(${t.nombre})) > 0`),
    check("clientes_documento_numerico", sql`${t.documento} ~ '^[0-9]+$'`),
    index("clientes_nombre_idx").on(t.nombre),
  ],
);

export const ventas = pgTable(
  "ventas",
  {
    id: serial("id").primaryKey(),
    numero: integer("numero").notNull().unique().generatedAlwaysAsIdentity(),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
    clienteId: integer("cliente_id").references(() => clientes.id),
    clienteNombre: text("cliente_nombre").notNull(),
    clienteDocumento: text("cliente_documento"),
    formaPago: formaPagoEnum("forma_pago").notNull(),
    total: dinero("total").notNull(),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id),
  },
  (t) => [
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

export const itemsVenta = pgTable(
  "items_venta",
  {
    id: serial("id").primaryKey(),
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

export const movimientosStock = pgTable(
  "movimientos_stock",
  {
    id: serial("id").primaryKey(),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    tipo: tipoStockEnum("tipo").notNull(),
    origen: origenStockEnum("origen").notNull(),
    cantidad: integer("cantidad").notNull(),
    motivo: text("motivo"),
    ventaId: integer("venta_id").references(() => ventas.id),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
  },
  (t) => [
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

export const movimientosCuenta = pgTable(
  "movimientos_cuenta",
  {
    id: serial("id").primaryKey(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    tipo: tipoCuentaEnum("tipo").notNull(),
    importe: dinero("importe").notNull(),
    ventaId: integer("venta_id").references(() => ventas.id),
    observacion: text("observacion"),
    fecha: timestamp("fecha").notNull().defaultNow(),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id),
  },
  (t) => [
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
