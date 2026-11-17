import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "pixelarticons/react/Search.js";
import { UserPlus } from "pixelarticons/react/UserPlus.js";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { Button } from "@/components/ui/button";
import { Vacio } from "@/components/vacio";
import { limpiarBusqueda } from "@/lib/db/busqueda";
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from "@/lib/estados";
import {
  contarAdministradoresActivos,
  listarUsuarios,
} from "@/lib/usuarios/listado";
import { contar } from "@/lib/texto";
import { COLORES_ROL, ETIQUETAS_ROL } from "@/lib/usuarios/sesion";
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
  title: "Usuarios · Power Up",
};

const REGLA_ADMINISTRADOR = "Siempre queda al menos un administrador activo";

const SOLO_ESCRITORIO = "hidden sm:table-cell";

const COLUMNAS = [
  { titulo: "Usuario", clase: "pr-3 sm:pr-6" },
  { titulo: "Rol", clase: "w-px sm:pr-6" },
  { titulo: "Estado", clase: `w-px ${SOLO_ESCRITORIO}` },
];

type Parametros = { q?: string | string[] };

export default function Usuarios({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Usuarios">
        <Suspense fallback={`${REGLA_ADMINISTRADOR}.`}>
          <Descripcion />
        </Suspense>
      </EncabezadoPagina>

      <Suspense fallback={<Skeleton aria-hidden="true" className="h-96" />}>
        <Lista parametros={searchParams} />
      </Suspense>
    </div>
  );
}

async function Descripcion() {
  const administradoresActivos = await contarAdministradoresActivos();

  return `${REGLA_ADMINISTRADOR}; hoy hay ${administradoresActivos}.`;
}

async function Lista({ parametros }: { parametros: Promise<Parametros> }) {
  const busqueda = limpiarBusqueda((await parametros).q);
  const { usuarios } = await listarUsuarios(busqueda);

  return (
    <section className="flex flex-col gap-4">
      <form
        role="search"
        action="/usuarios"
        className="flex flex-wrap items-center gap-2"
      >
        <Input
          type="search"
          name="q"
          defaultValue={busqueda}
          maxLength={120}
          placeholder="Buscar por nombre o acceso"
          aria-label="Buscar por nombre o acceso"
          className="max-w-md flex-1"
        />
        <Button variant="outline" size="lg" type="submit">
          <Search aria-hidden="true" className="size-5" />
          Buscar
        </Button>
        {busqueda ? (
          <Button asChild variant="ghost" size="lg">
            <Link href="/usuarios">Limpiar</Link>
          </Button>
        ) : null}
        <Button asChild variant="default" size="lg" className="ml-auto">
          <Link href="/usuarios/nuevo">
            <UserPlus aria-hidden="true" className="size-5" />
            Nuevo usuario
          </Link>
        </Button>
      </form>
      <div className="flex min-h-10 items-center">
        <Badge>
          {contar({
            cantidad: usuarios.length,
            singular: "usuario",
            plural: "usuarios",
          })}
        </Badge>
      </div>
      {usuarios.length === 0 ? (
        <Vacio>
          {`No hay usuarios que coincidan con "${busqueda}". Probá con otro nombre o acceso.`}
        </Vacio>
      ) : (
        <Table>
          <caption className="sr-only">Usuarios del sistema</caption>
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
            {usuarios.map((usuario) => {
              const estado = usuario.activo ? "activo" : "inactivo";

              return (
                <TableRow key={usuario.id} className="group relative">
                  <TableCell className="max-w-48 py-2 pr-3 sm:max-w-none sm:pr-6">
                    <Link
                      href={`/usuarios/${usuario.id}/editar`}
                      className="block after:absolute after:inset-0"
                    >
                      <p className="truncate text-white">
                        <span className="underline-offset-4 decoration-neutral-600 group-hover:underline">
                          {usuario.nombre}
                        </span>
                        {usuario.esActual ? (
                          <span className="ml-2 text-sm text-neutral-400">
                            (vos)
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-sm text-neutral-300 transition-colors group-hover:text-white">
                        {usuario.acceso}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell className="sm:pr-6">
                    <Badge className={COLORES_ROL[usuario.rol]}>
                      {ETIQUETAS_ROL[usuario.rol]}
                    </Badge>
                  </TableCell>
                  <TableCell className={SOLO_ESCRITORIO}>
                    <Badge className={COLORES_ESTADO[estado]}>
                      {ETIQUETAS_ESTADO[estado]}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
