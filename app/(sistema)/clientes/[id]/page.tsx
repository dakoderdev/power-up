import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Pencil } from "pixelarticons/react/Pencil.js";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { CLASE_BADGE, CLASE_FILA, claseBoton } from "@/components/estilos";
import { Vacio } from "@/components/vacio";
import {
  obtenerCliente,
  obtenerCuenta,
  type ClienteDetalle,
  type CuentaCliente,
} from "@/lib/clientes/detalle";
import { ETIQUETAS_TIPO_CUENTA } from "@/lib/cuentas/etiquetas";
import { formatearRecibo } from "@/lib/cuentas/recibo";
import { idPositivo } from "@/lib/esquemas-comunes";
import { formatearFechaHora } from "@/lib/fechas";
import { aCentavos, formatearMoneda } from "@/lib/moneda";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { formatearComprobante } from "@/lib/ventas/comprobante";
import { RegistrarPago } from "./registrar-pago";

export const metadata: Metadata = {
  title: "Cliente · Power Up",
};

const SOLO_ESCRITORIO = "hidden sm:table-cell";

const COLUMNAS = [
  { titulo: "Fecha", clase: "w-px pr-3 sm:pr-6" },
  { titulo: "Movimiento", clase: "pr-3 sm:pr-6" },
  { titulo: "Importe", clase: "w-px pr-3 text-right sm:pr-6" },
  { titulo: "Saldo", clase: `w-px text-right ${SOLO_ESCRITORIO}` },
];

const CLASE_H2 = "font-pixel text-3xl leading-none tracking-[-0.01em]";

export default function Cliente({ params }: PageProps<"/clientes/[id]">) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Cliente">
        Datos de contacto y cuenta corriente.
      </EncabezadoPagina>

      <Suspense
        fallback={
          <div aria-hidden="true" className="esqueleto h-96 max-w-4xl" />
        }
      >
        <Ficha params={params} />
      </Suspense>
    </div>
  );
}

async function Ficha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await obtenerUsuarioActual();
  const idValido = idPositivo.safeParse(Number(id));
  const cliente = idValido.success ? await obtenerCliente(idValido.data) : null;

  if (!cliente) {
    notFound();
  }

  const cuenta = await obtenerCuenta(cliente.id);
  const debe = aCentavos(cuenta.saldo) > 0;

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <Datos cliente={cliente} saldo={cuenta.saldo} />

      <section className="flex flex-col gap-4 border-t border-neutral-900 pt-10">
        <div className="flex min-h-10 items-center">
          <h2 className={CLASE_H2}>Registrar pago</h2>
        </div>
        {debe ? (
          <RegistrarPago clienteId={cliente.id} saldo={cuenta.saldo} />
        ) : (
          <Vacio>
            El cliente no tiene saldo adeudado, así que no admite pagos.
          </Vacio>
        )}
      </section>

      <Historial cuenta={cuenta} />
    </div>
  );
}

function Datos({ cliente, saldo }: { cliente: ClienteDetalle; saldo: string }) {
  const datos = [
    { termino: "Nombre o razón social", valor: cliente.nombre },
    { termino: "Documento", valor: cliente.documento },
    { termino: "Teléfono", valor: cliente.telefono ?? "Sin teléfono" },
    { termino: "Correo", valor: cliente.email ?? "Sin correo" },
    {
      termino: "Límite de crédito",
      valor: cliente.limiteCredito
        ? formatearMoneda(cliente.limiteCredito)
        : "Sin límite",
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex min-h-10 items-center justify-between gap-4">
        <h2 className={`${CLASE_H2} truncate`}>{cliente.nombre}</h2>
        <Link
          href={`/clientes/${cliente.id}/editar`}
          className={claseBoton({ variante: "texto" })}
        >
          <Pencil aria-hidden="true" className="size-5" />
          Editar
        </Link>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        {datos.map((dato) => (
          <div key={dato.termino} className="flex flex-col gap-2">
            <dt className="text-sm text-neutral-400">{dato.termino}</dt>
            <dd className="truncate tabular-nums text-white">{dato.valor}</dd>
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <dt className="text-sm text-neutral-400">Saldo adeudado</dt>
          <dd
            className={`font-medium tabular-nums ${aCentavos(saldo) > 0 ? "text-red-500" : "text-white"}`}
          >
            {formatearMoneda(saldo)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function Historial({ cuenta }: { cuenta: CuentaCliente }) {
  return (
    <section className="flex flex-col gap-4 border-t border-neutral-900 pt-10">
      <div className="flex min-h-10 items-center">
        <h2 className={CLASE_H2}>Cuenta corriente</h2>
      </div>
      {cuenta.movimientos.length === 0 ? (
        <Vacio>
          Todavía no hay ventas en cuenta corriente ni pagos de este cliente.
        </Vacio>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-[0.9375rem]">
            <caption className="sr-only">
              Ventas en cuenta corriente, anulaciones y pagos, del más antiguo
              al más reciente
            </caption>
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
              {cuenta.movimientos.map((movimiento) => (
                <tr key={movimiento.id} className={CLASE_FILA}>
                  <td className="pr-3 tabular-nums text-neutral-300 sm:pr-6">
                    {formatearFechaHora(movimiento.fecha)}
                  </td>
                  <td className="max-w-48 truncate pr-3 sm:max-w-96 sm:pr-6">
                    <span className="flex items-center gap-2">
                      <span className={`${CLASE_BADGE} text-neutral-300`}>
                        {ETIQUETAS_TIPO_CUENTA[movimiento.tipo]}
                      </span>
                      {movimiento.ventaId && movimiento.numero !== null ? (
                        <Link
                          href={`/ventas/${movimiento.ventaId}`}
                          className="tabular-nums text-neutral-300 underline-offset-4 decoration-neutral-600 transition-colors hover:text-white hover:underline"
                        >
                          N.º{" "}
                          {formatearComprobante({
                            puntoVenta: movimiento.puntoVenta ?? 1,
                            numero: movimiento.numero,
                          })}
                        </Link>
                      ) : movimiento.tipo === "pago" &&
                        movimiento.reciboNumero !== null ? (
                        <Link
                          href={`/pagos/${movimiento.id}`}
                          className="tabular-nums text-neutral-300 underline-offset-4 decoration-neutral-600 transition-colors hover:text-white hover:underline"
                        >
                          Recibo N.º {formatearRecibo(movimiento.reciboNumero)}
                        </Link>
                      ) : (
                        <span className="truncate text-neutral-300">
                          {movimiento.observacion}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="pr-3 text-right tabular-nums text-white sm:pr-6">
                    {movimiento.tipo === "venta" ? "" : "−"}
                    {formatearMoneda(movimiento.importe)}
                  </td>
                  <td
                    className={`text-right tabular-nums text-neutral-300 ${SOLO_ESCRITORIO}`}
                  >
                    {formatearMoneda(movimiento.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
