import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown } from "pixelarticons/react/ChevronDown.js";
import { UserPlus } from "pixelarticons/react/UserPlus.js";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { CLASE_BADGE, CLASE_FILA, claseBoton } from "@/components/estilos";
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from "@/lib/estados";
import { listarUsuarios } from "@/lib/usuarios/listado";
import { ETIQUETAS_ROL, ROL_ADMINISTRADOR } from "@/lib/usuarios/sesion";

export const metadata: Metadata = {
  title: "Usuarios · Power Up",
};

const REGLA_ADMINISTRADOR = "Siempre queda al menos un administrador activo";

const ANCHO_LISTA = "mx-auto w-full max-w-3xl";

const SOLO_ESCRITORIO = "hidden sm:table-cell";

const COLUMNAS = [
  { titulo: "Usuario", clase: "pr-3 sm:pr-6" },
  { titulo: "Rol", clase: "w-px sm:pr-6" },
  { titulo: "Estado", clase: `w-px ${SOLO_ESCRITORIO}` },
];

function contar({
  cantidad,
  singular,
  plural,
}: {
  cantidad: number;
  singular: string;
  plural: string;
}) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

export default function Usuarios() {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Usuarios">
        <Suspense fallback={`${REGLA_ADMINISTRADOR}.`}>
          <Descripcion />
        </Suspense>
      </EncabezadoPagina>

      <Suspense
        fallback={
          <div aria-hidden="true" className={`esqueleto h-48 ${ANCHO_LISTA}`} />
        }
      >
        <Lista />
      </Suspense>
    </div>
  );
}

async function Descripcion() {
  const { administradoresActivos } = await listarUsuarios();

  return `${REGLA_ADMINISTRADOR}; hoy hay ${administradoresActivos}.`;
}

async function Lista() {
  const { usuarios, administradoresActivos } = await listarUsuarios();

  return (
    <section className={`flex flex-col gap-4 ${ANCHO_LISTA}`}>
      <div className="flex min-h-10 items-center justify-between gap-4">
        <span className={`${CLASE_BADGE} text-neutral-300`}>
          {contar({
            cantidad: usuarios.length,
            singular: "usuario",
            plural: "usuarios",
          })}
        </span>
        <Link
          href="/usuarios/nuevo"
          className={claseBoton({ variante: "primario" })}
        >
          <UserPlus aria-hidden="true" className="size-5" />
          Nuevo usuario
        </Link>
      </div>
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
              const ultimoAdministrador =
                usuario.activo &&
                usuario.rol === ROL_ADMINISTRADOR &&
                administradoresActivos === 1;

              return (
                <tr key={usuario.id} className={CLASE_FILA}>
                  <td className="max-w-48 py-2 pr-3 sm:max-w-none sm:pr-6">
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
                  </td>
                  <td className="sm:pr-6">
                    <div className="relative inline-flex">
                      <select
                        name="rol"
                        aria-label={`Rol de ${usuario.nombre}`}
                        defaultValue={usuario.rol}
                        disabled={usuario.esActual || ultimoAdministrador}
                        className={`${CLASE_BADGE} appearance-none bg-black pr-8 text-neutral-300 transition-colors enabled:cursor-pointer enabled:hover:border-neutral-600 disabled:text-neutral-400`}
                      >
                        {Object.entries(ETIQUETAS_ROL).map(
                          ([valor, etiqueta]) => (
                            <option key={valor} value={valor}>
                              {etiqueta}
                            </option>
                          ),
                        )}
                      </select>
                      <ChevronDown
                        aria-hidden="true"
                        className="pointer-events-none absolute right-2 top-1/2 size-5 -translate-y-1/2 text-neutral-400"
                      />
                    </div>
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
    </section>
  );
}
