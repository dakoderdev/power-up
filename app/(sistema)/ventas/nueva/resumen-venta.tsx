"use client";

import Link from "next/link";
import { claseBoton } from "@/components/estilos";
import { deCentavos, formatearMoneda } from "@/lib/moneda";
import { contar } from "@/lib/texto";
import { ETIQUETAS_FORMA_PAGO } from "@/lib/ventas/etiquetas";
import { Dato, Seccion } from "./seccion-venta";

export type FormaPago = keyof typeof ETIQUETAS_FORMA_PAGO;

export function ResumenVenta({
  unidades,
  total,
  formaPago,
  conCliente,
  errores,
  confirmada,
  confirmando,
  onFormaPago,
  onConfirmar,
  className,
}: {
  unidades: number;
  total: number;
  formaPago: FormaPago;
  conCliente: boolean;
  errores: string[];
  confirmada: string | null;
  confirmando: boolean;
  onFormaPago: (formaPago: FormaPago) => void;
  onConfirmar: () => void;
  className: string;
}) {
  return (
    <Seccion titulo="Resumen" className={className}>
      <dl className="flex flex-col gap-3 text-[0.9375rem]">
        <Dato etiqueta="Productos">
          {contar({
            cantidad: unidades,
            singular: "unidad",
            plural: "unidades",
          })}
        </Dato>
        <Dato etiqueta="Subtotal">{formatearMoneda(deCentavos(total))}</Dato>
        <div className="flex items-baseline justify-between gap-6 border-t border-neutral-900 pt-3 font-medium">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatearMoneda(deCentavos(total))}</dd>
        </div>
      </dl>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[0.9375rem] font-medium">
          Forma de pago
        </legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ETIQUETAS_FORMA_PAGO).map(([valor, etiqueta]) => {
            const elegida = formaPago === valor;
            const bloqueada = valor === "cuenta_corriente" && !conCliente;

            return (
              <label
                key={valor}
                className={`${claseBoton({ variante: elegida ? "secundario" : "texto", enFormulario: true })} ${elegida ? "" : "border border-transparent"} ${bloqueada ? "cursor-not-allowed opacity-60" : "cursor-pointer"} has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-verde`}
              >
                <input
                  type="radio"
                  name="formaPago"
                  value={valor}
                  checked={elegida}
                  disabled={bloqueada}
                  onChange={() => onFormaPago(valor as FormaPago)}
                  className="sr-only"
                />
                {etiqueta}
              </label>
            );
          })}
        </div>
        {formaPago === "tarjeta" ? (
          <p className="text-sm text-neutral-500">
            Pago simulado: no se piden datos de la tarjeta.
          </p>
        ) : conCliente ? null : (
          <p className="text-sm text-neutral-500">
            Elegí un cliente registrado para usar cuenta corriente.
          </p>
        )}
      </fieldset>

      {errores.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-2 text-sm text-red-400">
          {errores.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {confirmada === null ? null : (
        <p role="status" className="text-[0.9375rem]">
          Venta N.º {confirmada} confirmada.{" "}
          <Link href="/ventas" className="underline-offset-4 hover:underline">
            Ver ventas
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onConfirmar}
          disabled={confirmando}
          className={claseBoton({ variante: "primario", enFormulario: true })}
        >
          {confirmando ? "Confirmando…" : "Confirmar venta"}
        </button>
        <p className="text-sm text-neutral-500">
          Al confirmar se verifican y descuentan las existencias.
        </p>
      </div>
    </Seccion>
  );
}
