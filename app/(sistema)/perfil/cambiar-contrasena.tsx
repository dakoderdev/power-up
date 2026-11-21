"use client";

import { AvisoError } from "@/components/aviso-error";
import { useId } from "react";
import type { FormEvent } from "react";
import { useFormulario } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { cambiarContrasenaAccion } from "@/lib/usuarios/acciones";
import { esquemaCambioContrasena } from "@/lib/usuarios/esquemas";
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
  const { errores, mensaje, enviando: guardando, enviar } = useFormulario();

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);

    enviar({
      esquema: esquemaCambioContrasena,
      datos: {
        actual: String(datos.get("actual") ?? ""),
        nueva: String(datos.get("nueva") ?? ""),
      },
      accion: cambiarContrasenaAccion,
      aviso: "Contraseña actualizada.",
      onListo: () => formulario.reset(),
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

      <p className="text-sm text-muted-foreground">
        La contraseña nueva tiene al menos 8 caracteres. Al cambiarla se cierran
        tus otras sesiones abiertas.
      </p>

      {mensaje ? <AvisoError>{mensaje}</AvisoError> : null}
      <div className="flex justify-end">
        <Button variant="default" type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Cambiar contraseña"}
        </Button>
      </div>
    </form>
  );
}
