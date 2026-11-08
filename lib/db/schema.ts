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

export const formaPagoEnum = pgEnum("forma_pago", ["cash", "card", "credit"]);
export const tipoStockEnum = pgEnum("tipo_stock", ["in", "out"]);
export const origenStockEnum = pgEnum("origen_stock", ["manual", "sale"]);
export const tipoCuentaEnum = pgEnum("tipo_cuenta", ["sale", "payment"]);

const dinero = (nombre: string) => numeric(nombre, { precision: 12, scale: 2 });

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 30 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    price: dinero("price").notNull(),
    stock: integer("stock").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    check("products_price_positive", sql`${t.price} > 0`),
    check("products_stock_nonneg", sql`${t.stock} >= 0`),
    check("products_code_not_empty", sql`length(trim(${t.code})) > 0`),
    check("products_name_not_empty", sql`length(trim(${t.name})) > 0`),
    index("products_name_idx").on(t.name),
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    document: text("document").notNull().unique(),
    phone: text("phone"),
    email: text("email"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    check(
      "customers_contact_required",
      sql`${t.phone} IS NOT NULL OR ${t.email} IS NOT NULL`,
    ),
    check("customers_name_not_empty", sql`length(trim(${t.name})) > 0`),
    check("customers_document_numeric", sql`${t.document} ~ '^[0-9]+$'`),
    index("customers_name_idx").on(t.name),
  ],
);

export const sales = pgTable(
  "sales",
  {
    id: serial("id").primaryKey(),
    number: integer("number").notNull().unique().generatedAlwaysAsIdentity(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    customerId: integer("customer_id").references(() => customers.id),
    customerName: text("customer_name").notNull(),
    customerDocument: text("customer_document"),
    paymentMethod: formaPagoEnum("payment_method").notNull(),
    total: dinero("total").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
  },
  (t) => [
    check("sales_total_positive", sql`${t.total} > 0`),
    check(
      "sales_consumer_without_document",
      sql`${t.customerId} IS NOT NULL OR ${t.customerDocument} IS NULL`,
    ),
    check(
      "sales_credit_needs_customer",
      sql`${t.paymentMethod} <> 'credit' OR ${t.customerId} IS NOT NULL`,
    ),
    index("sales_created_at_idx").on(t.createdAt),
    index("sales_customer_idx").on(t.customerId),
  ],
);

export const saleItems = pgTable(
  "sale_items",
  {
    id: serial("id").primaryKey(),
    saleId: integer("sale_id")
      .notNull()
      .references(() => sales.id),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    code: text("code").notNull(),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: dinero("unit_price").notNull(),
    subtotal: dinero("subtotal").notNull(),
  },
  (t) => [
    check("sale_items_qty_positive", sql`${t.quantity} > 0`),
    check("sale_items_price_positive", sql`${t.unitPrice} > 0`),
    check(
      "sale_items_subtotal_matches",
      sql`${t.subtotal} = ${t.unitPrice} * ${t.quantity}`,
    ),
    index("sale_items_sale_idx").on(t.saleId),
  ],
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    type: tipoStockEnum("type").notNull(),
    origin: origenStockEnum("origin").notNull(),
    quantity: integer("quantity").notNull(),
    reason: text("reason"),
    saleId: integer("sale_id").references(() => sales.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    check("stock_mov_qty_positive", sql`${t.quantity} > 0`),
    check(
      "stock_mov_manual_needs_reason",
      sql`${t.origin} <> 'manual' OR length(trim(coalesce(${t.reason}, ''))) > 0`,
    ),
    check(
      "stock_mov_sale_link",
      sql`(${t.origin} = 'sale') = (${t.saleId} IS NOT NULL)`,
    ),
    check(
      "stock_mov_sale_is_out",
      sql`${t.origin} <> 'sale' OR ${t.type} = 'out'`,
    ),
    index("stock_mov_product_idx").on(t.productId),
  ],
);

export const accountMovements = pgTable(
  "account_movements",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    type: tipoCuentaEnum("type").notNull(),
    amount: dinero("amount").notNull(),
    saleId: integer("sale_id").references(() => sales.id),
    note: text("note"),
    date: timestamp("date").notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
  },
  (t) => [
    check("account_mov_amount_positive", sql`${t.amount} > 0`),
    check(
      "account_mov_sale_link",
      sql`(${t.type} = 'sale') = (${t.saleId} IS NOT NULL)`,
    ),
    uniqueIndex("account_mov_sale_unique")
      .on(t.saleId)
      .where(sql`${t.saleId} IS NOT NULL`),
    index("account_mov_customer_idx").on(t.customerId),
  ],
);
