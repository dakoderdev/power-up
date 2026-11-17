"use client";

import { useId, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { Plus } from "pixelarticons/react/Plus.js";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ajustarStockAccion } from "@/lib/stock/acciones";
import {
  esquemaAjusteManual,
  MOTIVO_MAXIMO,
  type AjusteManual,
} from "@/lib/stock/esquemas";
import {
  avisoAjuste,
  MENSAJE_FALLA,
  MOTIVOS_SUGERIDOS,
} from "@/lib/stock/etiquetas";
import { MotivosSugeridos } from "./_comun/motivos-sugeridos";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

const MOTIVO_INICIAL = MOTIVOS_SUGERIDOS.entrada[0];

type Errores = Partial<Record<keyof AjusteManual, string[]>>;

export function CargarStock({
  productoId,
  nombre,
}: {
  productoId: number;
  nombre: string;
}) {
  const id = useId();
  const cantidad = useRef<HTMLInputElement>(null);
  const motivo = useRef<HTMLInputElement>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [falla, setFalla] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [cargando, iniciarCarga] = useTransition();

  function cambiarAbierto(quedaAbierto: boolean) {
    setAbierto(quedaAbierto);

    if (!quedaAbierto) {
      setErrores({});
      setFalla(false);
    }
  }

  function elegirMotivo(texto: string) {
    if (motivo.current) {
      motivo.current.value = texto;
      motivo.current.focus();
    }
  }

  function cargar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const texto = String(datos.get("cantidad") ?? "").trim();
    const validacion = esquemaAjusteManual.safeParse({
      productoId,
      tipo: "entrada",
      cantidad: texto === "" ? Number.NaN : Number(texto),
      motivo: String(datos.get("motivo") ?? ""),
    });

    if (!validacion.success) {
      setErrores(z.flattenError(validacion.error).fieldErrors);
      return;
    }

    setErrores({});
    setFalla(false);
    setAviso("");
    iniciarCarga(async () => {
      try {
        const respuesta = await ajustarStockAccion(validacion.data);

        if (respuesta.ajustado) {
          cambiarAbierto(false);
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
    <Popover open={abierto} onOpenChange={cambiarAbierto}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`Cargar stock de ${nombre}`}
          className="relative z-10 -mr-3"
        >
          <Plus aria-hidden="true" className="size-5" />
          <span className="hidden sm:inline">Cargar stock</span>
        </Button>
      </PopoverTrigger>
      <span role="status" className="sr-only">
        {aviso}
      </span>
      <PopoverContent
        align="end"
        aria-label={`Cargar stock de ${nombre}`}
        onOpenAutoFocus={(evento) => {
          evento.preventDefault();
          cantidad.current?.focus();
        }}
        className="w-80 text-left"
      >
        <form
          onSubmit={cargar}
          noValidate
          className="flex flex-col gap-4 whitespace-normal"
        >
          <p className="truncate text-[0.9375rem] font-medium">{nombre}</p>
          <Field className="w-32">
            <FieldLabel htmlFor={`${id}-cantidad`}>Cantidad</FieldLabel>
            <Input
              ref={cantidad}
              id={`${id}-cantidad`}
              name="cantidad"
              type="text"
              inputMode="numeric"
              placeholder="10"
              aria-invalid={Boolean(errorCantidad)}
              aria-describedby={
                errorCantidad ? `${id}-cantidad-error` : undefined
              }
              className="tabular-nums"
            />
          </Field>
          {errorCantidad ? (
            <FieldError id={`${id}-cantidad-error`} className="-mt-2">
              {errorCantidad}
            </FieldError>
          ) : null}
          <Field>
            <FieldLabel htmlFor={`${id}-motivo`}>Motivo</FieldLabel>
            <MotivosSugeridos tipo="entrada" onElegir={elegirMotivo} />
            <Input
              ref={motivo}
              id={`${id}-motivo`}
              name="motivo"
              type="text"
              defaultValue={MOTIVO_INICIAL}
              maxLength={MOTIVO_MAXIMO}
              aria-invalid={Boolean(errorMotivo)}
              aria-describedby={errorMotivo ? `${id}-motivo-error` : undefined}
            />
            {errorMotivo ? (
              <FieldError id={`${id}-motivo-error`}>{errorMotivo}</FieldError>
            ) : null}
          </Field>
          {falla ? (
            <p role="alert" className="text-sm text-red-400">
              {MENSAJE_FALLA}
            </p>
          ) : null}
          <Button variant="default" size="lg" type="submit" disabled={cargando}>
            {cargando ? "Registrando…" : "Registrar entrada"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
