import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { claseBoton } from "@/components/estilos";
import { obtenerPago, type PagoDetalle } from "@/lib/cuentas/pagar";
import { formatearRecibo } from "@/lib/cuentas/recibo";
import { idPositivo } from "@/lib/esquemas-comunes";
import { formatearFechaHora } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/moneda";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { BotonImprimir } from "./boton-imprimir";
import { ReciboImpreso } from "./recibo-impreso";

export const metadata: Metadata = {
  title: "Recibo · Power Up",
};

export default function Recibo({ params }: PageProps<"/pagos/[id]">) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Recibo">
        Constancia del pago registrado en la cuenta corriente.
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
  await obtenerUsuarioActual();
  const idValido = idPositivo.safeParse(Number(id));
  const pago = idValido.success ? await obtenerPago(idValido.data) : null;

  if (!pago || pago.reciboNumero === null) {
    notFound();
  }

  return (
    <>
      <div className="flex max-w-4xl flex-col gap-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/clientes/${pago.clienteId}`}
            className={claseBoton({ variante: "texto" })}
          >
            Volver al cliente
          </Link>
          <BotonImprimir />
        </div>
        <Datos pago={pago} numero={pago.reciboNumero} />
      </div>
      <ReciboImpreso pago={pago} numero={pago.reciboNumero} />
    </>
  );
}

function Datos({ pago, numero }: { pago: PagoDetalle; numero: number }) {
  const datos = [
    { termino: "Número", valor: `N.º ${formatearRecibo(numero)}` },
    { termino: "Fecha", valor: formatearFechaHora(pago.fecha) },
    { termino: "Cliente", valor: pago.clienteNombre },
    { termino: "Recibido por", valor: pago.usuarioNombre },
    { termino: "Importe", valor: formatearMoneda(pago.importe) },
    { termino: "Saldo actual", valor: formatearMoneda(pago.saldoCliente) },
    ...(pago.observacion
      ? [{ termino: "Observación", valor: pago.observacion }]
      : []),
  ];

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {datos.map((dato) => (
        <div key={dato.termino} className="flex flex-col gap-2">
          <dt className="text-sm text-neutral-400">{dato.termino}</dt>
          <dd className="tabular-nums text-white">{dato.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
