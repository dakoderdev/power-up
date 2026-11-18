import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import {
  Columna,
  Dato,
  Fila,
  ListaDatos,
  Pagina,
} from "@/components/maquetacion";
import { Button } from "@/components/ui/button";
import { obtenerPago, type PagoDetalle } from "@/lib/cuentas/pagar";
import { etiquetaMedio } from "@/lib/cuentas/etiquetas";
import { formatearRecibo } from "@/lib/cuentas/recibo";
import { idPositivo } from "@/lib/esquemas-comunes";
import { formatearFechaHora } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/moneda";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { BotonImprimir } from "./boton-imprimir";
import { ReciboImpreso } from "./recibo-impreso";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Recibo · Power Up",
};

export default function Recibo({ params }: PageProps<"/pagos/[id]">) {
  return (
    <Pagina>
      <EncabezadoPagina titulo="Recibo">
        Constancia del pago registrado en la cuenta corriente.
      </EncabezadoPagina>

      <Suspense fallback={<Skeleton aria-hidden="true" className="h-96" />}>
        <Detalle params={params} />
      </Suspense>
    </Pagina>
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
      <Columna>
        <Fila className="flex-wrap justify-between gap-4">
          <Button asChild variant="ghost">
            <Link href={`/clientes/${pago.clienteId}`}>Volver al cliente</Link>
          </Button>
          <BotonImprimir />
        </Fila>
        <Datos pago={pago} numero={pago.reciboNumero} />
      </Columna>
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
    { termino: "Medio", valor: etiquetaMedio(pago.medio) },
    { termino: "Saldo actual", valor: formatearMoneda(pago.saldoCliente) },
    ...(pago.observacion
      ? [{ termino: "Observación", valor: pago.observacion }]
      : []),
  ];

  return (
    <ListaDatos>
      {datos.map((dato) => (
        <Dato
          key={dato.termino}
          termino={dato.termino}
          className="tabular-nums"
        >
          {dato.valor}
        </Dato>
      ))}
    </ListaDatos>
  );
}
