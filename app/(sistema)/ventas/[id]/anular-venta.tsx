"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { ConfirmarAccion } from "@/components/confirmar-accion";
import { useFormulario } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { anularVentaAccion } from "@/lib/ventas/acciones";
import { esquemaAnulacion, type Anulacion } from "@/lib/ventas/esquemas";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

export function AnularVenta({ ventaId }: { ventaId: number }) {
  const id = useId();
  const {
    errores,
    mensaje,
    enviando: anulando,
    validar,
    ejecutar,
  } = useFormulario();
  const [pendiente, setPendiente] = useState<Anulacion | null>(null);
  const error = errores.motivoAnulacion?.[0] ?? mensaje;

  function anular(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const anulacion = validar(esquemaAnulacion, {
      id: ventaId,
      motivoAnulacion: String(formulario.get("motivo") ?? ""),
    });

    if (anulacion) {
      setPendiente(anulacion);
    }
  }

  function confirmar() {
    if (!pendiente) {
      return;
    }

    const datos = pendiente;
    setPendiente(null);
    ejecutar({
      accion: () => anularVentaAccion(datos),
      aviso:
        "Venta anulada. Se devolvió el stock y se ajustó el saldo si correspondía.",
    });
  }

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-10">
      <h2 className="text-xl font-semibold tracking-tight">Anular venta</h2>
      <p className="text-sm text-muted-foreground">
        La venta queda visible como anulada: se devuelve el stock y, si fue en
        cuenta corriente, se resta el total del saldo del cliente. No se puede
        deshacer.
      </p>
      <form
        onSubmit={anular}
        noValidate
        className="flex max-w-2xl flex-col gap-4"
      >
        <Field>
          <FieldLabel htmlFor={`${id}-motivo`}>Motivo</FieldLabel>
          <Input
            id={`${id}-motivo`}
            name="motivo"
            type="text"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
        </Field>
        <div className="flex justify-end">
          <Button variant="outline" type="submit" disabled={anulando}>
            {anulando ? "Anulando…" : "Anular venta"}
          </Button>
        </div>
      </form>
      <ConfirmarAccion
        abierto={pendiente !== null}
        onCerrar={() => setPendiente(null)}
        titulo="¿Anular esta venta?"
        descripcion="Se devuelve el stock y, si fue en cuenta corriente, se resta el total del saldo del cliente. No se puede deshacer."
        accion="Anular venta"
        onConfirmar={confirmar}
      />
    </section>
  );
}
