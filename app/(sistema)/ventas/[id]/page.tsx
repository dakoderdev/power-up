import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CLASE_BADGE, CLASE_FILA } from "@/components/estilos";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { idPositivo } from "@/lib/esquemas-comunes";
import { formatearFechaHora } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/moneda";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { formatearComprobante } from "@/lib/ventas/comprobante";
import { obtenerVenta, type VentaDetalle } from "@/lib/ventas/detalle";
import {
  COLORES_FORMA_PAGO,
  ETIQUETA_ANULADA,
  ETIQUETAS_FORMA_PAGO,
} from "@/lib/ventas/etiquetas";
import { AnularVenta } from "./anular-venta";

export const metadata: Metadata = {
  title: "Comprobante · Power Up",
};

const SOLO_ESCRITORIO = "hidden sm:table-cell";

const COLUMNAS = [
  { titulo: "Código", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Descripción", clase: "pr-3 sm:pr-6" },
  { titulo: "Cantidad", clase: "w-px pr-3 text-right sm:pr-6" },
  { titulo: "Precio", clase: `w-px pr-6 text-right ${SOLO_ESCRITORIO}` },
  { titulo: "Subtotal", clase: "w-px text-right" },
];

export default function Comprobante({ params }: PageProps<"/ventas/[id]">) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Comprobante">
        Copia de la venta tal como se confirmó.
      </EncabezadoPagina>

      <Suspense
        fallback={<div aria-hidden="true" className="esqueleto h-96" />}
      >
        <Detalle params={params} />
      </Suspense>
    </div>
  );
}

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await obtenerUsuarioActual();
  const idValido = idPositivo.safeParse(Number(id));
  const venta = idValido.success ? await obtenerVenta(idValido.data) : null;

  if (!venta) {
    notFound();
  }

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <Datos venta={venta} />
      <Items venta={venta} />
      {venta.anuladaEn ? (
        <Anulacion venta={venta} />
      ) : usuario.esAdministrador ? (
        <AnularVenta ventaId={venta.id} />
      ) : null}
    </div>
  );
}

function Datos({ venta }: { venta: VentaDetalle }) {
  const datos = [
    { termino: "Número", valor: `N.º ${formatearComprobante(venta)}` },
    { termino: "Fecha", valor: formatearFechaHora(venta.creadoEn) },
    {
      termino: "Cliente",
      valor: venta.clienteDocumento
        ? `${venta.clienteNombre} · ${venta.clienteDocumento}`
        : venta.clienteNombre,
    },
  ];

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {datos.map((dato) => (
        <div key={dato.termino} className="flex flex-col gap-2">
          <dt className="text-sm text-neutral-400">{dato.termino}</dt>
          <dd className="tabular-nums text-white">{dato.valor}</dd>
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <dt className="text-sm text-neutral-400">Forma de pago</dt>
        <dd className="flex gap-2">
          <span
            className={`${CLASE_BADGE} ${COLORES_FORMA_PAGO[venta.formaPago]}`}
          >
            {ETIQUETAS_FORMA_PAGO[venta.formaPago]}
          </span>
          {venta.anuladaEn ? (
            <span className={`${CLASE_BADGE} text-neutral-400`}>
              {ETIQUETA_ANULADA}
            </span>
          ) : null}
        </dd>
      </div>
    </dl>
  );
}

function Items({ venta }: { venta: VentaDetalle }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full whitespace-nowrap text-left text-[0.9375rem]">
        <thead>
          <tr className="border-b border-neutral-900">
            {COLUMNAS.map((columna) => (
              <th
                key={columna.titulo}
                scope="col"
                className={`h-9 text-sm font-medium text-neutral-400 ${columna.clase}`}
              >
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {venta.items.map((item) => (
            <tr key={item.id} className={CLASE_FILA}>
              <td className={`pr-6 text-neutral-300 ${SOLO_ESCRITORIO}`}>
                {item.codigo}
              </td>
              <td className="max-w-40 truncate pr-3 text-white sm:max-w-96 sm:pr-6">
                {item.descripcion}
              </td>
              <td className="pr-3 text-right tabular-nums text-neutral-300 sm:pr-6">
                {item.cantidad}
              </td>
              <td
                className={`pr-6 text-right tabular-nums text-neutral-300 ${SOLO_ESCRITORIO}`}
              >
                {formatearMoneda(item.precioUnitario)}
              </td>
              <td className="text-right tabular-nums text-white">
                {formatearMoneda(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="h-11 border-t border-neutral-800">
            <th
              scope="row"
              colSpan={COLUMNAS.length - 1}
              className="text-right font-medium text-neutral-400"
            >
              Total
            </th>
            <td
              className={`text-right font-medium tabular-nums ${venta.anuladaEn ? "text-neutral-400 line-through" : "text-white"}`}
            >
              {formatearMoneda(venta.total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Anulacion({ venta }: { venta: VentaDetalle }) {
  return (
    <section className="flex flex-col gap-4 border-t border-neutral-900 pt-10">
      <h2 className="font-pixel text-3xl leading-none tracking-[-0.01em]">
        Anulación
      </h2>
      <p className="text-[0.9375rem] text-neutral-300">
        Anulada el {formatearFechaHora(venta.anuladaEn!)} por{" "}
        {venta.anuladaPor ?? "un usuario"}. Motivo: {venta.motivoAnulacion}
      </p>
      <p className="text-sm text-neutral-400">
        El stock se devolvió y, si fue en cuenta corriente, el total se restó
        del saldo del cliente.
      </p>
    </section>
  );
}
