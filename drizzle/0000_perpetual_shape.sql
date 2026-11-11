CREATE TABLE `clientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`documento` text NOT NULL,
	`telefono` text,
	`email` text,
	`creado_en` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "clientes_contacto_requerido" CHECK("clientes"."telefono" IS NOT NULL OR "clientes"."email" IS NOT NULL),
	CONSTRAINT "clientes_nombre_no_vacio" CHECK(length(trim("clientes"."nombre")) > 0),
	CONSTRAINT "clientes_documento_numerico" CHECK(length("clientes"."documento") > 0 AND "clientes"."documento" NOT GLOB '*[^0-9]*')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clientes_documento_unique` ON `clientes` (`documento`);--> statement-breakpoint
CREATE INDEX `clientes_nombre_idx` ON `clientes` (`nombre`);--> statement-breakpoint
CREATE TABLE `items_venta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`venta_id` integer NOT NULL,
	`producto_id` integer NOT NULL,
	`codigo` text NOT NULL,
	`descripcion` text NOT NULL,
	`cantidad` integer NOT NULL,
	`precio_unitario` integer NOT NULL,
	`subtotal` integer NOT NULL,
	FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "items_venta_cantidad_positiva" CHECK("items_venta"."cantidad" > 0),
	CONSTRAINT "items_venta_precio_positivo" CHECK("items_venta"."precio_unitario" > 0),
	CONSTRAINT "items_venta_subtotal_coincide" CHECK("items_venta"."subtotal" = "items_venta"."precio_unitario" * "items_venta"."cantidad")
);
--> statement-breakpoint
CREATE INDEX `items_venta_venta_idx` ON `items_venta` (`venta_id`);--> statement-breakpoint
CREATE TABLE `movimientos_cuenta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`importe` integer NOT NULL,
	`venta_id` integer,
	`observacion` text,
	`fecha` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`usuario_id` text NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mov_cuenta_tipo_valido" CHECK("movimientos_cuenta"."tipo" in ('venta', 'pago')),
	CONSTRAINT "mov_cuenta_importe_positivo" CHECK("movimientos_cuenta"."importe" > 0),
	CONSTRAINT "mov_cuenta_venta_vinculada" CHECK(("movimientos_cuenta"."tipo" = 'venta') = ("movimientos_cuenta"."venta_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mov_cuenta_venta_unica` ON `movimientos_cuenta` (`venta_id`) WHERE "movimientos_cuenta"."venta_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `mov_cuenta_cliente_idx` ON `movimientos_cuenta` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `movimientos_stock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producto_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`origen` text NOT NULL,
	`cantidad` integer NOT NULL,
	`motivo` text,
	`venta_id` integer,
	`usuario_id` text NOT NULL,
	`creado_en` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mov_stock_tipo_valido" CHECK("movimientos_stock"."tipo" in ('entrada', 'salida')),
	CONSTRAINT "mov_stock_origen_valido" CHECK("movimientos_stock"."origen" in ('manual', 'venta')),
	CONSTRAINT "mov_stock_cantidad_positiva" CHECK("movimientos_stock"."cantidad" > 0),
	CONSTRAINT "mov_stock_manual_con_motivo" CHECK("movimientos_stock"."origen" <> 'manual' OR length(trim(coalesce("movimientos_stock"."motivo", ''))) > 0),
	CONSTRAINT "mov_stock_venta_vinculada" CHECK(("movimientos_stock"."origen" = 'venta') = ("movimientos_stock"."venta_id" IS NOT NULL)),
	CONSTRAINT "mov_stock_venta_es_salida" CHECK("movimientos_stock"."origen" <> 'venta' OR "movimientos_stock"."tipo" = 'salida')
);
--> statement-breakpoint
CREATE INDEX `mov_stock_producto_idx` ON `movimientos_stock` (`producto_id`);--> statement-breakpoint
CREATE TABLE `productos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`codigo` text(30) NOT NULL,
	`nombre` text(120) NOT NULL,
	`precio` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`imagen_url` text,
	`creado_en` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "productos_precio_positivo" CHECK("productos"."precio" > 0),
	CONSTRAINT "productos_stock_no_negativo" CHECK("productos"."stock" >= 0),
	CONSTRAINT "productos_codigo_no_vacio" CHECK(length(trim("productos"."codigo")) > 0),
	CONSTRAINT "productos_nombre_no_vacio" CHECK(length(trim("productos"."nombre")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `productos_codigo_unique` ON `productos` (`codigo`);--> statement-breakpoint
CREATE INDEX `productos_nombre_idx` ON `productos` (`nombre`);--> statement-breakpoint
CREATE TABLE `ventas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`numero` integer NOT NULL,
	`creado_en` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`cliente_id` integer,
	`cliente_nombre` text NOT NULL,
	`cliente_documento` text,
	`forma_pago` text NOT NULL,
	`total` integer NOT NULL,
	`usuario_id` text NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ventas_forma_pago_valida" CHECK("ventas"."forma_pago" in ('contado', 'tarjeta', 'cuenta_corriente')),
	CONSTRAINT "ventas_total_positivo" CHECK("ventas"."total" > 0),
	CONSTRAINT "ventas_final_sin_documento" CHECK("ventas"."cliente_id" IS NOT NULL OR "ventas"."cliente_documento" IS NULL),
	CONSTRAINT "ventas_cuenta_requiere_cliente" CHECK("ventas"."forma_pago" <> 'cuenta_corriente' OR "ventas"."cliente_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ventas_numero_unique` ON `ventas` (`numero`);--> statement-breakpoint
CREATE INDEX `ventas_creado_en_idx` ON `ventas` (`creado_en`);--> statement-breakpoint
CREATE INDEX `ventas_cliente_idx` ON `ventas` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`username` text,
	`display_username` text,
	`role` text DEFAULT 'operator' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	CONSTRAINT "user_rol_valido" CHECK("user"."role" in ('admin', 'operator'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);