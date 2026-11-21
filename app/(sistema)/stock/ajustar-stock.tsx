"use client";

import { AvisoError } from "@/components/aviso-error";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useFormulario } from "@/components/formulario";
import { Button, buttonVariants } from "@/components/ui/button";
import { TIPOS_STOCK } from "@/lib/db/schema";
import { ajustarStockAccion } from "@/lib/stock/acciones";
import { ANCLA_AJUSTE, avisoAjuste } from "@/lib/stock/etiquetas";
import { crearEsquemaAjuste, MOTIVO_MAXIMO } from "@/lib/stock/esquemas";
import { cn } from "@/lib/utils";
import { MotivosSugeridos } from "./_comun/motivos-sugeridos";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

type Tipo = (typeof TIPOS_STOCK)[number];

const ETIQUETAS_TIPO: Record<Tipo, string> = {
  entrada: "Entrada",
  salida: "Salida",
};

export function AjustarStock({
  productoId,
  stock,
}: {
  productoId: number;
  stock: number;
}) {
  const id = useId();
  const formulario = useRef<HTMLFormElement>(null);
  const cantidad = useRef<HTMLInputElement>(null);
  const motivo = useRef<HTMLTextAreaElement>(null);
  const [tipo, setTipo] = useState<Tipo>("entrada");
  const {
    errores,
    mensaje,
    enviando: ajustando,
    enviar,
    limpiar,
  } = useFormulario();

  useEffect(() => {
    if (window.location.hash === `#${ANCLA_AJUSTE}`) {
      cantidad.current?.focus();
    }
  }, []);

  function elegirMotivo(texto: string) {
    if (motivo.current) {
      motivo.current.value = texto;
      motivo.current.focus();
    }
  }

  function ajustar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const texto = String(datos.get("cantidad") ?? "").trim();
    const entrada = {
      productoId,
      tipo,
      cantidad: texto === "" ? Number.NaN : Number(texto),
      motivo: String(datos.get("motivo") ?? ""),
    };

    enviar({
      esquema: crearEsquemaAjuste(stock),
      datos: entrada,
      accion: ajustarStockAccion,
      aviso: () =>
        avisoAjuste({ tipo: entrada.tipo, cantidad: entrada.cantidad }),
      onListo: () => formulario.current?.reset(),
    });
  }

  const errorCantidad = errores.cantidad?.[0];
  const errorMotivo = errores.motivo?.[0];

  return (
    <form
      ref={formulario}
      onSubmit={ajustar}
      noValidate
      id={ANCLA_AJUSTE}
      aria-label="Ajustar stock"
      className="flex flex-col gap-4"
    >
      <h3 className="text-sm font-medium text-foreground">Ajustar stock</h3>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Tipo de movimiento</legend>
        {TIPOS_STOCK.map((opcion) => (
          <label
            key={opcion}
            className={cn(
              buttonVariants({
                variant: tipo === opcion ? "outline" : "ghost",
                size: "lg",
              }),
              `${tipo === opcion ? "" : "border border-transparent"} has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring`,
            )}
          >
            <input
              type="radio"
              name="tipo"
              value={opcion}
              checked={tipo === opcion}
              onChange={() => {
                setTipo(opcion);
                limpiar();
              }}
              className="sr-only"
            />
            {ETIQUETAS_TIPO[opcion]}
          </label>
        ))}
      </fieldset>
      <div className="flex w-32 flex-col gap-2">
        <FieldLabel htmlFor={`${id}-cantidad`}>Cantidad</FieldLabel>
        <Input
          ref={cantidad}
          id={`${id}-cantidad`}
          name="cantidad"
          type="text"
          inputMode="numeric"
          placeholder="10"
          aria-invalid={Boolean(errorCantidad)}
          aria-describedby={errorCantidad ? `${id}-cantidad-error` : undefined}
          className="tabular-nums"
        />
        {errorCantidad ? (
          <FieldError id={`${id}-cantidad-error`}>{errorCantidad}</FieldError>
        ) : null}
      </div>
      <Field>
        <FieldLabel htmlFor={`${id}-motivo`}>Motivo</FieldLabel>
        <MotivosSugeridos tipo={tipo} onElegir={elegirMotivo} />
        <Textarea
          ref={motivo}
          id={`${id}-motivo`}
          name="motivo"
          rows={3}
          maxLength={MOTIVO_MAXIMO}
          placeholder="Elegí un motivo o escribí uno"
          aria-invalid={Boolean(errorMotivo)}
          aria-describedby={errorMotivo ? `${id}-motivo-error` : undefined}
        />
        {errorMotivo ? (
          <FieldError id={`${id}-motivo-error`}>{errorMotivo}</FieldError>
        ) : null}
      </Field>
      {mensaje ? <AvisoError>{mensaje}</AvisoError> : null}
      <div className="flex flex-wrap items-center justify-end gap-4">
        <p role="status" className="mr-auto text-sm text-muted-foreground">
          El ajuste queda en el historial y no se puede editar ni borrar.
        </p>
        <Button variant="default" type="submit" disabled={ajustando}>
          {ajustando
            ? "Registrando…"
            : tipo === "entrada"
              ? "Registrar entrada"
              : "Registrar salida"}
        </Button>
      </div>
    </form>
  );
}
