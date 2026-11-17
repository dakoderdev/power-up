import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FORMAS_PAGO } from "@/lib/db/schema";
import { ETIQUETAS_FORMA_PAGO } from "@/lib/ventas/etiquetas";
import type { ValoresFiltro } from "@/lib/ventas/filtros";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Field, FieldLabel } from "@/components/ui/field";

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
    <Field className={claseExtra}>
      <FieldLabel htmlFor={nombre} className="font-normal">
        {etiqueta}
      </FieldLabel>
      {children}
    </Field>
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
      <NativeSelect id={nombre} name={nombre} defaultValue={valor}>
        <NativeSelectOption value="">Todos</NativeSelectOption>
        {opciones.map((opcion) => (
          <NativeSelectOption key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </NativeSelectOption>
        ))}
      </NativeSelect>
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
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={valores.q}
            placeholder="Número o nombre del cliente"
            autoComplete="off"
          />
        </Campo>
        <Campo etiqueta="Desde" nombre="desde">
          <Input
            id="desde"
            name="desde"
            type="date"
            defaultValue={valores.desde}
          />
        </Campo>
        <Campo etiqueta="Hasta" nombre="hasta">
          <Input
            id="hasta"
            name="hasta"
            type="date"
            defaultValue={valores.hasta}
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
        <Button variant="default" size="lg" type="submit">
          Filtrar
        </Button>
        {activos ? (
          <Button asChild variant="ghost" size="lg">
            <Link href="/ventas">Limpiar filtros</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
