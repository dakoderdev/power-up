"use client";

import { useId, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { cambiarContrasenaAccion } from "@/lib/usuarios/acciones";
import {
  esquemaCambioContrasena,
  type ErroresContrasena,
} from "@/lib/usuarios/esquemas";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

const CAMPOS = [
  {
    nombre: "actual" as const,
    etiqueta: "Contraseña actual",
    autoComplete: "current-password",
  },
  {
    nombre: "nueva" as const,
    etiqueta: "Contraseña nueva",
    autoComplete: "new-password",
  },
];

export function CambiarContrasena() {
  const id = useId();
  const [errores, setErrores] = useState<ErroresContrasena>({});
  const [listo, setListo] = useState(false);
  const [guardando, iniciarGuardado] = useTransition();

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);

    setListo(false);

    const validacion = esquemaCambioContrasena.safeParse({
      actual: String(datos.get("actual") ?? ""),
      nueva: String(datos.get("nueva") ?? ""),
    });

    if (!validacion.success) {
      setErrores(z.flattenError(validacion.error).fieldErrors);
      return;
    }

    setErrores({});
    iniciarGuardado(async () => {
      const respuesta = await cambiarContrasenaAccion(validacion.data);

      if (respuesta.cambiada) {
        formulario.reset();
        setListo(true);
        return;
      }

      setErrores(respuesta.errores);
    });
  }

  return (
    <form
      onSubmit={guardar}
      noValidate
      aria-label="Cambiar contraseña"
      className="flex max-w-2xl flex-col gap-6"
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
                type="password"
                autoComplete={campo.autoComplete}
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
        La contraseña nueva tiene al menos 8 caracteres. Al cambiarla se cierran
        tus otras sesiones abiertas.
      </p>

      {listo ? (
        <p role="status" className="text-sm text-neutral-300">
          Contraseña actualizada.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button variant="default" size="lg" type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Cambiar contraseña"}
        </Button>
      </div>
    </form>
  );
}
