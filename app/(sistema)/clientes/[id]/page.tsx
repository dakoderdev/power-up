import { User } from "pixelarticons/react/User.js";
import { Wallet } from "pixelarticons/react/Wallet.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Pencil } from "pixelarticons/react/Pencil.js";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import {
  Dato,
  Fila,
  Linea,
  ListaDatos,
  Pagina,
  Seccion,
  Titulo,
} from "@/components/maquetacion";
import { Button } from "@/components/ui/button";
import { Vacio } from "@/components/vacio";
import {
  obtenerCliente,
  obtenerCuenta,
  obtenerUltimasVentas,
  type ClienteDetalle,
  type CuentaCliente,
} from "@/lib/clientes/detalle";
import { ETIQUETAS_TIPO_CUENTA, etiquetaMedio } from "@/lib/cuentas/etiquetas";
import { etiquetaDocumento } from "@/lib/documento";
import { ETIQUETA_ANULADA, ETIQUETAS_FORMA_PAGO } from "@/lib/ventas/etiquetas";
import { formatearRecibo } from "@/lib/cuentas/recibo";
import { idPositivo } from "@/lib/esquemas-comunes";
import { formatearFechaHora } from "@/lib/fechas";
import { aCentavos, formatearMoneda } from "@/lib/moneda";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { formatearComprobante } from "@/lib/ventas/comprobante";
import { RegistrarPago } from "./registrar-pago";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ETIQUETAS_ESTADO } from "@/lib/estados";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function Cliente({ params }: PageProps<"/clientes/[id]">) {
  return (
    <Pagina>
      <EncabezadoPagina titulo="Cliente">
        Datos de contacto y cuenta corriente.
      </EncabezadoPagina>

      <Suspense
        fallback={<Skeleton aria-hidden="true" className="h-96 max-w-4xl" />}
      >
        <Ficha params={params} />
      </Suspense>
    </Pagina>
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

  const [cuenta, ultimas] = await Promise.all([
    obtenerCuenta(cliente.id),
    obtenerUltimasVentas(cliente.id),
  ]);
  const debe = aCentavos(cuenta.saldo) > 0;

  return (
    <Tabs defaultValue="datos" className="max-w-4xl">
      <TabsList aria-label="Secciones del cliente">
        <TabsTrigger value="datos">
          <User aria-hidden="true" data-icon="inline-start" />
          Datos
        </TabsTrigger>
        <TabsTrigger value="cuenta">
          <Wallet aria-hidden="true" data-icon="inline-start" />
          Cuenta corriente
        </TabsTrigger>
      </TabsList>

      <TabsContent value="datos">
        <Datos cliente={cliente} saldo={cuenta.saldo} />

        <UltimasFacturas ventas={ultimas} />
      </TabsContent>

      <TabsContent value="cuenta">
        <Seccion titulo="Registrar pago">
          {debe ? (
            <RegistrarPago clienteId={cliente.id} saldo={cuenta.saldo} />
          ) : (
            <Vacio>
              {cliente.cuentaCorriente
                ? "El cliente no tiene saldo adeudado, así que no admite pagos."
                : "El cliente no tiene cuenta corriente habilitada. Editalo para habilitarla."}
            </Vacio>
          )}
        </Seccion>

        <Historial cuenta={cuenta} />
      </TabsContent>
    </Tabs>
  );
}

function Datos({ cliente, saldo }: { cliente: ClienteDetalle; saldo: string }) {
  const datos = [
    { termino: "Nombre o razón social", valor: cliente.nombre },
    { termino: "Documento", valor: etiquetaDocumento(cliente) },
    { termino: "Domicilio", valor: cliente.domicilio ?? "Sin domicilio" },
    { termino: "Teléfono", valor: cliente.telefono ?? "Sin teléfono" },
    { termino: "Correo", valor: cliente.email ?? "Sin correo" },
    {
      termino: "Cuenta corriente",
      valor: cliente.cuentaCorriente ? "Habilitada" : "No habilitada",
    },
    {
      termino: "Límite de crédito",
      valor: !cliente.cuentaCorriente
        ? "—"
        : cliente.limiteCredito
          ? formatearMoneda(cliente.limiteCredito)
          : "Sin límite",
    },
  ];

  return (
    <Seccion
      titulo={
        <Fila className="min-w-0 gap-3">
          <Titulo className="truncate">{cliente.nombre}</Titulo>
          {cliente.activo ? null : (
            <Badge variant="secondary">{ETIQUETAS_ESTADO.inactivo}</Badge>
          )}
        </Fila>
      }
      accion={
        <Button asChild variant="ghost">
          <Link href={`/clientes/${cliente.id}/editar`}>
            <Pencil aria-hidden="true" className="size-4" />
            Editar
          </Link>
        </Button>
      }
    >
      <ListaDatos>
        {datos.map((dato) => (
          <Dato
            key={dato.termino}
            termino={dato.termino}
            className="truncate tabular-nums"
          >
            {dato.valor}
          </Dato>
        ))}
        <Dato
          termino="Saldo adeudado"
          className={`font-medium tabular-nums ${aCentavos(saldo) > 0 ? "text-red-500" : "text-foreground"}`}
        >
          {formatearMoneda(saldo)}
        </Dato>
      </ListaDatos>
    </Seccion>
  );
}

type UltimaVenta = Awaited<ReturnType<typeof obtenerUltimasVentas>>[number];

// RF-C3: las últimas facturas del cliente, con acceso al detalle.
function UltimasFacturas({ ventas }: { ventas: UltimaVenta[] }) {
  return (
    <Seccion titulo="Últimas facturas" separada>
      {ventas.length === 0 ? (
        <Vacio>Todavía no hay facturas a nombre de este cliente.</Vacio>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="pr-3 sm:pr-6">
                Comprobante
              </TableHead>
              <TableHead scope="col" className={`w-px pr-6 ${SOLO_ESCRITORIO}`}>
                Fecha
              </TableHead>
              <TableHead scope="col" className={`w-px pr-6 ${SOLO_ESCRITORIO}`}>
                Forma de pago
              </TableHead>
              <TableHead scope="col" className="w-px text-right">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.map((venta) => (
              <TableRow key={venta.id} className="group relative">
                <TableCell className="pr-3 tabular-nums sm:pr-6">
                  <Linea className="flex items-center gap-2">
                    <Link
                      href={`/ventas/${venta.id}`}
                      className="underline-offset-4 decoration-muted-foreground group-hover:underline after:absolute after:inset-0"
                    >
                      {formatearComprobante(venta)}
                    </Link>
                    {venta.anuladaEn ? (
                      <Badge variant="secondary">{ETIQUETA_ANULADA}</Badge>
                    ) : null}
                  </Linea>
                </TableCell>
                <TableCell
                  className={`pr-6 tabular-nums text-foreground ${SOLO_ESCRITORIO}`}
                >
                  {formatearFechaHora(venta.creadoEn)}
                </TableCell>
                <TableCell className={`pr-6 ${SOLO_ESCRITORIO}`}>
                  <Badge>{ETIQUETAS_FORMA_PAGO[venta.formaPago]}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatearMoneda(venta.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Seccion>
  );
}

function Historial({ cuenta }: { cuenta: CuentaCliente }) {
  return (
    <Seccion titulo="Cuenta corriente" separada>
      {cuenta.movimientos.length === 0 ? (
        <Vacio>
          Todavía no hay ventas en cuenta corriente ni pagos de este cliente.
        </Vacio>
      ) : (
        <Table>
          <TableCaption className="sr-only">
            Ventas en cuenta corriente, anulaciones y pagos, del más antiguo al
            más reciente
          </TableCaption>
          <TableHeader>
            <TableRow>
              {COLUMNAS.map((columna) => (
                <TableHead
                  key={columna.titulo}
                  scope="col"
                  className={columna.clase}
                >
                  {columna.titulo}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {cuenta.movimientos.map((movimiento) => (
              <TableRow key={movimiento.id}>
                <TableCell className="pr-3 tabular-nums text-foreground sm:pr-6">
                  {formatearFechaHora(movimiento.fecha)}
                </TableCell>
                <TableCell className="max-w-48 truncate pr-3 sm:max-w-96 sm:pr-6">
                  <Linea className="flex items-center gap-2">
                    <Badge>{ETIQUETAS_TIPO_CUENTA[movimiento.tipo]}</Badge>
                    {movimiento.ventaId && movimiento.numero !== null ? (
                      <Link
                        href={`/ventas/${movimiento.ventaId}`}
                        className="tabular-nums text-foreground underline-offset-4 decoration-muted-foreground transition-colors hover:text-foreground hover:underline"
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
                        className="tabular-nums text-foreground underline-offset-4 decoration-muted-foreground transition-colors hover:text-foreground hover:underline"
                      >
                        Recibo N.º {formatearRecibo(movimiento.reciboNumero)}
                        {movimiento.medio
                          ? ` · ${etiquetaMedio(movimiento.medio)}`
                          : ""}
                      </Link>
                    ) : (
                      <Linea tono="tenue" className="truncate">
                        {movimiento.observacion}
                      </Linea>
                    )}
                  </Linea>
                </TableCell>
                <TableCell className="pr-3 text-right tabular-nums text-foreground sm:pr-6">
                  {movimiento.tipo === "venta" ? "" : "−"}
                  {formatearMoneda(movimiento.importe)}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums text-foreground ${SOLO_ESCRITORIO}`}
                >
                  {formatearMoneda(movimiento.saldo)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Seccion>
  );
}
