"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { ConfirmarAccion } from "@/components/confirmar-accion";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  crearClienteAccion,
  editarClienteAccion,
} from "@/lib/clientes/acciones";
import type { ClienteDetalle } from "@/lib/clientes/detalle";
import {
  esquemaClienteEdicion,
  esquemaClienteNuevo,
  type ClienteEdicion,
} from "@/lib/clientes/esquemas";
import { ETIQUETAS_ESTADO } from "@/lib/estados";
import { cn } from "@/lib/utils";
import type { ErroresCliente } from "@/lib/clientes/guardar";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { toast } from "sonner";

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

const ESTADOS = [
  { valor: true, etiqueta: ETIQUETAS_ESTADO.activo },
  { valor: false, etiqueta: ETIQUETAS_ESTADO.inactivo },
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
  const [activo, setActivo] = useState(cliente?.activo ?? true);
  const [pendiente, setPendiente] = useState<ClienteEdicion | null>(null);

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const datos = Object.fromEntries(
      CAMPOS.map((campo) => [
        campo.nombre,
        String(formulario.get(campo.nombre) ?? ""),
      ]),
    );

    setErrores({});
    setMensaje(null);

    if (esAlta) {
      const validacion = esquemaClienteNuevo.safeParse(datos);

      if (!validacion.success) {
        setErrores(z.flattenError(validacion.error).fieldErrors);
        return;
      }

      iniciarGuardado(async () => {
        const respuesta = await crearClienteAccion(validacion.data);

        if (respuesta.creado) {
          toast.success("Cliente creado.");
          router.push(`/clientes/${respuesta.cliente.id}`);
          return;
        }

        setErrores(respuesta.errores);
      });
      return;
    }

    const validacion = esquemaClienteEdicion.safeParse({ ...datos, activo });

    if (!validacion.success) {
      setErrores(z.flattenError(validacion.error).fieldErrors);
      return;
    }

    if (cliente.activo && !validacion.data.activo) {
      setPendiente(validacion.data);
      return;
    }

    guardarEdicion(validacion.data);
  }

  function guardarEdicion(datos: ClienteEdicion) {
    if (esAlta) {
      return;
    }

    iniciarGuardado(async () => {
      const respuesta = await editarClienteAccion({ id: cliente.id, datos });

      if (respuesta.guardado) {
        toast.success(
          cliente.activo && !datos.activo
            ? "Cliente dado de baja."
            : "Cambios guardados.",
        );
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

      {esAlta ? null : (
        <fieldset className="flex flex-col gap-2">
          <legend className="pb-2 text-sm font-medium text-neutral-400">
            Estado
          </legend>
          <div className="flex gap-2">
            {ESTADOS.map((estado) => {
              const elegido = activo === estado.valor;

              return (
                <label
                  key={estado.etiqueta}
                  className={cn(
                    buttonVariants({
                      variant: elegido ? "outline" : "ghost",
                      size: "lg",
                    }),
                    `${elegido ? "" : "border border-transparent"} has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-verde`,
                  )}
                >
                  <input
                    type="radio"
                    name="activo"
                    value={String(estado.valor)}
                    checked={elegido}
                    onChange={() => setActivo(estado.valor)}
                    className="sr-only"
                  />
                  {estado.etiqueta}
                </label>
              );
            })}
          </div>
          {errores.activo ? (
            <FieldError>{errores.activo[0]}</FieldError>
          ) : (
            <FieldDescription>
              Un cliente dado de baja no aparece en ventas nuevas y conserva su
              historial. Solo se puede dar de baja con saldo cero.
            </FieldDescription>
          )}
        </fieldset>
      )}

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
      <ConfirmarAccion
        abierto={pendiente !== null}
        onCerrar={() => setPendiente(null)}
        titulo={`¿Dar de baja a ${cliente?.nombre ?? "este cliente"}?`}
        descripcion="Deja de aparecer en ventas nuevas y conserva su historial y sus comprobantes. Lo podés volver a activar desde esta ficha."
        accion="Dar de baja"
        onConfirmar={() => {
          if (pendiente) {
            guardarEdicion(pendiente);
          }

          setPendiente(null);
        }}
      />
    </form>
  );
}
