"use client";

import Link from "next/link";
import { useId } from "react";
import { CLASE_CAMPO } from "@/components/estilos";
import { Boton, variantesBoton } from "@/components/ui/boton";
import { importePositivo } from "@/lib/esquemas-comunes";
import { aCentavos, deCentavos, formatearMoneda } from "@/lib/moneda";
import { contar } from "@/lib/texto";
import { cn } from "@/lib/utils";
import {
  ETIQUETAS_FORMA_PAGO,
  ETIQUETAS_TIPO_TARJETA,
  MARCAS_TARJETA,
} from "@/lib/ventas/etiquetas";
import { calcularVuelto } from "@/lib/ventas/vuelto";
import { Dato, Seccion } from "./seccion-venta";

export type FormaPago = keyof typeof ETIQUETAS_FORMA_PAGO;

export type DatosTarjeta = {
  tipo: keyof typeof ETIQUETAS_TIPO_TARJETA;
  marca: string;
  ultimos4: string;
};

export type VentaConfirmada = { comprobante: string; vuelto: string | null };

const CLASE_ETIQUETA = "text-sm font-medium text-neutral-400";
const BORDE_CAMPO = "border-neutral-800";

export function ResumenVenta({
  unidades,
  total,
  formaPago,
  conCliente,
  montoRecibido,
  tarjeta,
  errores,
  confirmada,
  confirmando,
  onFormaPago,
  onMontoRecibido,
  onTarjeta,
  onConfirmar,
  className,
}: {
  unidades: number;
  total: number;
  formaPago: FormaPago;
  conCliente: boolean;
  montoRecibido: string;
  tarjeta: DatosTarjeta;
  errores: string[];
  confirmada: VentaConfirmada | null;
  confirmando: boolean;
  onFormaPago: (formaPago: FormaPago) => void;
  onMontoRecibido: (monto: string) => void;
  onTarjeta: (tarjeta: DatosTarjeta) => void;
  onConfirmar: () => void;
  className: string;
}) {
  const id = useId();
  const recibido = importePositivo.safeParse(montoRecibido);
  const vuelto =
    recibido.success && aCentavos(recibido.data) >= total
      ? calcularVuelto({ recibido: recibido.data, total: deCentavos(total) })
      : null;
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
                className={cn(
                  variantesBoton({
                    variante: elegida ? "secundario" : "texto",
                    enFormulario: true,
                  }),
                  `${elegida ? "" : "border border-transparent"} ${bloqueada ? "cursor-not-allowed opacity-60" : "cursor-pointer"} has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-verde`,
                )}
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
        {conCliente ? null : (
          <p className="text-sm text-neutral-500">
            Elegí un cliente registrado para usar cuenta corriente.
          </p>
        )}
      </fieldset>

      {formaPago === "contado" ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-recibido`} className={CLASE_ETIQUETA}>
            Monto recibido (opcional)
          </label>
          <input
            id={`${id}-recibido`}
            inputMode="decimal"
            value={montoRecibido}
            onChange={(evento) => onMontoRecibido(evento.target.value)}
            placeholder={formatearMoneda(deCentavos(total))}
            className={`${CLASE_CAMPO} ${BORDE_CAMPO}`}
          />
          <p className="text-sm text-neutral-500">
            {vuelto === null
              ? "Si lo dejás vacío, se toma el total."
              : `Vuelto: ${formatearMoneda(vuelto)}`}
          </p>
        </div>
      ) : null}

      {formaPago === "tarjeta" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-tipo`} className={CLASE_ETIQUETA}>
              Tipo
            </label>
            <select
              id={`${id}-tipo`}
              value={tarjeta.tipo}
              onChange={(evento) =>
                onTarjeta({
                  ...tarjeta,
                  tipo: evento.target.value as DatosTarjeta["tipo"],
                })
              }
              className={`${CLASE_CAMPO} ${BORDE_CAMPO}`}
            >
              {Object.entries(ETIQUETAS_TIPO_TARJETA).map(
                ([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-marca`} className={CLASE_ETIQUETA}>
              Marca
            </label>
            <input
              id={`${id}-marca`}
              list={`${id}-marcas`}
              value={tarjeta.marca}
              maxLength={30}
              onChange={(evento) =>
                onTarjeta({ ...tarjeta, marca: evento.target.value })
              }
              className={`${CLASE_CAMPO} ${BORDE_CAMPO}`}
            />
            <datalist id={`${id}-marcas`}>
              {MARCAS_TARJETA.map((marca) => (
                <option key={marca} value={marca} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-ultimos4`} className={CLASE_ETIQUETA}>
              Últimos 4 dígitos
            </label>
            <input
              id={`${id}-ultimos4`}
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={tarjeta.ultimos4}
              onChange={(evento) =>
                onTarjeta({
                  ...tarjeta,
                  ultimos4: evento.target.value.replace(/\D/g, ""),
                })
              }
              className={`${CLASE_CAMPO} ${BORDE_CAMPO}`}
            />
            <p className="text-sm text-neutral-500">
              Nunca se pide ni se guarda el número completo.
            </p>
          </div>
        </div>
      ) : null}

      {errores.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-2 text-sm text-red-400">
          {errores.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {confirmada === null ? null : (
        <p role="status" className="text-[0.9375rem]">
          Venta N.º {confirmada.comprobante} confirmada.
          {confirmada.vuelto === null
            ? ""
            : ` Vuelto: ${formatearMoneda(confirmada.vuelto)}.`}{" "}
          <Link href="/ventas" className="underline-offset-4 hover:underline">
            Ver ventas
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Boton
          variante="primario"
          enFormulario
          type="button"
          onClick={onConfirmar}
          disabled={confirmando}
        >
          {confirmando ? "Confirmando…" : "Confirmar venta"}
        </Boton>
        <p className="text-sm text-neutral-500">
          Al confirmar se verifican y descuentan las existencias.
        </p>
      </div>
    </Seccion>
  );
}
