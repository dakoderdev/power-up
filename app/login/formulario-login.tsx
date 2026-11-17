"use client";

import { useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { CLASE_CAMPO } from "@/components/estilos";
import { Boton } from "@/components/ui/boton";
import { iniciarSesion } from "./actions";

const FORMATO_CORREO = /^\S+@\S+\.\S{2,}$/;
const BLOQUES_CAMPO = 10;
const BLOQUES_TOTAL = BLOQUES_CAMPO * 2;
const LARGO_CLAVE = 8;

type Errores = {
  correo?: string;
  clave?: string;
};

function progresoCorreo(correo: string) {
  const texto = correo.trim();
  const [usuario, dominio] = texto.split("@");

  if (FORMATO_CORREO.test(texto)) {
    return BLOQUES_CAMPO;
  }

  return dominio === undefined
    ? Math.min(usuario.length, 4)
    : Math.min(5 + dominio.length, BLOQUES_CAMPO - 1);
}

function progresoClave(clave: string) {
  return Math.min(
    BLOQUES_CAMPO,
    Math.ceil((clave.length * BLOQUES_CAMPO) / LARGO_CLAVE),
  );
}

function validar({ correo, clave }: { correo: string; clave: string }) {
  const errores: Errores = {};

  if (!correo.trim()) {
    errores.correo = "Ingresá tu correo.";
  } else if (!FORMATO_CORREO.test(correo.trim())) {
    errores.correo = "Revisá el correo: falta el @ o el dominio.";
  }

  if (!clave) {
    errores.clave = "Ingresá tu contraseña.";
  }

  return errores;
}

export function FormularioLogin() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [visible, setVisible] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [pendiente, iniciar] = useTransition();
  const campoCorreo = useRef<HTMLInputElement>(null);
  const campoClave = useRef<HTMLInputElement>(null);

  const llenos = progresoCorreo(correo) + progresoClave(clave);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = validar({ correo, clave });
    setErrores(encontrados);
    setErrorGeneral("");

    if (encontrados.correo) {
      campoCorreo.current?.focus();
    } else if (encontrados.clave) {
      campoClave.current?.focus();
    } else {
      iniciar(async () => {
        const respuesta = await iniciarSesion({ correo, clave });

        if (respuesta?.error) {
          setErrorGeneral(respuesta.error);
        }
      });
    }
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="@container flex flex-col gap-6"
    >
      <div className="grid items-start gap-6 @lg:grid-cols-2 @lg:gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="correo"
            className="text-sm font-medium text-neutral-200"
          >
            Correo electrónico
          </label>
          <input
            ref={campoCorreo}
            id="correo"
            name="correo"
            type="email"
            autoComplete="username"
            placeholder="nombre@comercio.com"
            value={correo}
            onChange={(evento) => {
              setCorreo(evento.target.value);
              setErrores({ ...errores, correo: undefined });
            }}
            aria-invalid={errores.correo ? true : undefined}
            aria-describedby={errores.correo ? "error-correo" : undefined}
            className={`${CLASE_CAMPO} ${errores.correo ? "border-red-400" : "border-neutral-800"}`}
          />
          {errores.correo ? (
            <p id="error-correo" className="text-sm text-red-400">
              {errores.correo}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="clave"
            className="text-sm font-medium text-neutral-200"
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              ref={campoClave}
              id="clave"
              name="clave"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              value={clave}
              onChange={(evento) => {
                setClave(evento.target.value);
                setErrores({ ...errores, clave: undefined });
              }}
              aria-invalid={errores.clave ? true : undefined}
              aria-describedby={errores.clave ? "error-clave" : undefined}
              className={`${CLASE_CAMPO} pr-20 ${errores.clave ? "border-red-400" : "border-neutral-800"}`}
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              aria-pressed={visible}
              aria-controls="clave"
              className="absolute inset-y-0 right-0 px-3 text-sm text-neutral-400 transition-colors hover:text-white"
            >
              {visible ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {errores.clave ? (
            <p id="error-clave" className="text-sm text-red-400">
              {errores.clave}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <div aria-hidden="true" className="flex h-1.5 gap-0.5">
          {Array.from({ length: BLOQUES_TOTAL }, (_, indice) => (
            <span
              key={indice}
              className={`flex-1 transition-colors duration-200 ${indice < llenos ? "bg-verde" : "bg-neutral-800"}`}
            />
          ))}
        </div>
        {errorGeneral ? (
          <p role="alert" className="text-sm text-red-400">
            {errorGeneral}
          </p>
        ) : null}
        <Boton
          variante="primario"
          enFormulario
          type="submit"
          disabled={pendiente}
          className="w-full"
        >
          {pendiente ? "Ingresando…" : "Ingresar"}
        </Boton>
      </div>
    </form>
  );
}
