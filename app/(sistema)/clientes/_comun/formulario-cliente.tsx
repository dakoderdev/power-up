"use client";

import { AvisoError } from "@/components/aviso-error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { ConfirmarAccion } from "@/components/confirmar-accion";
import { useFormulario } from "@/components/formulario";
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
import { FieldDescription, FieldError } from "@/components/ui/field";
import { CamposCliente, leerCliente } from "./campos-cliente";

const ESTADOS = [
  { valor: true, etiqueta: ETIQUETAS_ESTADO.activo },
  { valor: false, etiqueta: ETIQUETAS_ESTADO.inactivo },
];

export function FormularioCliente({ cliente }: { cliente?: ClienteDetalle }) {
  const id = useId();
  const router = useRouter();
  const esAlta = cliente === undefined;
  const { errores, mensaje, enviando, enviar, validar, ejecutar } =
    useFormulario();
  const [activo, setActivo] = useState(cliente?.activo ?? true);
  const [pendiente, setPendiente] = useState<ClienteEdicion | null>(null);

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = leerCliente(new FormData(evento.currentTarget));

    if (esAlta) {
      enviar({
        esquema: esquemaClienteNuevo,
        datos,
        accion: crearClienteAccion,
        aviso: "Cliente creado.",
        onListo: (creado) => router.push(`/clientes/${creado.id}`),
      });
      return;
    }

    const edicion = validar(esquemaClienteEdicion, { ...datos, activo });

    if (!edicion) {
      return;
    }

    if (cliente.activo && !edicion.activo) {
      setPendiente(edicion);
      return;
    }

    guardarEdicion(edicion);
  }

  function guardarEdicion(datos: ClienteEdicion) {
    if (esAlta) {
      return;
    }

    ejecutar({
      accion: () => editarClienteAccion({ id: cliente.id, datos }),
      aviso:
        cliente.activo && !datos.activo
          ? "Cliente dado de baja."
          : "Cambios guardados.",
      onListo: () => router.push(`/clientes/${cliente.id}`),
    });
  }

  return (
    <form
      onSubmit={guardar}
      noValidate
      aria-label={esAlta ? "Nuevo cliente" : "Editar cliente"}
      className="flex max-w-2xl flex-col gap-6"
    >
      <CamposCliente
        id={id}
        errores={errores}
        cliente={cliente}
        enfocar={esAlta}
      />
      <p className="text-sm text-muted-foreground">
        Teléfono o correo: al menos uno de los dos. Solo un cliente habilitado
        compra en cuenta corriente. Los cambios no alteran los comprobantes ya
        emitidos.
      </p>

      {esAlta ? null : (
        <fieldset className="flex flex-col gap-2">
          <legend className="pb-2 text-sm font-medium text-muted-foreground">
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
                    `${elegido ? "" : "border border-transparent"} has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring`,
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

      {mensaje ? <AvisoError>{mensaje}</AvisoError> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href={esAlta ? "/clientes" : `/clientes/${cliente.id}`}>
            Cancelar
          </Link>
        </Button>
        <Button variant="default" type="submit" disabled={enviando}>
          {enviando
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
