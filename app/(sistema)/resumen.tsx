import Link from "next/link";
import type { ReactNode } from "react";
import { CLASE_FILA, claseBoton } from "@/components/estilos";
import { Tapa } from "@/components/tapa";
import { Vacio } from "@/components/vacio";
import { obtenerResumenInicio } from "@/lib/inicio/resumen";
import { formatearMoneda } from "@/lib/moneda";
import { contar, pluralizar } from "@/lib/texto";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { ETIQUETAS_FORMA_PAGO } from "@/lib/ventas/etiquetas";
import { TablaVentas } from "./tabla-ventas";

const SEPARADOR_MOVIL =
  "border-t border-neutral-900 pt-10 lg:border-t-0 lg:pt-0";

export async function Resumen() {
  await obtenerUsuarioActual();
  const { ventasHoy, cuentas, stockBajo } = await obtenerResumenInicio();

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <Seccion
        titulo="Ventas de hoy"
        enlace={{
          href: "/ventas",
          texto:
            ventasHoy.cantidad > ventasHoy.ultimas.length
              ? `Ver las ${ventasHoy.cantidad} ventas`
              : "Ver ventas",
        }}
        className={`order-last lg:order-none lg:col-span-2 ${SEPARADOR_MOVIL}`}
      >
        {ventasHoy.cantidad === 0 ? (
          <Vacio>
            Todavía no hay ventas hoy. Cargá la primera con Nueva venta.
          </Vacio>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-[0.9375rem] tabular-nums">
              <p className="font-medium text-white">
                {formatearMoneda(ventasHoy.total)} en{" "}
                {contar({
                  cantidad: ventasHoy.cantidad,
                  singular: "venta",
                  plural: "ventas",
                })}
              </p>
              <dl className="flex flex-wrap gap-x-6 gap-y-2">
                {ventasHoy.porFormaPago.map((fila) => (
                  <Dato
                    key={fila.formaPago}
                    etiqueta={ETIQUETAS_FORMA_PAGO[fila.formaPago]}
                  >
                    {formatearMoneda(fila.importe)}
                  </Dato>
                ))}
              </dl>
            </div>

            <TablaVentas
              grupos={[{ clave: "hoy", ventas: ventasHoy.ultimas }]}
            />
          </>
        )}
      </Seccion>

      <Seccion
        titulo="Cuentas por cobrar"
        enlace={{
          href: "/clientes",
          texto:
            cuentas.cantidad > cuentas.deudores.length
              ? `Ver los ${cuentas.cantidad} clientes`
              : "Ver clientes",
        }}
      >
        {cuentas.deudores.length === 0 ? (
          <Vacio>Ningún cliente tiene saldo pendiente.</Vacio>
        ) : (
          <>
            <dl className="flex text-[0.9375rem] tabular-nums">
              <Dato etiqueta="Total adeudado" destacado>
                {formatearMoneda(cuentas.total)}
              </Dato>
            </dl>
            <ul className="text-[0.9375rem]">
              {cuentas.deudores.map((deudor) => (
                <li
                  key={deudor.id}
                  className={`${CLASE_FILA} flex items-center justify-between gap-6`}
                >
                  <Link
                    href={`/clientes/${deudor.id}`}
                    className="truncate text-white underline-offset-4 hover:underline"
                  >
                    {deudor.nombre}
                  </Link>
                  <span className="shrink-0 tabular-nums text-white">
                    {formatearMoneda(deudor.saldo)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Seccion>

      <Seccion
        titulo="Stock bajo"
        className={SEPARADOR_MOVIL}
        enlace={{
          href: "/stock",
          texto:
            stockBajo.cantidad > stockBajo.lista.length
              ? `Ver los ${stockBajo.cantidad} productos`
              : "Ver stock",
        }}
      >
        {stockBajo.cantidad === 0 ? (
          <Vacio>No hay productos activos con stock bajo.</Vacio>
        ) : (
          <>
            <p className="text-[0.9375rem] font-medium tabular-nums text-white">
              <span className="text-yellow-400/75">
                {contar({
                  cantidad: stockBajo.cantidad,
                  singular: "producto",
                  plural: "productos",
                })}
              </span>{" "}
              {pluralizar({
                cantidad: stockBajo.cantidad,
                singular: "activo",
                plural: "activos",
              })}{" "}
              con stock bajo
            </p>
            <ul className="text-[0.9375rem]">
              {stockBajo.lista.map((producto) => (
                <li
                  key={producto.id}
                  className={`${CLASE_FILA} flex items-center justify-between gap-6`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Tapa
                      url={producto.imagenUrl}
                      className="h-8 w-6 shrink-0"
                    />
                    <span className="truncate text-white">
                      {producto.nombre}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4 text-sm text-neutral-300">
                    <span className="tabular-nums">
                      {producto.stock === 0
                        ? "Sin stock"
                        : `${producto.stock} u.`}
                    </span>
                    <Link
                      href={`/stock?producto=${producto.id}`}
                      className="transition-colors hover:text-white"
                    >
                      Cargar stock
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Seccion>
    </div>
  );
}

function Seccion({
  titulo,
  enlace,
  className = "",
  children,
}: {
  titulo: string;
  enlace: { href: string; texto: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`flex min-w-0 flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-pixel text-3xl leading-none tracking-[-0.01em] text-white">
          {titulo}
        </h2>
        <Link
          href={enlace.href}
          className={`${claseBoton({ variante: "texto" })} -mr-3 shrink-0`}
        >
          {enlace.texto}
        </Link>
      </div>
      {children}
    </section>
  );
}

function Dato({
  etiqueta,
  destacado = false,
  children,
}: {
  etiqueta: string;
  destacado?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-sm text-neutral-400">{etiqueta}</dt>
      <dd className={destacado ? "font-medium text-red-500" : "text-white"}>
        {children}
      </dd>
    </div>
  );
}
