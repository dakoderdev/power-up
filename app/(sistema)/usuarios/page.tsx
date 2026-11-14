import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "pixelarticons/react/Search.js";
import { UserPlus } from "pixelarticons/react/UserPlus.js";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import {
  CLASE_BADGE,
  CLASE_CAMPO,
  CLASE_FILA,
  claseBoton,
} from "@/components/estilos";
import { Vacio } from "@/components/vacio";
import { limpiarBusqueda } from "@/lib/db/busqueda";
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from "@/lib/estados";
import {
  contarAdministradoresActivos,
  listarUsuarios,
} from "@/lib/usuarios/listado";
import { contar } from "@/lib/texto";
import { COLORES_ROL, ETIQUETAS_ROL } from "@/lib/usuarios/sesion";

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

      <Suspense
        fallback={<div aria-hidden="true" className="esqueleto h-96" />}
      >
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
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          maxLength={120}
          placeholder="Buscar por nombre o acceso"
          aria-label="Buscar por nombre o acceso"
          className={`${CLASE_CAMPO} max-w-md flex-1 border-neutral-800`}
        />
        <button
          type="submit"
          className={claseBoton({ variante: "secundario", enFormulario: true })}
        >
          <Search aria-hidden="true" className="size-5" />
          Buscar
        </button>
        {busqueda ? (
          <Link
            href="/usuarios"
            className={claseBoton({ variante: "texto", enFormulario: true })}
          >
            Limpiar
          </Link>
        ) : null}
        <Link
          href="/usuarios/nuevo"
          className={`${claseBoton({ variante: "primario", enFormulario: true })} ml-auto`}
        >
          <UserPlus aria-hidden="true" className="size-5" />
          Nuevo usuario
        </Link>
      </form>
      <div className="flex min-h-10 items-center">
        <span className={`${CLASE_BADGE} text-neutral-300`}>
          {contar({
            cantidad: usuarios.length,
            singular: "usuario",
            plural: "usuarios",
          })}
        </span>
      </div>
      {usuarios.length === 0 ? (
        <Vacio>
          {`No hay usuarios que coincidan con "${busqueda}". Probá con otro nombre o acceso.`}
        </Vacio>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-[0.9375rem]">
            <caption className="sr-only">Usuarios del sistema</caption>
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
              {usuarios.map((usuario) => {
                const estado = usuario.activo ? "activo" : "inactivo";

                return (
                  <tr key={usuario.id} className={CLASE_FILA}>
                    <td className="max-w-48 py-2 pr-3 sm:max-w-none sm:pr-6">
                      <Link
                        href={`/usuarios/${usuario.id}/editar`}
                        className="block hover:underline"
                      >
                        <p className="truncate text-white">
                          {usuario.nombre}
                          {usuario.esActual ? (
                            <span className="ml-2 text-sm text-neutral-400">
                              (vos)
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-sm text-neutral-300">
                          {usuario.acceso}
                        </p>
                      </Link>
                    </td>
                    <td className="sm:pr-6">
                      <span
                        className={`${CLASE_BADGE} ${COLORES_ROL[usuario.rol]}`}
                      >
                        {ETIQUETAS_ROL[usuario.rol]}
                      </span>
                    </td>
                    <td className={SOLO_ESCRITORIO}>
                      <span
                        className={`${CLASE_BADGE} ${COLORES_ESTADO[estado]}`}
                      >
                        {ETIQUETAS_ESTADO[estado]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
