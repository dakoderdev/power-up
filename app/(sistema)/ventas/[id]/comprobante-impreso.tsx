import { COMERCIO } from "@/lib/comercio";
import { formatearFechaHora } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/moneda";
import { formatearComprobante } from "@/lib/ventas/comprobante";
import type { VentaDetalle } from "@/lib/ventas/detalle";
import {
  ETIQUETA_ANULADA,
  ETIQUETAS_FORMA_PAGO,
  ETIQUETAS_TIPO_TARJETA,
} from "@/lib/ventas/etiquetas";
import { calcularVuelto } from "@/lib/ventas/vuelto";

const CELDA = "border-b border-neutral-300 py-2";

function datosPago(venta: VentaDetalle) {
  return [
    { termino: "Forma de pago", valor: ETIQUETAS_FORMA_PAGO[venta.formaPago] },
    ...(venta.tarjetaTipo
      ? [
          {
            termino: "Tarjeta",
            valor: `${ETIQUETAS_TIPO_TARJETA[venta.tarjetaTipo]} ${venta.tarjetaMarca} · terminada en ${venta.tarjetaUltimos4}`,
          },
        ]
      : []),
    ...(venta.montoRecibido
      ? [
          {
            termino: "Monto recibido",
            valor: formatearMoneda(venta.montoRecibido),
          },
          {
            termino: "Vuelto",
            valor: formatearMoneda(
              calcularVuelto({
                recibido: venta.montoRecibido,
                total: venta.total,
              }),
            ),
          },
        ]
      : []),
  ];
}

// RF-V7: vista imprimible con comercio, número, fecha y hora, vendedor,
// comprador, detalle, total y forma de pago.
export function ComprobanteImpreso({ venta }: { venta: VentaDetalle }) {
  const lineasComercio = [COMERCIO.domicilio, COMERCIO.telefono].filter(
    (linea) => linea !== "",
  );
  const comprador = venta.clienteDocumento
    ? `${venta.clienteNombre} · ${venta.clienteDocumento}`
    : venta.clienteNombre;

  return (
    <div className="imprimible hidden bg-white p-8 text-[0.9375rem] text-black print:block">
      <header className="flex flex-col gap-2 border-b border-black pb-4">
        <h1 className="text-sm font-medium uppercase">{COMERCIO.nombre}</h1>
        {lineasComercio.map((linea) => (
          <p key={linea} className="text-sm">
            {linea}
          </p>
        ))}
        <p className="text-sm">Comprobante interno, sin validez fiscal.</p>
      </header>

      <dl className="grid grid-cols-2 gap-4 py-4">
        <div className="flex flex-col gap-2">
          <dt className="text-sm text-neutral-600">Número</dt>
          <dd className="tabular-nums">N.º {formatearComprobante(venta)}</dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-sm text-neutral-600">Fecha y hora</dt>
          <dd className="tabular-nums">{formatearFechaHora(venta.creadoEn)}</dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-sm text-neutral-600">Vendedor</dt>
          <dd>{venta.vendedorNombre}</dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-sm text-neutral-600">Comprador</dt>
          <dd>{comprador}</dd>
        </div>
      </dl>

      {venta.anuladaEn ? (
        <p className="pb-4 text-sm font-medium uppercase">
          {ETIQUETA_ANULADA} el {formatearFechaHora(venta.anuladaEn)}
        </p>
      ) : null}

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-black text-sm">
            <th scope="col" className="py-2 pr-4 font-medium">
              Código
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Descripción
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              Cant.
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              Precio
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {venta.items.map((item) => (
            <tr key={item.id}>
              <td className={`${CELDA} pr-4`}>{item.codigo}</td>
              <td className={`${CELDA} pr-4`}>{item.descripcion}</td>
              <td className={`${CELDA} pr-4 text-right tabular-nums`}>
                {item.cantidad}
              </td>
              <td className={`${CELDA} pr-4 text-right tabular-nums`}>
                {formatearMoneda(item.precioUnitario)}
              </td>
              <td className={`${CELDA} text-right tabular-nums`}>
                {formatearMoneda(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={4} className="pt-4 text-right font-medium">
              Total
            </th>
            <td
              className={`pt-4 text-right font-medium tabular-nums ${venta.anuladaEn ? "line-through" : ""}`}
            >
              {formatearMoneda(venta.total)}
            </td>
          </tr>
        </tfoot>
      </table>

      <dl className="flex flex-col gap-2 pt-6">
        {datosPago(venta).map((dato) => (
          <div key={dato.termino} className="flex gap-4">
            <dt className="w-40 shrink-0 text-sm text-neutral-600">
              {dato.termino}
            </dt>
            <dd className="tabular-nums">{dato.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
