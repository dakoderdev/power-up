"use client";

import { useId, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { crearClienteAccion } from "@/lib/clientes/acciones";
import { esquemaClienteNuevo } from "@/lib/clientes/esquemas";
import type { ClienteVenta } from "@/lib/clientes/listado";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";

type Campo = "nombre" | "documento" | "telefono" | "email" | "limiteCredito";
type Errores = Partial<Record<Campo, string[]>>;

const CAMPOS: { nombre: Campo; etiqueta: string; tipo: string }[] = [
  { nombre: "nombre", etiqueta: "Nombre o razón social", tipo: "text" },
  { nombre: "documento", etiqueta: "Documento", tipo: "text" },
  { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel" },
  { nombre: "email", etiqueta: "Correo", tipo: "email" },
  {
    nombre: "limiteCredito",
    etiqueta: "Límite de crédito (opcional)",
    tipo: "text",
  },
];

const MODO_TECLADO: Partial<Record<Campo, "numeric" | "decimal">> = {
  documento: "numeric",
  limiteCredito: "decimal",
};

export function AltaCliente({
  onCreado,
  onCancelar,
}: {
  onCreado: (cliente: ClienteVenta) => void;
  onCancelar: () => void;
}) {
  const id = useId();
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, iniciarGuardado] = useTransition();

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const datos = Object.fromEntries(
      CAMPOS.map((campo) => [
        campo.nombre,
        String(formulario.get(campo.nombre) ?? ""),
      ]),
    );
    const validacion = esquemaClienteNuevo.safeParse(datos);

    if (!validacion.success) {
      setErrores(z.flattenError(validacion.error).fieldErrors);
      return;
    }

    setErrores({});
    iniciarGuardado(async () => {
      const respuesta = await crearClienteAccion(validacion.data);

      if (respuesta.creado) {
        toast.success("Cliente creado y elegido para la venta.");
        onCreado(respuesta.cliente);
        return;
      }

      setErrores(respuesta.errores);
    });
  }

  return (
    <form
      onSubmit={guardar}
      noValidate
      aria-label="Nuevo cliente"
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {CAMPOS.map((campo) => {
          const error = errores[campo.nombre]?.[0];
          const idCampo = `${id}-${campo.nombre}`;

          return (
            <Field key={campo.nombre}>
              <FieldLabel htmlFor={idCampo}>{campo.etiqueta}</FieldLabel>
              <Input
                id={idCampo}
                name={campo.nombre}
                type={campo.tipo}
                inputMode={MODO_TECLADO[campo.nombre]}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${idCampo}-error` : undefined}
              />
              {error ? (
                <FieldError id={`${idCampo}-error`}>{error}</FieldError>
              ) : null}
            </Field>
          );
        })}
      </div>
      <p className="text-sm text-neutral-500">
        Teléfono o correo: al menos uno de los dos. Sin límite de crédito, la
        cuenta corriente no tiene tope.
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" size="lg" type="button" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variant="outline" size="lg" type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar cliente"}
        </Button>
      </div>
    </form>
  );
}
