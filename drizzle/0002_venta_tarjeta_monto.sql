PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	`monto_recibido` integer,
	`tarjeta_tipo` text,
	`tarjeta_marca` text(30),
	`tarjeta_ultimos4` text(4),
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
	CONSTRAINT "ventas_cuenta_requiere_cliente" CHECK("__new_ventas"."forma_pago" <> 'cuenta_corriente' OR "__new_ventas"."cliente_id" IS NOT NULL),
	CONSTRAINT "ventas_tarjeta_solo_con_tarjeta" CHECK("__new_ventas"."forma_pago" = 'tarjeta' OR ("__new_ventas"."tarjeta_tipo" IS NULL AND "__new_ventas"."tarjeta_marca" IS NULL AND "__new_ventas"."tarjeta_ultimos4" IS NULL)),
	CONSTRAINT "ventas_tarjeta_ultimos4_validos" CHECK("__new_ventas"."tarjeta_ultimos4" IS NULL OR (length("__new_ventas"."tarjeta_ultimos4") = 4 AND "__new_ventas"."tarjeta_ultimos4" NOT GLOB '*[^0-9]*')),
	CONSTRAINT "ventas_monto_recibido_valido" CHECK("__new_ventas"."monto_recibido" IS NULL OR ("__new_ventas"."forma_pago" = 'contado' AND "__new_ventas"."monto_recibido" >= "__new_ventas"."total"))
);
--> statement-breakpoint
INSERT INTO `__new_ventas`("id", "punto_venta", "numero", "creado_en", "cliente_id", "cliente_nombre", "cliente_documento", "forma_pago", "total", "usuario_id", "anulada_en", "anulada_por", "motivo_anulacion") SELECT "id", "punto_venta", "numero", "creado_en", "cliente_id", "cliente_nombre", "cliente_documento", "forma_pago", "total", "usuario_id", "anulada_en", "anulada_por", "motivo_anulacion" FROM `ventas`;--> statement-breakpoint
DROP TABLE `ventas`;--> statement-breakpoint
ALTER TABLE `__new_ventas` RENAME TO `ventas`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `ventas_comprobante_unico` ON `ventas` (`punto_venta`,`numero`);--> statement-breakpoint
CREATE INDEX `ventas_creado_en_idx` ON `ventas` (`creado_en`);--> statement-breakpoint
CREATE INDEX `ventas_cliente_idx` ON `ventas` (`cliente_id`);