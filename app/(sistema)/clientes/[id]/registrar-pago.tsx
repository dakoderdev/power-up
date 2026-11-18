"use client";

import { useId, useRef } from "react";
import type { FormEvent } from "react";
import { useFormulario } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { registrarPagoAccion } from "@/lib/cuentas/acciones";
import { crearEsquemaPago } from "@/lib/cuentas/esquemas";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { ETIQUETAS_MEDIO_PAGO } from "@/lib/cuentas/etiquetas";

export function RegistrarPago({
  clienteId,
  saldo,
}: {
  clienteId: number;
  saldo: string;
}) {
  const id = useId();
  const formulario = useRef<HTMLFormElement>(null);
  const { errores, mensaje, enviando: registrando, enviar } = useFormulario();

  function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);

    enviar({
      esquema: crearEsquemaPago({ saldo }),
      datos: {
        clienteId,
        importe: String(datos.get("importe") ?? ""),
        medio: String(datos.get("medio") ?? ""),
        observacion: String(datos.get("observacion") ?? ""),
      },
      accion: registrarPagoAccion,
      aviso: "Pago registrado.",
      onListo: () => formulario.current?.reset(),
    });
  }

  const campos = [
    {
      nombre: "importe" as const,
      etiqueta: "Importe",
      modo: "decimal" as const,
      ejemplo: saldo.replace(".", ","),
    },
    { nombre: "observacion" as const, etiqueta: "Observación (opcional)" },
  ];

  return (
    <form
      ref={formulario}
      onSubmit={registrar}
      noValidate
      aria-label="Registrar pago"
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${id}-medio`}>Medio</FieldLabel>
          <NativeSelect
            id={`${id}-medio`}
            name="medio"
            defaultValue="efectivo"
            aria-invalid={Boolean(errores.medio?.[0])}
            aria-describedby={
              errores.medio?.[0] ? `${id}-medio-error` : undefined
            }
          >
            {Object.entries(ETIQUETAS_MEDIO_PAGO).map(([valor, etiqueta]) => (
              <NativeSelectOption key={valor} value={valor}>
                {etiqueta}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {errores.medio?.[0] ? (
            <FieldError id={`${id}-medio-error`}>{errores.medio[0]}</FieldError>
          ) : null}
        </Field>
        {campos.map((campo) => {
          const error = errores[campo.nombre]?.[0];
          const idCampo = `${id}-${campo.nombre}`;

          return (
            <Field key={campo.nombre}>
              <FieldLabel htmlFor={idCampo}>{campo.etiqueta}</FieldLabel>
              <Input
                id={idCampo}
                name={campo.nombre}
                type="text"
                inputMode={campo.modo}
                placeholder={campo.ejemplo}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${idCampo}-error` : undefined}
                className={campo.modo ? "tabular-nums" : ""}
              />
              {error ? (
                <FieldError id={`${idCampo}-error`}>{error}</FieldError>
              ) : null}
            </Field>
          );
        })}
      </div>
      {mensaje ? (
        <p role="alert" className="text-sm text-red-400">
          {mensaje}
        </p>
      ) : null}
      <p className="text-sm text-neutral-500">
        El pago resta del saldo total, no de una venta en particular, y no se
        puede editar ni anular.
      </p>
      <div className="flex justify-end">
        <Button
          variant="default"
          size="lg"
          type="submit"
          disabled={registrando}
        >
          {registrando ? "Registrando…" : "Registrar pago"}
        </Button>
      </div>
    </form>
  );
}
