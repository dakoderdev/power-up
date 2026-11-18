"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { erroresPorCampo, type ResultadoAccion } from "@/lib/acciones";

export type ErroresFormulario = Partial<Record<string, string[]>>;

type Ejecucion<T> = {
  accion: () => Promise<ResultadoAccion<T>>;
  aviso: string | ((valor: T) => string);
  onListo?: (valor: T) => void;
};

// Sección 10.6: hook común de los formularios. Errores por campo (primero los
// de Zod, después los del servidor), estado de envío y aviso del resultado.
export function useFormulario() {
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function limpiar() {
    setErrores({});
    setMensaje(null);
  }

  function validar<S extends z.ZodType>(
    esquema: S,
    datos: unknown,
  ): z.output<S> | undefined {
    const validacion = esquema.safeParse(datos);

    setMensaje(null);
    setErrores(
      validacion.success ? {} : z.flattenError(validacion.error).fieldErrors,
    );

    return validacion.success ? validacion.data : undefined;
  }

  function ejecutar<T>({ accion, aviso, onListo }: Ejecucion<T>) {
    iniciar(async () => {
      const resultado = await accion();

      if (!resultado.ok) {
        const porCampo = erroresPorCampo(resultado.error);
        const hayCampos = Object.keys(porCampo).length > 0;

        setErrores(porCampo);
        setMensaje(hayCampos ? null : resultado.error.message);
        return;
      }

      limpiar();
      toast.success(typeof aviso === "string" ? aviso : aviso(resultado.data));
      onListo?.(resultado.data);
    });
  }

  function enviar<S extends z.ZodType, T>({
    esquema,
    datos,
    accion,
    aviso,
    onListo,
  }: Omit<Ejecucion<T>, "accion"> & {
    esquema: S;
    datos: unknown;
    accion: (validos: z.output<S>) => Promise<ResultadoAccion<T>>;
  }) {
    const validos = validar(esquema, datos);

    if (validos === undefined) {
      return;
    }

    ejecutar({ accion: () => accion(validos), aviso, onListo });
  }

  return { errores, mensaje, enviando, limpiar, validar, ejecutar, enviar };
}
