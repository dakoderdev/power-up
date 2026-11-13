"use client";

import { useId, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { CLASE_CAMPO, claseBoton } from "@/components/estilos";
import { registrarPagoAccion } from "@/lib/cuentas/acciones";
import { crearEsquemaPago, type PagoEntrada } from "@/lib/cuentas/esquemas";

type Errores = Partial<Record<keyof PagoEntrada, string[]>>;

export function RegistrarPago({
  clienteId,
  saldo,
}: {
  clienteId: number;
  saldo: string;
}) {
  const id = useId();
  const formulario = useRef<HTMLFormElement>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [registrando, iniciarRegistro] = useTransition();

  function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const validacion = crearEsquemaPago({ saldo }).safeParse({
      clienteId,
      importe: String(datos.get("importe") ?? ""),
      observacion: String(datos.get("observacion") ?? ""),
    });

    if (!validacion.success) {
      setErrores(z.flattenError(validacion.error).fieldErrors);
      return;
    }

    setErrores({});
    iniciarRegistro(async () => {
      const respuesta = await registrarPagoAccion(validacion.data);

      if (respuesta.registrado) {
        formulario.current?.reset();
        return;
      }

      setErrores(respuesta.errores);
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
        {campos.map((campo) => {
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
                type="text"
                inputMode={campo.modo}
                placeholder={campo.ejemplo}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${idCampo}-error` : undefined}
                className={`${CLASE_CAMPO} ${campo.modo ? "tabular-nums" : ""} ${error ? "border-red-400" : "border-neutral-800"}`}
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
        El pago resta del saldo total, no de una venta en particular, y no se
        puede editar ni anular.
      </p>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={registrando}
          className={claseBoton({ variante: "primario", enFormulario: true })}
        >
          {registrando ? "Registrando…" : "Registrar pago"}
        </button>
      </div>
    </form>
  );
}
