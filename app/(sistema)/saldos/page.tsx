import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { CLASE_BADGE, CLASE_FILA } from "@/components/estilos";
import { Paginacion } from "@/components/paginacion";
import { Vacio } from "@/components/vacio";
import { listarClientes } from "@/lib/clientes/listado";
import { formatearMoneda } from "@/lib/moneda";
import { limpiarPagina } from "@/lib/paginacion";
import { contar } from "@/lib/texto";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";

export const metadata: Metadata = {
  title: "Saldos · Power Up",
};

type Parametros = { pagina?: string | string[] };

const SOLO_ESCRITORIO = "hidden sm:table-cell";

const COLUMNAS = [
  { titulo: "Cliente", clase: "pr-3 sm:pr-6" },
  { titulo: "Documento", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Contacto", clase: `w-px pr-6 ${SOLO_ESCRITORIO}` },
  { titulo: "Saldo", clase: "w-px text-right" },
];

export default function Saldos({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Saldos">
        Clientes que deben, de mayor a menor saldo.
      </EncabezadoPagina>

      <Suspense
        fallback={<div aria-hidden="true" className="esqueleto h-96" />}
      >
        <Deudores parametros={searchParams} />
      </Suspense>
    </div>
  );
}

async function Deudores({ parametros }: { parametros: Promise<Parametros> }) {
  await obtenerUsuarioActual();
  const { pagina: paginaTexto } = await parametros;
  const { lista, cantidad, totalAdeudado, pagina, paginas } =
    await listarClientes({
      busqueda: "",
      paginaPedida: limpiarPagina(paginaTexto),
      conDeuda: true,
      orden: "saldo",
    });

  if (lista.length === 0) {
    return (
      <Vacio>
        Ningún cliente debe plata. Los saldos aparecen cuando se vende en cuenta
        corriente.
      </Vacio>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <span className={`${CLASE_BADGE} text-neutral-300`}>
          {contar({ cantidad, singular: "cliente", plural: "clientes" })}
        </span>
        <p className="text-[0.9375rem] text-neutral-400">
          Total adeudado:{" "}
          <span className="font-medium tabular-nums text-red-500">
            {formatearMoneda(totalAdeudado)}
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-left text-[0.9375rem]">
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
            {lista.map((cliente) => (
              <tr key={cliente.id} className={`${CLASE_FILA} group relative`}>
                <td className="max-w-48 truncate pr-3 sm:max-w-none sm:pr-6">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="underline-offset-4 decoration-neutral-600 group-hover:underline after:absolute after:inset-0"
                  >
                    {cliente.nombre}
                  </Link>
                </td>
                <td
                  className={`pr-6 tabular-nums text-neutral-300 transition-colors group-hover:text-white ${SOLO_ESCRITORIO}`}
                >
                  {cliente.documento}
                </td>
                <td
                  className={`pr-6 text-neutral-300 transition-colors group-hover:text-white ${SOLO_ESCRITORIO}`}
                >
                  {cliente.telefono ?? cliente.email}
                </td>
                <td className="text-right tabular-nums text-white">
                  {formatearMoneda(cliente.saldo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        enlace={(numero) =>
          numero > 1 ? `/saldos?pagina=${numero}` : "/saldos"
        }
      />
    </section>
  );
}
