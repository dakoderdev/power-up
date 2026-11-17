import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "pixelarticons/react/Search.js";
import { UserPlus } from "pixelarticons/react/UserPlus.js";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { Paginacion } from "@/components/paginacion";
import { Button } from "@/components/ui/button";
import { Vacio } from "@/components/vacio";
import { listarClientes } from "@/lib/clientes/listado";
import { limpiarBusqueda } from "@/lib/db/busqueda";
import { aCentavos, formatearMoneda } from "@/lib/moneda";
import { limpiarPagina } from "@/lib/paginacion";
import { contar } from "@/lib/texto";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Clientes · Power Up",
};

type Parametros = { q?: string | string[]; pagina?: string | string[] };

const SOLO_ESCRITORIO = "hidden sm:table-cell";

const COLUMNAS = [
  { titulo: "Cliente", clase: "pr-3 sm:pr-6" },
  { titulo: "Documento", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Contacto", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Saldo", clase: "w-px text-right" },
];

function enlaceListado({
  busqueda,
  pagina,
}: {
  busqueda: string;
  pagina: number;
}) {
  const parametros = new URLSearchParams();

  if (busqueda) {
    parametros.set("q", busqueda);
  }

  if (pagina > 1) {
    parametros.set("pagina", String(pagina));
  }

  const consulta = parametros.toString();

  return consulta ? `/clientes?${consulta}` : "/clientes";
}

export default function Clientes({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Clientes">
        Clientes registrados, con el saldo de su cuenta corriente.
      </EncabezadoPagina>

      <Suspense fallback={<Skeleton aria-hidden="true" className="h-96" />}>
        <Listado parametros={searchParams} />
      </Suspense>
    </div>
  );
}

async function Listado({ parametros }: { parametros: Promise<Parametros> }) {
  const { q, pagina: paginaTexto } = await parametros;
  const busqueda = limpiarBusqueda(q);
  await obtenerUsuarioActual();
  const { lista, cantidad, pagina, paginas } = await listarClientes({
    busqueda,
    paginaPedida: limpiarPagina(paginaTexto),
  });

  return (
    <section className="flex flex-col gap-4">
      <form
        role="search"
        action="/clientes"
        className="flex flex-wrap items-center gap-2"
      >
        <Input
          type="search"
          name="q"
          defaultValue={busqueda}
          maxLength={120}
          placeholder="Buscar por nombre o documento"
          aria-label="Buscar por nombre o documento"
          className="max-w-md flex-1"
        />
        <Button variant="outline" size="lg" type="submit">
          <Search aria-hidden="true" className="size-5" />
          Buscar
        </Button>
        {busqueda ? (
          <Button asChild variant="ghost" size="lg">
            <Link href="/clientes">Limpiar</Link>
          </Button>
        ) : null}
        <Button asChild variant="default" size="lg" className="ml-auto">
          <Link href="/clientes/nuevo">
            <UserPlus aria-hidden="true" className="size-5" />
            Nuevo cliente
          </Link>
        </Button>
      </form>

      <div className="flex min-h-10 items-center">
        <Badge>
          {contar({ cantidad, singular: "cliente", plural: "clientes" })}
        </Badge>
      </div>

      {lista.length === 0 ? (
        <Vacio>
          {busqueda
            ? `No hay clientes que coincidan con "${busqueda}". Probá con otro nombre o documento.`
            : "Todavía no hay clientes. Cargá el primero con Nuevo cliente o durante una venta."}
        </Vacio>
      ) : (
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
            {lista.map((cliente) => (
              <TableRow key={cliente.id} className="group relative">
                <TableCell className="max-w-48 truncate pr-3 sm:max-w-none sm:pr-6">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="underline-offset-4 decoration-neutral-600 group-hover:underline after:absolute after:inset-0"
                  >
                    {cliente.nombre}
                  </Link>
                </TableCell>
                <TableCell
                  className={`pr-6 tabular-nums text-neutral-300 transition-colors group-hover:text-white ${SOLO_ESCRITORIO}`}
                >
                  {cliente.documento}
                </TableCell>
                <TableCell
                  className={`pr-6 text-neutral-300 transition-colors group-hover:text-white ${SOLO_ESCRITORIO}`}
                >
                  {cliente.telefono ?? cliente.email}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums ${aCentavos(cliente.saldo) > 0 ? "text-white" : "text-neutral-300"}`}
                >
                  {formatearMoneda(cliente.saldo)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        enlace={(numero) => enlaceListado({ busqueda, pagina: numero })}
      />
    </section>
  );
}
