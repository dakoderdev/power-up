"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  crearClienteAccion,
  editarClienteAccion,
} from "@/lib/clientes/acciones";
import type { ClienteDetalle } from "@/lib/clientes/detalle";
import { esquemaClienteNuevo } from "@/lib/clientes/esquemas";
import type { ErroresCliente } from "@/lib/clientes/guardar";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

type Campo = "nombre" | "documento" | "telefono" | "email" | "limiteCredito";

const CAMPOS: {
  nombre: Campo;
  etiqueta: string;
  tipo: string;
  modo?: "numeric" | "decimal";
  ejemplo?: string;
}[] = [
  { nombre: "nombre", etiqueta: "Nombre o razón social", tipo: "text" },
  { nombre: "documento", etiqueta: "Documento", tipo: "text", modo: "numeric" },
  { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel" },
  { nombre: "email", etiqueta: "Correo", tipo: "email" },
  {
    nombre: "limiteCredito",
    etiqueta: "Límite de crédito (opcional)",
    tipo: "text",
    modo: "decimal",
    ejemplo: "150000",
  },
];

function valorInicial({
  campo,
  cliente,
}: {
  campo: Campo;
  cliente?: ClienteDetalle;
}) {
  const valor = cliente?.[campo] ?? "";

  return campo === "limiteCredito" ? valor.replace(".", ",") : valor;
}

export function FormularioCliente({ cliente }: { cliente?: ClienteDetalle }) {
  const id = useId();
  const router = useRouter();
  const esAlta = cliente === undefined;
  const [errores, setErrores] = useState<ErroresCliente>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
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
      setMensaje(null);
      return;
    }

    setErrores({});
    setMensaje(null);
    iniciarGuardado(async () => {
      if (esAlta) {
        const respuesta = await crearClienteAccion(validacion.data);

        if (respuesta.creado) {
          router.push(`/clientes/${respuesta.cliente.id}`);
          return;
        }

        setErrores(respuesta.errores);
        return;
      }

      const respuesta = await editarClienteAccion({
        id: cliente.id,
        datos: validacion.data,
      });

      if (respuesta.guardado) {
        router.push(`/clientes/${cliente.id}`);
        return;
      }

      setErrores(respuesta.errores);
      setMensaje(respuesta.mensaje ?? null);
    });
  }

  return (
    <form
      onSubmit={guardar}
      noValidate
      aria-label={esAlta ? "Nuevo cliente" : "Editar cliente"}
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
                type={campo.tipo}
                inputMode={campo.modo}
                placeholder={campo.ejemplo}
                autoFocus={esAlta && campo.nombre === "nombre"}
                defaultValue={valorInicial({ campo: campo.nombre, cliente })}
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
      <p className="text-sm text-neutral-500">
        Teléfono o correo: al menos uno de los dos. Sin límite de crédito, la
        cuenta corriente no tiene tope. Los cambios no alteran los comprobantes
        ya emitidos.
      </p>

      {mensaje ? (
        <p role="alert" className="text-sm text-red-400">
          {mensaje}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="ghost" size="lg">
          <Link href={esAlta ? "/clientes" : `/clientes/${cliente.id}`}>
            Cancelar
          </Link>
        </Button>
        <Button variant="default" size="lg" type="submit" disabled={guardando}>
          {guardando
            ? "Guardando…"
            : esAlta
              ? "Crear cliente"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
