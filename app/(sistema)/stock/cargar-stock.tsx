"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { Plus } from "pixelarticons/react/Plus.js";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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

const SEPARACION = 8;
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
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const cantidad = useRef<HTMLInputElement>(null);
  const motivo = useRef<HTMLInputElement>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [falla, setFalla] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [cargando, iniciarCarga] = useTransition();

  function ubicar() {
    if (!boton.current || !panel.current) {
      return;
    }

    const ancla = boton.current.getBoundingClientRect();
    const { width, height } = panel.current.getBoundingClientRect();
    const izquierda = Math.max(
      SEPARACION,
      Math.min(ancla.right - width, window.innerWidth - width - SEPARACION),
    );
    const cabeAbajo = ancla.bottom + SEPARACION + height <= window.innerHeight;
    const arriba = cabeAbajo
      ? ancla.bottom + SEPARACION
      : Math.max(SEPARACION, ancla.top - SEPARACION - height);

    panel.current.style.inset = `${arriba}px auto auto ${izquierda}px`;
  }

  function alternar() {
    if (!panel.current) {
      return;
    }

    if (panel.current.matches(":popover-open")) {
      panel.current.hidePopover();
      return;
    }

    panel.current.showPopover();
    ubicar();
    cantidad.current?.focus();
  }

  useEffect(() => {
    const actual = panel.current;

    function alCambiar(evento: Event) {
      const quedaAbierto = (evento as ToggleEvent).newState === "open";
      setAbierto(quedaAbierto);

      if (!quedaAbierto) {
        formulario.current?.reset();
        setErrores({});
        setFalla(false);
      }
    }

    actual?.addEventListener("toggle", alCambiar);

    return () => actual?.removeEventListener("toggle", alCambiar);
  }, []);

  useEffect(() => {
    if (!abierto) {
      return;
    }

    window.addEventListener("scroll", ubicar, true);
    window.addEventListener("resize", ubicar);

    return () => {
      window.removeEventListener("scroll", ubicar, true);
      window.removeEventListener("resize", ubicar);
    };
  }, [abierto]);

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
          panel.current?.hidePopover();
          boton.current?.focus();
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
    <>
      <Button
        variant="ghost"
        ref={boton}
        type="button"
        onClick={alternar}
        aria-controls={id}
        aria-expanded={abierto}
        aria-label={`Cargar stock de ${nombre}`}
        className="relative z-10 -mr-3"
      >
        <Plus aria-hidden="true" className="size-5" />
        <span className="hidden sm:inline">Cargar stock</span>
      </Button>
      <span role="status" className="sr-only">
        {aviso}
      </span>
      <div
        ref={panel}
        id={id}
        popover="auto"
        role="dialog"
        aria-label={`Cargar stock de ${nombre}`}
        className="m-0 w-80 border border-neutral-800 bg-black p-3 text-left text-white"
      >
        <form
          ref={formulario}
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
      </div>
    </>
  );
}
