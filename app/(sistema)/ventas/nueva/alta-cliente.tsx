"use client";

import { useId, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { CLASE_CAMPO, claseBoton } from "@/components/estilos";
import { crearClienteAccion } from "@/lib/clientes/acciones";
import { esquemaClienteNuevo } from "@/lib/clientes/esquemas";
import type { ClienteVenta } from "@/lib/clientes/listado";
import { z } from "zod";

type Campo = "nombre" | "documento" | "telefono" | "email";
type Errores = Partial<Record<Campo, string[]>>;

const CAMPOS: { nombre: Campo; etiqueta: string; tipo: string }[] = [
  { nombre: "nombre", etiqueta: "Nombre o razón social", tipo: "text" },
  { nombre: "documento", etiqueta: "Documento", tipo: "text" },
  { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel" },
  { nombre: "email", etiqueta: "Correo", tipo: "email" },
];

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
            <div key={campo.nombre} className="flex flex-col gap-2">
              <label
                htmlFor={idCampo}
                className="text-sm font-medium text-neutral-400"
              >
                {campo.etiqueta}
              </label>
              <input
                id={idCampo}
                name={campo.nombre}
                type={campo.tipo}
                inputMode={campo.nombre === "documento" ? "numeric" : undefined}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${idCampo}-error` : undefined}
                className={`${CLASE_CAMPO} ${error ? "border-red-400" : "border-neutral-800"}`}
              />
              {error ? (
                <p id={`${idCampo}-error`} className="text-sm text-red-400">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-neutral-500">
        Teléfono o correo: al menos uno de los dos.
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className={claseBoton({ variante: "texto", enFormulario: true })}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className={claseBoton({ variante: "secundario", enFormulario: true })}
        >
          {guardando ? "Guardando…" : "Guardar cliente"}
        </button>
      </div>
    </form>
  );
}
