"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { CLASE_CAMPO } from "@/components/estilos";
import { Boton } from "@/components/ui/boton";
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
      <div className="flex flex-col gap-2">
        <label
          htmlFor={idCampo}
          className="text-sm font-medium text-neutral-400"
        >
          {etiqueta}
        </label>
        <input
          id={idCampo}
          name={nombre}
          type={tipo}
          autoComplete={autoComplete}
          autoFocus={esAlta && nombre === "nombre"}
          defaultValue={valor}
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

        <div className="flex flex-col gap-2">
          <label
            htmlFor={`${id}-rol`}
            className="text-sm font-medium text-neutral-400"
          >
            Rol
          </label>
          <select
            id={`${id}-rol`}
            value={rol}
            onChange={(evento) =>
              setRol(evento.target.value as (typeof ROLES)[number])
            }
            disabled={esActual}
            aria-invalid={Boolean(errorRol)}
            className={`${CLASE_CAMPO} border-neutral-800 disabled:text-neutral-400`}
          >
            {ROLES.map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETAS_ROL[valor]}
              </option>
            ))}
          </select>
          {errorRol ? <p className="text-sm text-red-400">{errorRol}</p> : null}
        </div>

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
        <label className="flex items-center gap-3 text-[0.9375rem] text-white">
          <input
            type="checkbox"
            checked={activo}
            onChange={(evento) => setActivo(evento.target.checked)}
            disabled={esActual}
            className="size-5 accent-verde"
          />
          Usuario activo
        </label>
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
        <Boton asChild variante="texto" enFormulario>
          <Link href="/usuarios">Cancelar</Link>
        </Boton>
        <Boton
          variante="primario"
          enFormulario
          type="submit"
          disabled={guardando}
        >
          {guardando
            ? "Guardando…"
            : esAlta
              ? "Crear usuario"
              : "Guardar cambios"}
        </Boton>
      </div>
    </form>
  );
}
