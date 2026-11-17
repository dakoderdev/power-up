"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
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
import type { ErroresUsuario } from "@/lib/usuarios/guardar";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";

const ETIQUETAS_ROL = {
  admin: "Administrador",
  operator: "Operador",
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
  const [errores, setErrores] = useState<ErroresUsuario>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, iniciarGuardado] = useTransition();

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const nombre = String(formulario.get("nombre") ?? "");
    const correo = String(formulario.get("correo") ?? "");

    setErrores({});
    setMensaje(null);

    if (usuario === undefined) {
      const contrasena = String(formulario.get("contrasena") ?? "");
      const validacion = esquemaUsuarioNuevo.safeParse({
        nombre,
        correo,
        rol,
        contrasena,
      });

      if (!validacion.success) {
        setErrores(z.flattenError(validacion.error).fieldErrors);
        return;
      }

      iniciarGuardado(async () => {
        const respuesta = await crearUsuarioAccion(validacion.data);

        if (respuesta.creado) {
          router.push("/usuarios");
          return;
        }

        setErrores(respuesta.errores);
      });
      return;
    }

    const validacion = esquemaUsuarioEdicion.safeParse({
      nombre,
      correo,
      rol,
      activo,
    });

    if (!validacion.success) {
      setErrores(z.flattenError(validacion.error).fieldErrors);
      return;
    }

    iniciarGuardado(async () => {
      const respuesta = await editarUsuarioAccion({
        id: usuario.id,
        datos: validacion.data,
      });

      if (respuesta.guardado) {
        router.push("/usuarios");
        return;
      }

      setErrores(respuesta.errores);
      setMensaje(respuesta.mensaje ?? null);
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
            className="text-[0.9375rem] font-normal text-white"
          >
            Usuario activo
          </FieldLabel>
        </Field>
      )}

      <p className="text-sm text-neutral-500">
        {esAlta
          ? "La contraseña tiene al menos 8 caracteres. Pasásela al usuario por un canal seguro."
          : esActual
            ? "No podés cambiar tu propio rol ni desactivarte. Lo hace otro administrador."
            : "Al desactivar un usuario se cierran sus sesiones abiertas."}
      </p>

      {mensaje ? (
        <p role="alert" className="text-sm text-red-400">
          {mensaje}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="ghost" size="lg">
          <Link href="/usuarios">Cancelar</Link>
        </Button>
        <Button variant="default" size="lg" type="submit" disabled={guardando}>
          {guardando
            ? "Guardando…"
            : esAlta
              ? "Crear usuario"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
