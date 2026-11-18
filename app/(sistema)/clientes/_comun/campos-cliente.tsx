"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { TIPOS_DOCUMENTO } from "@/lib/db/schema";
import type { TipoDocumento } from "@/lib/documento";

type Campo =
  | "nombre"
  | "tipoDoc"
  | "documento"
  | "domicilio"
  | "telefono"
  | "email"
  | "cuentaCorriente"
  | "limiteCredito";

export type ErroresCampos = Partial<Record<Campo, string[]>>;

export type ValoresCliente = {
  nombre: string;
  tipoDoc: TipoDocumento;
  documento: string;
  domicilio: string | null;
  telefono: string | null;
  email: string | null;
  cuentaCorriente: boolean;
  limiteCredito: string | null;
};

const TEXTOS: {
  nombre: Exclude<Campo, "tipoDoc" | "cuentaCorriente" | "limiteCredito">;
  etiqueta: string;
  tipo: string;
  modo?: "numeric";
  completo?: boolean;
}[] = [
  {
    nombre: "nombre",
    etiqueta: "Nombre o razón social",
    tipo: "text",
    completo: true,
  },
  { nombre: "documento", etiqueta: "Número", tipo: "text", modo: "numeric" },
  {
    nombre: "domicilio",
    etiqueta: "Domicilio (opcional)",
    tipo: "text",
    completo: true,
  },
  { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel" },
  { nombre: "email", etiqueta: "Correo", tipo: "email" },
];

// RF-C2: lee los campos del cliente del formulario, con los nombres del esquema compartido.
export function leerCliente(formulario: FormData) {
  const texto = (campo: Campo) => String(formulario.get(campo) ?? "");
  const cuentaCorriente = formulario.get("cuentaCorriente") === "on";

  return {
    nombre: texto("nombre"),
    tipoDoc: texto("tipoDoc"),
    documento: texto("documento"),
    domicilio: texto("domicilio"),
    telefono: texto("telefono"),
    email: texto("email"),
    cuentaCorriente,
    limiteCredito: cuentaCorriente ? texto("limiteCredito") : "",
  };
}

function ErrorCampo({ id, errores }: { id: string; errores?: string[] }) {
  return errores?.[0] ? <FieldError id={id}>{errores[0]}</FieldError> : null;
}

export function CamposCliente({
  id,
  errores,
  cliente,
  enfocar = false,
}: {
  id: string;
  errores: ErroresCampos;
  cliente?: ValoresCliente;
  enfocar?: boolean;
}) {
  const [cuenta, setCuenta] = useState(cliente?.cuentaCorriente ?? false);
  const describir = (campo: Campo) =>
    errores[campo]?.[0] ? `${id}-${campo}-error` : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {TEXTOS.map((campo) => (
        <Field
          key={campo.nombre}
          className={campo.completo ? "sm:col-span-full" : ""}
        >
          {campo.nombre === "documento" ? (
            <FieldLabel htmlFor={`${id}-documento`}>Documento</FieldLabel>
          ) : (
            <FieldLabel htmlFor={`${id}-${campo.nombre}`}>
              {campo.etiqueta}
            </FieldLabel>
          )}
          {campo.nombre === "documento" ? (
            <div className="flex gap-2">
              <NativeSelect
                name="tipoDoc"
                defaultValue={cliente?.tipoDoc ?? "DNI"}
                aria-label="Tipo de documento"
                aria-invalid={Boolean(errores.tipoDoc?.[0])}
                className="w-24"
              >
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <NativeSelectOption key={tipo} value={tipo}>
                    {tipo}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Input
                id={`${id}-documento`}
                name="documento"
                inputMode="numeric"
                defaultValue={cliente?.documento ?? ""}
                aria-invalid={Boolean(errores.documento?.[0])}
                aria-describedby={describir("documento")}
                className="tabular-nums"
              />
            </div>
          ) : (
            <Input
              id={`${id}-${campo.nombre}`}
              name={campo.nombre}
              type={campo.tipo}
              inputMode={campo.modo}
              autoFocus={enfocar && campo.nombre === "nombre"}
              defaultValue={cliente?.[campo.nombre] ?? ""}
              aria-invalid={Boolean(errores[campo.nombre]?.[0])}
              aria-describedby={describir(campo.nombre)}
            />
          )}
          <ErrorCampo
            id={`${id}-${campo.nombre}-error`}
            errores={errores[campo.nombre]}
          />
        </Field>
      ))}

      <Field orientation="horizontal" className="sm:col-span-full">
        <Checkbox
          id={`${id}-cuentaCorriente`}
          name="cuentaCorriente"
          checked={cuenta}
          onCheckedChange={(valor) => setCuenta(valor === true)}
          aria-invalid={Boolean(errores.cuentaCorriente?.[0])}
          aria-describedby={describir("cuentaCorriente")}
        />
        <FieldLabel htmlFor={`${id}-cuentaCorriente`}>
          Habilitado para cuenta corriente
        </FieldLabel>
      </Field>
      <ErrorCampo
        id={`${id}-cuentaCorriente-error`}
        errores={errores.cuentaCorriente}
      />

      {cuenta ? (
        <Field className="sm:col-span-full">
          <FieldLabel htmlFor={`${id}-limiteCredito`}>
            Límite de crédito (opcional)
          </FieldLabel>
          <Input
            id={`${id}-limiteCredito`}
            name="limiteCredito"
            inputMode="decimal"
            placeholder="150000"
            defaultValue={cliente?.limiteCredito?.replace(".", ",") ?? ""}
            aria-invalid={Boolean(errores.limiteCredito?.[0])}
            aria-describedby={describir("limiteCredito")}
            className="tabular-nums sm:max-w-xs"
          />
          <FieldDescription>
            Sin límite, la cuenta no tiene tope.
          </FieldDescription>
          <ErrorCampo
            id={`${id}-limiteCredito-error`}
            errores={errores.limiteCredito}
          />
        </Field>
      ) : null}
    </div>
  );
}
