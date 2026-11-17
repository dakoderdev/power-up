"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { CLASE_AREA, CLASE_CAMPO } from "@/components/estilos";
import { Button, buttonVariants } from "@/components/ui/button";
import { TIPOS_STOCK } from "@/lib/db/schema";
import { ajustarStockAccion } from "@/lib/stock/acciones";
import {
  ANCLA_AJUSTE,
  avisoAjuste,
  MENSAJE_FALLA,
} from "@/lib/stock/etiquetas";
import {
  esquemaAjusteManual,
  MOTIVO_MAXIMO,
  type AjusteManual,
} from "@/lib/stock/esquemas";
import { cn } from "@/lib/utils";
import { MotivosSugeridos } from "./_comun/motivos-sugeridos";

type Errores = Partial<Record<keyof AjusteManual, string[]>>;
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
  const [errores, setErrores] = useState<Errores>({});
  const [falla, setFalla] = useState(false);
  const [aviso, setAviso] = useState("");
  const [ajustando, iniciarAjuste] = useTransition();

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
    const validacion = esquemaAjusteManual.safeParse({
      productoId,
      tipo,
      cantidad: texto === "" ? Number.NaN : Number(texto),
      motivo: String(datos.get("motivo") ?? ""),
    });

    if (!validacion.success) {
      setErrores(z.flattenError(validacion.error).fieldErrors);
      return;
    }

    if (validacion.data.tipo === "salida" && validacion.data.cantidad > stock) {
      setErrores({
        cantidad: [`No se puede sacar más que el stock actual (${stock}).`],
      });
      return;
    }

    setErrores({});
    setFalla(false);
    setAviso("");
    iniciarAjuste(async () => {
      try {
        const respuesta = await ajustarStockAccion(validacion.data);

        if (respuesta.ajustado) {
          formulario.current?.reset();
          setAviso(avisoAjuste(validacion.data));
          return;
        }

        setErrores(respuesta.errores);
      } catch {
        setFalla(true);
      }
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
      <h3 className="text-[0.9375rem] font-medium text-white">Ajustar stock</h3>
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
              `${tipo === opcion ? "" : "border border-transparent"} has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-verde`,
            )}
          >
            <input
              type="radio"
              name="tipo"
              value={opcion}
              checked={tipo === opcion}
              onChange={() => {
                setTipo(opcion);
                setErrores({});
                setAviso("");
              }}
              className="sr-only"
            />
            {ETIQUETAS_TIPO[opcion]}
          </label>
        ))}
      </fieldset>
      <div className="flex w-32 flex-col gap-2">
        <label
          htmlFor={`${id}-cantidad`}
          className="text-sm font-medium text-neutral-400"
        >
          Cantidad
        </label>
        <input
          ref={cantidad}
          id={`${id}-cantidad`}
          name="cantidad"
          type="text"
          inputMode="numeric"
          placeholder="10"
          aria-invalid={Boolean(errorCantidad)}
          aria-describedby={errorCantidad ? `${id}-cantidad-error` : undefined}
          className={`${CLASE_CAMPO} tabular-nums ${errorCantidad ? "border-red-400" : "border-neutral-800"}`}
        />
        {errorCantidad ? (
          <p id={`${id}-cantidad-error`} className="text-sm text-red-400">
            {errorCantidad}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${id}-motivo`}
          className="text-sm font-medium text-neutral-400"
        >
          Motivo
        </label>
        <MotivosSugeridos tipo={tipo} onElegir={elegirMotivo} />
        <textarea
          ref={motivo}
          id={`${id}-motivo`}
          name="motivo"
          rows={3}
          maxLength={MOTIVO_MAXIMO}
          placeholder="Elegí un motivo o escribí uno"
          aria-invalid={Boolean(errorMotivo)}
          aria-describedby={errorMotivo ? `${id}-motivo-error` : undefined}
          className={`${CLASE_AREA} ${errorMotivo ? "border-red-400" : "border-neutral-800"}`}
        />
        {errorMotivo ? (
          <p id={`${id}-motivo-error`} className="text-sm text-red-400">
            {errorMotivo}
          </p>
        ) : null}
      </div>
      {falla ? (
        <p role="alert" className="text-sm text-red-400">
          {MENSAJE_FALLA}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-4">
        <p role="status" className="mr-auto text-sm text-neutral-400">
          {aviso ||
            "El ajuste queda en el historial y no se puede editar ni borrar."}
        </p>
        <Button variant="default" size="lg" type="submit" disabled={ajustando}>
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
