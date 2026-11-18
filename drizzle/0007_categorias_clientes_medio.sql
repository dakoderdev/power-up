CREATE TABLE `categorias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text(60) NOT NULL,
	`activa` integer DEFAULT true NOT NULL,
	`creado_en` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "categorias_nombre_no_vacio" CHECK(length(trim("categorias"."nombre")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categorias_nombre_unique` ON `categorias` (`nombre`);--> statement-breakpoint
ALTER TABLE `clientes` ADD `tipo_doc` text DEFAULT 'DNI' NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` ADD `domicilio` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `cuenta_corriente` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `movimientos_cuenta` ADD `medio` text;--> statement-breakpoint
ALTER TABLE `productos` ADD `categoria_id` integer REFERENCES categorias(id);--> statement-breakpoint
ALTER TABLE `ventas` ADD `cliente_tipo_doc` text;--> statement-breakpoint
ALTER TABLE `ventas` ADD `cliente_domicilio` text;--> statement-breakpoint
INSERT INTO `categorias` (`nombre`) SELECT 'General' WHERE EXISTS (SELECT 1 FROM `productos`);--> statement-breakpoint
UPDATE `productos` SET `categoria_id` = (SELECT `id` FROM `categorias` WHERE `nombre` = 'General') WHERE `categoria_id` IS NULL;--> statement-breakpoint
UPDATE `clientes` SET `cuenta_corriente` = 1 WHERE `limite_credito` IS NOT NULL OR EXISTS (SELECT 1 FROM `movimientos_cuenta` WHERE `movimientos_cuenta`.`cliente_id` = `clientes`.`id`);--> statement-breakpoint
UPDATE `movimientos_cuenta` SET `medio` = 'efectivo' WHERE `tipo` = 'pago' AND `medio` IS NULL;--> statement-breakpoint
UPDATE `ventas` SET `cliente_tipo_doc` = 'DNI' WHERE `cliente_documento` IS NOT NULL AND `cliente_tipo_doc` IS NULL;
