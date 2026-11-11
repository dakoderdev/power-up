PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_movimientos_cuenta` (
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
	CONSTRAINT "mov_cuenta_tipo_valido" CHECK("__new_movimientos_cuenta"."tipo" in ('venta', 'pago', 'anulacion')),
	CONSTRAINT "mov_cuenta_importe_positivo" CHECK("__new_movimientos_cuenta"."importe" > 0),
	CONSTRAINT "mov_cuenta_venta_vinculada" CHECK(("__new_movimientos_cuenta"."tipo" in ('venta', 'anulacion')) = ("__new_movimientos_cuenta"."venta_id" IS NOT NULL))
);
--> statement-breakpoint
INSERT INTO `__new_movimientos_cuenta`("id", "cliente_id", "tipo", "importe", "venta_id", "observacion", "fecha", "usuario_id") SELECT "id", "cliente_id", "tipo", "importe", "venta_id", "observacion", "fecha", "usuario_id" FROM `movimientos_cuenta`;--> statement-breakpoint
DROP TABLE `movimientos_cuenta`;--> statement-breakpoint
ALTER TABLE `__new_movimientos_cuenta` RENAME TO `movimientos_cuenta`;--> statement-breakpoint
CREATE UNIQUE INDEX `mov_cuenta_venta_unica` ON `movimientos_cuenta` (`venta_id`,`tipo`) WHERE "movimientos_cuenta"."venta_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `mov_cuenta_cliente_idx` ON `movimientos_cuenta` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `__new_movimientos_stock` (
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
	CONSTRAINT "mov_stock_tipo_valido" CHECK("__new_movimientos_stock"."tipo" in ('entrada', 'salida')),
	CONSTRAINT "mov_stock_origen_valido" CHECK("__new_movimientos_stock"."origen" in ('manual', 'venta', 'anulacion')),
	CONSTRAINT "mov_stock_cantidad_positiva" CHECK("__new_movimientos_stock"."cantidad" > 0),
	CONSTRAINT "mov_stock_manual_con_motivo" CHECK("__new_movimientos_stock"."origen" <> 'manual' OR length(trim(coalesce("__new_movimientos_stock"."motivo", ''))) > 0),
	CONSTRAINT "mov_stock_venta_vinculada" CHECK(("__new_movimientos_stock"."origen" in ('venta', 'anulacion')) = ("__new_movimientos_stock"."venta_id" IS NOT NULL)),
	CONSTRAINT "mov_stock_venta_es_salida" CHECK("__new_movimientos_stock"."origen" <> 'venta' OR "__new_movimientos_stock"."tipo" = 'salida'),
	CONSTRAINT "mov_stock_anulacion_es_entrada" CHECK("__new_movimientos_stock"."origen" <> 'anulacion' OR "__new_movimientos_stock"."tipo" = 'entrada')
);
--> statement-breakpoint
INSERT INTO `__new_movimientos_stock`("id", "producto_id", "tipo", "origen", "cantidad", "motivo", "venta_id", "usuario_id", "creado_en") SELECT "id", "producto_id", "tipo", "origen", "cantidad", "motivo", "venta_id", "usuario_id", "creado_en" FROM `movimientos_stock`;--> statement-breakpoint
DROP TABLE `movimientos_stock`;--> statement-breakpoint
ALTER TABLE `__new_movimientos_stock` RENAME TO `movimientos_stock`;--> statement-breakpoint
CREATE INDEX `mov_stock_producto_idx` ON `movimientos_stock` (`producto_id`);--> statement-breakpoint
CREATE TABLE `__new_ventas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`punto_venta` integer DEFAULT 1 NOT NULL,
	`numero` integer NOT NULL,
	`creado_en` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`cliente_id` integer,
	`cliente_nombre` text NOT NULL,
	`cliente_documento` text,
	`forma_pago` text NOT NULL,
	`total` integer NOT NULL,
	`usuario_id` text NOT NULL,
	`anulada_en` integer,
	`anulada_por` text,
	`motivo_anulacion` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anulada_por`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ventas_punto_venta_valido" CHECK("__new_ventas"."punto_venta" between 1 and 9999),
	CONSTRAINT "ventas_numero_positivo" CHECK("__new_ventas"."numero" > 0),
	CONSTRAINT "ventas_anulacion_completa" CHECK(("__new_ventas"."anulada_en" IS NULL AND "__new_ventas"."anulada_por" IS NULL AND "__new_ventas"."motivo_anulacion" IS NULL) OR ("__new_ventas"."anulada_en" IS NOT NULL AND "__new_ventas"."anulada_por" IS NOT NULL AND length(trim(coalesce("__new_ventas"."motivo_anulacion", ''))) > 0)),
	CONSTRAINT "ventas_forma_pago_valida" CHECK("__new_ventas"."forma_pago" in ('contado', 'tarjeta', 'cuenta_corriente')),
	CONSTRAINT "ventas_total_positivo" CHECK("__new_ventas"."total" > 0),
	CONSTRAINT "ventas_final_sin_documento" CHECK("__new_ventas"."cliente_id" IS NOT NULL OR "__new_ventas"."cliente_documento" IS NULL),
	CONSTRAINT "ventas_cuenta_requiere_cliente" CHECK("__new_ventas"."forma_pago" <> 'cuenta_corriente' OR "__new_ventas"."cliente_id" IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_ventas`("id", "punto_venta", "numero", "creado_en", "cliente_id", "cliente_nombre", "cliente_documento", "forma_pago", "total", "usuario_id", "anulada_en", "anulada_por", "motivo_anulacion") SELECT "id", 1, "numero", "creado_en", "cliente_id", "cliente_nombre", "cliente_documento", "forma_pago", "total", "usuario_id", NULL, NULL, NULL FROM `ventas`;--> statement-breakpoint
DROP TABLE `ventas`;--> statement-breakpoint
ALTER TABLE `__new_ventas` RENAME TO `ventas`;--> statement-breakpoint
CREATE UNIQUE INDEX `ventas_comprobante_unico` ON `ventas` (`punto_venta`,`numero`);--> statement-breakpoint
CREATE INDEX `ventas_creado_en_idx` ON `ventas` (`creado_en`);--> statement-breakpoint
CREATE INDEX `ventas_cliente_idx` ON `ventas` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `__new_clientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`documento` text NOT NULL,
	`telefono` text,
	`email` text,
	`limite_credito` integer,
	`creado_en` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "clientes_contacto_requerido" CHECK("__new_clientes"."telefono" IS NOT NULL OR "__new_clientes"."email" IS NOT NULL),
	CONSTRAINT "clientes_nombre_no_vacio" CHECK(length(trim("__new_clientes"."nombre")) > 0),
	CONSTRAINT "clientes_documento_numerico" CHECK(length("__new_clientes"."documento") > 0 AND "__new_clientes"."documento" NOT GLOB '*[^0-9]*'),
	CONSTRAINT "clientes_limite_positivo" CHECK("__new_clientes"."limite_credito" IS NULL OR "__new_clientes"."limite_credito" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_clientes`("id", "nombre", "documento", "telefono", "email", "limite_credito", "creado_en") SELECT "id", "nombre", "documento", "telefono", "email", NULL, "creado_en" FROM `clientes`;--> statement-breakpoint
DROP TABLE `clientes`;--> statement-breakpoint
ALTER TABLE `__new_clientes` RENAME TO `clientes`;--> statement-breakpoint
CREATE UNIQUE INDEX `clientes_documento_unique` ON `clientes` (`documento`);--> statement-breakpoint
CREATE INDEX `clientes_nombre_idx` ON `clientes` (`nombre`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
