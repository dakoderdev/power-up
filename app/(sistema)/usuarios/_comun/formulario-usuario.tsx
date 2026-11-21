"use client";

import { AvisoError } from "@/components/aviso-error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { ConfirmarAccion } from "@/components/confirmar-accion";
import { useFormulario } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/db/schema";
import {
  crearUsuarioAccion,
  editarUsuarioAccion,
} from "@/lib/usuarios/acciones";
import type { UsuarioDetalle } from "@/lib/usuarios/detalle";
import {
  esquemaUsuarioEdicion,
  esquemaUsuarioNuevo,
} from "@/lib/usuarios/esquemas";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";

const ETIQUETAS_ROL = {
  admin: "Administrador",
  operator: "Vendedor",
} as const;

export function FormularioUsuario({
  usuario,
  esActual = false,
}: {
  usuario?: UsuarioDetalle;
  esActual?: boolean;
}) {
  const id = useId();
  const router = useRouter();
  const [rol, setRol] = useState<(typeof ROLES)[number]>(
    usuario?.rol ?? "operator",
  );
  const [activo, setActivo] = useState(usuario?.activo ?? true);
  const {
    errores,
    mensaje,
    enviando: guardando,
    enviar,
    validar,
    ejecutar,
  } = useFormulario();
  const [pendiente, setPendiente] = useState<z.infer<
    typeof esquemaUsuarioEdicion
  > | null>(null);

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const nombre = String(formulario.get("nombre") ?? "");
    const correo = String(formulario.get("correo") ?? "");

    if (usuario === undefined) {
      enviar({
        esquema: esquemaUsuarioNuevo,
        datos: {
          nombre,
          correo,
          rol,
          contrasena: String(formulario.get("contrasena") ?? ""),
        },
        accion: crearUsuarioAccion,
        aviso: "Usuario creado.",
        onListo: () => router.push("/usuarios"),
      });
      return;
    }

    const edicion = validar(esquemaUsuarioEdicion, {
      nombre,
      correo,
      rol,
      activo,
    });

    if (!edicion) {
      return;
    }

    if (usuario.activo && !edicion.activo) {
      setPendiente(edicion);
      return;
    }

    guardarEdicion(edicion);
  }

  function guardarEdicion(datos: z.infer<typeof esquemaUsuarioEdicion>) {
    if (usuario === undefined) {
      return;
    }

    ejecutar({
      accion: () => editarUsuarioAccion({ id: usuario.id, datos }),
      aviso:
        usuario.activo && !datos.activo
          ? "Usuario desactivado."
          : "Cambios guardados.",
      onListo: () => router.push("/usuarios"),
    });
  }

  const esAlta = usuario === undefined;

  function campoTexto({
    nombre,
    etiqueta,
    tipo,
    valor,
    autoComplete,
  }: {
    nombre: "nombre" | "correo" | "contrasena";
    etiqueta: string;
    tipo: string;
    valor?: string;
    autoComplete?: string;
  }) {
    const error = errores[nombre]?.[0];
    const idCampo = `${id}-${nombre}`;

    return (
      <Field>
        <FieldLabel htmlFor={idCampo}>{etiqueta}</FieldLabel>
        <Input
          id={idCampo}
          name={nombre}
          type={tipo}
          autoComplete={autoComplete}
          autoFocus={esAlta && nombre === "nombre"}
          defaultValue={valor}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${idCampo}-error` : undefined}
        />
        {error ? (
          <FieldError id={`${idCampo}-error`}>{error}</FieldError>
        ) : null}
      </Field>
    );
  }

  const errorRol = errores.rol?.[0];

  return (
    <form
      onSubmit={guardar}
      noValidate
      aria-label={esAlta ? "Nuevo usuario" : "Editar usuario"}
      className="flex max-w-2xl flex-col gap-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {campoTexto({
          nombre: "nombre",
          etiqueta: "Nombre",
          tipo: "text",
          valor: usuario?.nombre,
        })}
        {campoTexto({
          nombre: "correo",
          etiqueta: "Correo o acceso",
          tipo: "email",
          valor: usuario?.correo,
          autoComplete: "off",
        })}

        <Field>
          <FieldLabel htmlFor={`${id}-rol`}>Rol</FieldLabel>
          <NativeSelect
            id={`${id}-rol`}
            value={rol}
            onChange={(evento) =>
              setRol(evento.target.value as (typeof ROLES)[number])
            }
            disabled={esActual}
            aria-invalid={Boolean(errorRol)}
          >
            {ROLES.map((valor) => (
              <NativeSelectOption key={valor} value={valor}>
                {ETIQUETAS_ROL[valor]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {errorRol ? <FieldError>{errorRol}</FieldError> : null}
        </Field>

        {esAlta
          ? campoTexto({
              nombre: "contrasena",
              etiqueta: "Contraseña inicial",
              tipo: "password",
              autoComplete: "new-password",
            })
          : null}
      </div>

      {esAlta ? null : (
        <Field orientation="horizontal" data-disabled={esActual}>
          <Checkbox
            id={`${id}-activo`}
            checked={activo}
            onCheckedChange={(marcado) => setActivo(marcado === true)}
            disabled={esActual}
          />
          <FieldLabel
            htmlFor={`${id}-activo`}
            className="text-sm font-normal text-foreground"
          >
            Usuario activo
          </FieldLabel>
        </Field>
      )}

      <p className="text-sm text-muted-foreground">
        {esAlta
          ? "La contraseña tiene al menos 8 caracteres. Pasásela al usuario por un canal seguro."
          : esActual
            ? "No podés cambiar tu propio rol ni desactivarte. Lo hace otro administrador."
            : "Al desactivar un usuario se cierran sus sesiones abiertas."}
      </p>

      {mensaje ? <AvisoError>{mensaje}</AvisoError> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href="/usuarios">Cancelar</Link>
        </Button>
        <Button variant="default" type="submit" disabled={guardando}>
          {guardando
            ? "Guardando…"
            : esAlta
              ? "Crear usuario"
              : "Guardar cambios"}
        </Button>
      </div>
      <ConfirmarAccion
        abierto={pendiente !== null}
        onCerrar={() => setPendiente(null)}
        titulo={`¿Desactivar a ${usuario?.nombre ?? "este usuario"}?`}
        descripcion="Se cierran sus sesiones abiertas y no puede volver a entrar hasta que otro administrador lo reactive."
        accion="Desactivar"
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
