CREATE TYPE "public"."forma_pago" AS ENUM('cash', 'card', 'credit');--> statement-breakpoint
CREATE TYPE "public"."origen_stock" AS ENUM('manual', 'sale');--> statement-breakpoint
CREATE TYPE "public"."tipo_cuenta" AS ENUM('sale', 'payment');--> statement-breakpoint
CREATE TYPE "public"."tipo_stock" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TABLE "account_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"type" "tipo_cuenta" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"sale_id" integer,
	"note" text,
	"date" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "account_mov_amount_positive" CHECK ("account_movements"."amount" > 0),
	CONSTRAINT "account_mov_sale_link" CHECK (("account_movements"."type" = 'sale') = ("account_movements"."sale_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"document" text NOT NULL,
	"phone" text,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_document_unique" UNIQUE("document"),
	CONSTRAINT "customers_contact_required" CHECK ("customers"."phone" IS NOT NULL OR "customers"."email" IS NOT NULL),
	CONSTRAINT "customers_name_not_empty" CHECK (length(trim("customers"."name")) > 0),
	CONSTRAINT "customers_document_numeric" CHECK ("customers"."document" ~ '^[0-9]+$')
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(120) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_code_unique" UNIQUE("code"),
	CONSTRAINT "products_price_positive" CHECK ("products"."price" > 0),
	CONSTRAINT "products_stock_nonneg" CHECK ("products"."stock" >= 0),
	CONSTRAINT "products_code_not_empty" CHECK (length(trim("products"."code")) > 0),
	CONSTRAINT "products_name_not_empty" CHECK (length(trim("products"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	CONSTRAINT "sale_items_qty_positive" CHECK ("sale_items"."quantity" > 0),
	CONSTRAINT "sale_items_price_positive" CHECK ("sale_items"."unit_price" > 0),
	CONSTRAINT "sale_items_subtotal_matches" CHECK ("sale_items"."subtotal" = "sale_items"."unit_price" * "sale_items"."quantity")
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "sales_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"customer_id" integer,
	"customer_name" text NOT NULL,
	"customer_document" text,
	"payment_method" "forma_pago" NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "sales_number_unique" UNIQUE("number"),
	CONSTRAINT "sales_total_positive" CHECK ("sales"."total" > 0),
	CONSTRAINT "sales_consumer_without_document" CHECK ("sales"."customer_id" IS NOT NULL OR "sales"."customer_document" IS NULL),
	CONSTRAINT "sales_credit_needs_customer" CHECK ("sales"."payment_method" <> 'credit' OR "sales"."customer_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"type" "tipo_stock" NOT NULL,
	"origin" "origen_stock" NOT NULL,
	"quantity" integer NOT NULL,
	"reason" text,
	"sale_id" integer,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_mov_qty_positive" CHECK ("stock_movements"."quantity" > 0),
	CONSTRAINT "stock_mov_manual_needs_reason" CHECK ("stock_movements"."origin" <> 'manual' OR length(trim(coalesce("stock_movements"."reason", ''))) > 0),
	CONSTRAINT "stock_mov_sale_link" CHECK (("stock_movements"."origin" = 'sale') = ("stock_movements"."sale_id" IS NOT NULL)),
	CONSTRAINT "stock_mov_sale_is_out" CHECK ("stock_movements"."origin" <> 'sale' OR "stock_movements"."type" = 'out')
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
ALTER TABLE "account_movements" ADD CONSTRAINT "account_movements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_movements" ADD CONSTRAINT "account_movements_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_movements" ADD CONSTRAINT "account_movements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_mov_sale_unique" ON "account_movements" USING btree ("sale_id") WHERE "account_movements"."sale_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "account_mov_customer_idx" ON "account_movements" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "sale_items_sale_idx" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sales_created_at_idx" ON "sales" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sales_customer_idx" ON "sales" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "stock_mov_product_idx" ON "stock_movements" USING btree ("product_id");