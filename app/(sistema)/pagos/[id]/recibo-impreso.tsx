import { COMERCIO } from "@/lib/comercio";
import { formatearRecibo } from "@/lib/cuentas/recibo";
import type { PagoDetalle } from "@/lib/cuentas/pagar";
import { formatearFechaHora } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/moneda";

// RF-C5: recibo imprimible con comercio, número, fecha y hora, cliente, importe y usuario.
export function ReciboImpreso({
  pago,
  numero,
}: {
  pago: PagoDetalle;
  numero: number;
}) {
  const lineasComercio = [COMERCIO.domicilio, COMERCIO.telefono].filter(
    (linea) => linea !== "",
  );
  const datos = [
    { termino: "Número", valor: `N.º ${formatearRecibo(numero)}` },
    { termino: "Fecha y hora", valor: formatearFechaHora(pago.fecha) },
    { termino: "Cliente", valor: pago.clienteNombre },
    { termino: "Recibido por", valor: pago.usuarioNombre },
  ];

  return (
    <div className="imprimible hidden bg-white p-8 text-[0.9375rem] text-black print:block">
      <header className="flex flex-col gap-2 border-b border-black pb-4">
        <h1 className="text-sm font-medium uppercase">{COMERCIO.nombre}</h1>
        {lineasComercio.map((linea) => (
          <p key={linea} className="text-sm">
            {linea}
          </p>
        ))}
        <p className="text-sm font-medium uppercase">Recibo de pago</p>
        <p className="text-sm">Comprobante interno, sin validez fiscal.</p>
      </header>

      <dl className="grid grid-cols-2 gap-4 py-4">
        {datos.map((dato) => (
          <div key={dato.termino} className="flex flex-col gap-2">
            <dt className="text-sm text-neutral-600">{dato.termino}</dt>
            <dd className="tabular-nums">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      <div className="flex items-baseline justify-between border-y border-black py-4">
        <span className="font-medium">Importe recibido</span>
        <span className="text-xl font-medium tabular-nums">
          {formatearMoneda(pago.importe)}
        </span>
      </div>

      <dl className="flex flex-col gap-2 pt-6">
        {pago.observacion ? (
          <div className="flex gap-4">
            <dt className="w-40 shrink-0 text-sm text-neutral-600">
              Observación
            </dt>
            <dd>{pago.observacion}</dd>
          </div>
        ) : null}
        <div className="flex gap-4">
          <dt className="w-40 shrink-0 text-sm text-neutral-600">
            Saldo actual
          </dt>
          <dd className="tabular-nums">{formatearMoneda(pago.saldoCliente)}</dd>
        </div>
      </dl>
    </div>
  );
}
