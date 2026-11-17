import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown } from "pixelarticons/react/ChevronDown.js";
import { claseBoton, CLASE_CAMPO } from "@/components/estilos";
import { FORMAS_PAGO } from "@/lib/db/schema";
import { ETIQUETAS_FORMA_PAGO } from "@/lib/ventas/etiquetas";
import type { ValoresFiltro } from "@/lib/ventas/filtros";

type Opcion = { valor: string; etiqueta: string };

const ESTADOS: Opcion[] = [
  { valor: "emitida", etiqueta: "Emitidas" },
  { valor: "anulada", etiqueta: "Anuladas" },
];

function Campo({
  etiqueta,
  nombre,
  claseExtra = "",
  children,
}: {
  etiqueta: string;
  nombre: string;
  claseExtra?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 ${claseExtra}`}>
      <label htmlFor={nombre} className="text-sm text-neutral-400">
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

function Selector({
  etiqueta,
  nombre,
  valor,
  opciones,
}: {
  etiqueta: string;
  nombre: string;
  valor: string;
  opciones: Opcion[];
}) {
  return (
    <Campo etiqueta={etiqueta} nombre={nombre}>
      <div className="relative">
        <select
          id={nombre}
          name={nombre}
          defaultValue={valor}
          className={`${CLASE_CAMPO} w-full appearance-none pr-10`}
        >
          <option value="">Todos</option>
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-neutral-400"
        />
      </div>
    </Campo>
  );
}

export function FiltrosVentas({
  valores,
  activos,
  vendedores,
  clientes,
}: {
  valores: ValoresFiltro;
  activos: boolean;
  vendedores: { id: string; nombre: string }[];
  clientes: { id: number; nombre: string }[];
}) {
  return (
    <form
      key={JSON.stringify(valores)}
      method="get"
      action="/ventas"
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <Campo etiqueta="Buscar" nombre="q" claseExtra="lg:col-span-2">
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={valores.q}
            placeholder="Número o nombre del cliente"
            autoComplete="off"
            className={`${CLASE_CAMPO} w-full`}
          />
        </Campo>
        <Campo etiqueta="Desde" nombre="desde">
          <input
            id="desde"
            name="desde"
            type="date"
            defaultValue={valores.desde}
            className={`${CLASE_CAMPO} w-full`}
          />
        </Campo>
        <Campo etiqueta="Hasta" nombre="hasta">
          <input
            id="hasta"
            name="hasta"
            type="date"
            defaultValue={valores.hasta}
            className={`${CLASE_CAMPO} w-full`}
          />
        </Campo>
        <Selector
          etiqueta="Cliente"
          nombre="cliente"
          valor={valores.cliente}
          opciones={clientes.map((cliente) => ({
            valor: String(cliente.id),
            etiqueta: cliente.nombre,
          }))}
        />
        <Selector
          etiqueta="Vendedor"
          nombre="vendedor"
          valor={valores.vendedor}
          opciones={vendedores.map((vendedor) => ({
            valor: vendedor.id,
            etiqueta: vendedor.nombre,
          }))}
        />
        <Selector
          etiqueta="Forma de pago"
          nombre="forma"
          valor={valores.forma}
          opciones={FORMAS_PAGO.map((forma) => ({
            valor: forma,
            etiqueta: ETIQUETAS_FORMA_PAGO[forma],
          }))}
        />
        <Selector
          etiqueta="Estado"
          nombre="estado"
          valor={valores.estado}
          opciones={ESTADOS}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className={claseBoton({ variante: "primario", enFormulario: true })}
        >
          Filtrar
        </button>
        {activos ? (
          <Link
            href="/ventas"
            className={claseBoton({ variante: "texto", enFormulario: true })}
          >
            Limpiar filtros
          </Link>
        ) : null}
      </div>
    </form>
  );
}
