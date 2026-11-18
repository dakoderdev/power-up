import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UserPlus } from "pixelarticons/react/UserPlus.js";
import { Buscador } from "@/components/buscador";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Fila, Linea, Pagina, Seccion, Texto } from "@/components/maquetacion";

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
    <Pagina>
      <EncabezadoPagina titulo="Usuarios">
        <Suspense fallback={`${REGLA_ADMINISTRADOR}.`}>
          <Descripcion />
        </Suspense>
      </EncabezadoPagina>

      <Suspense fallback={<Skeleton aria-hidden="true" className="h-96" />}>
        <Lista parametros={searchParams} />
      </Suspense>
    </Pagina>
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
    <Seccion>
      <Buscador
        ruta="/usuarios"
        busqueda={busqueda}
        etiqueta="Buscar por nombre o acceso"
      >
        <Button asChild variant="default" size="lg" className="ml-auto">
          <Link href="/usuarios/nuevo">
            <UserPlus aria-hidden="true" className="size-5" />
            Nuevo usuario
          </Link>
        </Button>
      </Buscador>
      <Fila className="min-h-10">
        <Badge>
          {contar({
            cantidad: usuarios.length,
            singular: "usuario",
            plural: "usuarios",
          })}
        </Badge>
      </Fila>
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
                      <Texto className="truncate">
                        <Linea className="underline-offset-4 decoration-neutral-600 group-hover:underline">
                          {usuario.nombre}
                        </Linea>
                        {usuario.esActual ? (
                          <Linea tono="secundario" className="ml-2 text-sm">
                            (vos)
                          </Linea>
                        ) : null}
                      </Texto>
                      <Texto
                        tono="tenue"
                        className="truncate text-sm transition-colors group-hover:text-white"
                      >
                        {usuario.acceso}
                      </Texto>
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
    </Seccion>
  );
}
