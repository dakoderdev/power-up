CREATE TYPE "public"."forma_pago" AS ENUM('contado', 'tarjeta', 'cuenta_corriente');--> statement-breakpoint
CREATE TYPE "public"."origen_stock" AS ENUM('manual', 'venta');--> statement-breakpoint
CREATE TYPE "public"."tipo_cuenta" AS ENUM('venta', 'pago');--> statement-breakpoint
CREATE TYPE "public"."tipo_stock" AS ENUM('entrada', 'salida');--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"documento" text NOT NULL,
	"telefono" text,
	"email" text,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_documento_unique" UNIQUE("documento"),
	CONSTRAINT "clientes_contacto_requerido" CHECK ("clientes"."telefono" IS NOT NULL OR "clientes"."email" IS NOT NULL),
	CONSTRAINT "clientes_nombre_no_vacio" CHECK (length(trim("clientes"."nombre")) > 0),
	CONSTRAINT "clientes_documento_numerico" CHECK ("clientes"."documento" ~ '^[0-9]+$')
);
--> statement-breakpoint
CREATE TABLE "items_venta" (
	"id" serial PRIMARY KEY NOT NULL,
	"venta_id" integer NOT NULL,
	"producto_id" integer NOT NULL,
	"codigo" text NOT NULL,
	"descripcion" text NOT NULL,
	"cantidad" integer NOT NULL,
	"precio_unitario" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	CONSTRAINT "items_venta_cantidad_positiva" CHECK ("items_venta"."cantidad" > 0),
	CONSTRAINT "items_venta_precio_positivo" CHECK ("items_venta"."precio_unitario" > 0),
	CONSTRAINT "items_venta_subtotal_coincide" CHECK ("items_venta"."subtotal" = "items_venta"."precio_unitario" * "items_venta"."cantidad")
);
--> statement-breakpoint
CREATE TABLE "movimientos_cuenta" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_id" integer NOT NULL,
	"tipo" "tipo_cuenta" NOT NULL,
	"importe" numeric(12, 2) NOT NULL,
	"venta_id" integer,
	"observacion" text,
	"fecha" timestamp DEFAULT now() NOT NULL,
	"usuario_id" text NOT NULL,
	CONSTRAINT "mov_cuenta_importe_positivo" CHECK ("movimientos_cuenta"."importe" > 0),
	CONSTRAINT "mov_cuenta_venta_vinculada" CHECK (("movimientos_cuenta"."tipo" = 'venta') = ("movimientos_cuenta"."venta_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "movimientos_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"producto_id" integer NOT NULL,
	"tipo" "tipo_stock" NOT NULL,
	"origen" "origen_stock" NOT NULL,
	"cantidad" integer NOT NULL,
	"motivo" text,
	"venta_id" integer,
	"usuario_id" text NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mov_stock_cantidad_positiva" CHECK ("movimientos_stock"."cantidad" > 0),
	CONSTRAINT "mov_stock_manual_con_motivo" CHECK ("movimientos_stock"."origen" <> 'manual' OR length(trim(coalesce("movimientos_stock"."motivo", ''))) > 0),
	CONSTRAINT "mov_stock_venta_vinculada" CHECK (("movimientos_stock"."origen" = 'venta') = ("movimientos_stock"."venta_id" IS NOT NULL)),
	CONSTRAINT "mov_stock_venta_es_salida" CHECK ("movimientos_stock"."origen" <> 'venta' OR "movimientos_stock"."tipo" = 'salida')
);
--> statement-breakpoint
CREATE TABLE "productos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"precio" numeric(12, 2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "productos_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "productos_precio_positivo" CHECK ("productos"."precio" > 0),
	CONSTRAINT "productos_stock_no_negativo" CHECK ("productos"."stock" >= 0),
	CONSTRAINT "productos_codigo_no_vacio" CHECK (length(trim("productos"."codigo")) > 0),
	CONSTRAINT "productos_nombre_no_vacio" CHECK (length(trim("productos"."nombre")) > 0)
);
--> statement-breakpoint
CREATE TABLE "ventas" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero" integer GENERATED ALWAYS AS IDENTITY (sequence name "ventas_numero_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"cliente_id" integer,
	"cliente_nombre" text NOT NULL,
	"cliente_documento" text,
	"forma_pago" "forma_pago" NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"usuario_id" text NOT NULL,
	CONSTRAINT "ventas_numero_unique" UNIQUE("numero"),
	CONSTRAINT "ventas_total_positivo" CHECK ("ventas"."total" > 0),
	CONSTRAINT "ventas_final_sin_documento" CHECK ("ventas"."cliente_id" IS NOT NULL OR "ventas"."cliente_documento" IS NULL),
	CONSTRAINT "ventas_cuenta_requiere_cliente" CHECK ("ventas"."forma_pago" <> 'cuenta_corriente' OR "ventas"."cliente_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"username" text,
	"display_username" text,
	"role" text DEFAULT 'operator' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "items_venta" ADD CONSTRAINT "items_venta_venta_id_ventas_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items_venta" ADD CONSTRAINT "items_venta_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_venta_id_ventas_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_cuenta" ADD CONSTRAINT "movimientos_cuenta_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_venta_id_ventas_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clientes_nombre_idx" ON "clientes" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX "items_venta_venta_idx" ON "items_venta" USING btree ("venta_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mov_cuenta_venta_unica" ON "movimientos_cuenta" USING btree ("venta_id") WHERE "movimientos_cuenta"."venta_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "mov_cuenta_cliente_idx" ON "movimientos_cuenta" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "mov_stock_producto_idx" ON "movimientos_stock" USING btree ("producto_id");--> statement-breakpoint
CREATE INDEX "productos_nombre_idx" ON "productos" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX "ventas_creado_en_idx" ON "ventas" USING btree ("creado_en");--> statement-breakpoint
CREATE INDEX "ventas_cliente_idx" ON "ventas" USING btree ("cliente_id");