ALTER TABLE `movimientos_cuenta` ADD `recibo_numero` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `mov_cuenta_recibo_unico` ON `movimientos_cuenta` (`recibo_numero`);