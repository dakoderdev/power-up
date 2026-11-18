import type { Metadata } from "next";
import { documentoDeVenta } from "@/lib/documento";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import {
  Columna,
  Dato,
  Fila,
  ListaDatos,
  Pagina,
  Seccion,
  Texto,
} from "@/components/maquetacion";
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
  ETIQUETAS_TIPO_TARJETA,
} from "@/lib/ventas/etiquetas";
import { calcularVuelto } from "@/lib/ventas/vuelto";
import { AnularVenta } from "./anular-venta";
import { BotonImprimir } from "./boton-imprimir";
import { ComprobanteImpreso } from "./comprobante-impreso";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <Pagina>
      <EncabezadoPagina titulo="Comprobante">
        Copia de la venta tal como se confirmó.
      </EncabezadoPagina>

      <Suspense fallback={<Skeleton aria-hidden="true" className="h-96" />}>
        <Detalle params={params} />
      </Suspense>
    </Pagina>
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
    <>
      <Columna>
        <Fila className="justify-end">
          <BotonImprimir />
        </Fila>
        <Datos venta={venta} />
        <Items venta={venta} />
        {venta.anuladaEn ? (
          <Anulacion venta={venta} />
        ) : usuario.esAdministrador ? (
          <AnularVenta ventaId={venta.id} />
        ) : null}
      </Columna>
      <ComprobanteImpreso venta={venta} />
    </>
  );
}

function Datos({ venta }: { venta: VentaDetalle }) {
  const datos = [
    { termino: "Número", valor: `N.º ${formatearComprobante(venta)}` },
    { termino: "Fecha", valor: formatearFechaHora(venta.creadoEn) },
    {
      termino: "Cliente",
      valor: [venta.clienteNombre, documentoDeVenta(venta)]
        .filter(Boolean)
        .join(" · "),
    },
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
            valor: `${formatearMoneda(venta.montoRecibido)} · vuelto ${formatearMoneda(calcularVuelto({ recibido: venta.montoRecibido, total: venta.total }))}`,
          },
        ]
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
      <Dato termino="Forma de pago" className="flex gap-2">
        <Badge className={COLORES_FORMA_PAGO[venta.formaPago]}>
          {ETIQUETAS_FORMA_PAGO[venta.formaPago]}
        </Badge>
        {venta.anuladaEn ? (
          <Badge variant="secondary">{ETIQUETA_ANULADA}</Badge>
        ) : null}
      </Dato>
    </ListaDatos>
  );
}

function Items({ venta }: { venta: VentaDetalle }) {
  return (
    <Table>
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
        {venta.items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className={`pr-6 text-neutral-300 ${SOLO_ESCRITORIO}`}>
              {item.codigo}
            </TableCell>
            <TableCell className="max-w-40 truncate pr-3 text-white sm:max-w-96 sm:pr-6">
              {item.descripcion}
            </TableCell>
            <TableCell className="pr-3 text-right tabular-nums text-neutral-300 sm:pr-6">
              {item.cantidad}
            </TableCell>
            <TableCell
              className={`pr-6 text-right tabular-nums text-neutral-300 ${SOLO_ESCRITORIO}`}
            >
              {formatearMoneda(item.precioUnitario)}
            </TableCell>
            <TableCell className="text-right tabular-nums text-white">
              {formatearMoneda(item.subtotal)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="border-t border-neutral-800">
          <TableHead
            scope="row"
            colSpan={COLUMNAS.length - 1}
            className="h-auto pr-3 text-right text-[0.9375rem] sm:pr-6"
          >
            Total
          </TableHead>
          <TableCell
            className={`text-right font-medium tabular-nums ${venta.anuladaEn ? "text-neutral-400 line-through" : "text-white"}`}
          >
            {formatearMoneda(venta.total)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function Anulacion({ venta }: { venta: VentaDetalle }) {
  return (
    <Seccion titulo="Anulación" separada>
      <Texto tono="tenue" className="text-[0.9375rem]">
        Anulada el {formatearFechaHora(venta.anuladaEn!)} por{" "}
        {venta.anuladaPor ?? "un usuario"}. Motivo: {venta.motivoAnulacion}
      </Texto>
      <Texto tono="secundario" className="text-sm">
        El stock se devolvió y, si fue en cuenta corriente, el total se restó
        del saldo del cliente.
      </Texto>
    </Seccion>
  );
}
