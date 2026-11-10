"use client";

import { useState, useTransition } from "react";
import { Vacio } from "@/components/vacio";
import type { ClienteVenta } from "@/lib/clientes/listado";
import type { ProductoVendible } from "@/lib/productos/listado";
import { confirmarVentaAccion } from "@/lib/ventas/acciones";
import { esquemaVentaEntrada } from "@/lib/ventas/esquemas";
import { BuscadorProductos } from "./buscador-productos";
import { COLUMNAS_LINEA, FilaLinea, subtotal, type Linea } from "./linea-venta";
import { ResumenVenta, type FormaPago } from "./resumen-venta";
import { SeccionCliente } from "./seccion-cliente";
import { Seccion } from "./seccion-venta";

const FORMA_INICIAL: FormaPago = "contado";
const SEPARADOR = "border-t border-neutral-900 pt-10";

export function ArmadoVenta() {
  const [cliente, setCliente] = useState<ClienteVenta | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [formaPago, setFormaPago] = useState<FormaPago>(FORMA_INICIAL);
  const [errores, setErrores] = useState<string[]>([]);
  const [confirmada, setConfirmada] = useState<number | null>(null);
  const [confirmando, iniciarConfirmacion] = useTransition();

  const total = lineas.reduce((suma, linea) => suma + subtotal(linea), 0);
  const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);

  function elegirCliente(elegido: ClienteVenta | null) {
    setCliente(elegido);
    if (elegido === null && formaPago === "cuenta_corriente") {
      setFormaPago(FORMA_INICIAL);
    }
  }

  function agregar(producto: ProductoVendible) {
    setConfirmada(null);
    setLineas((actuales) =>
      actuales.some((linea) => linea.producto.id === producto.id)
        ? actuales.map((linea) =>
            linea.producto.id === producto.id
              ? { ...linea, cantidad: linea.cantidad + 1 }
              : linea,
          )
        : [...actuales, { producto, cantidad: 1 }],
    );
  }

  function cambiarCantidad({ id, texto }: { id: number; texto: string }) {
    const cantidad = Math.trunc(Number(texto));

    setLineas((actuales) =>
      actuales.map((linea) =>
        linea.producto.id === id
          ? { ...linea, cantidad: Number.isFinite(cantidad) ? cantidad : 0 }
          : linea,
      ),
    );
  }

  function quitar(id: number) {
    setLineas((actuales) =>
      actuales.filter((linea) => linea.producto.id !== id),
    );
  }

  function conNombre({
    productoId,
    mensaje,
  }: {
    productoId?: number;
    mensaje: string;
  }) {
    const nombre = lineas.find((linea) => linea.producto.id === productoId)
      ?.producto.nombre;

    return nombre && !mensaje.includes(nombre)
      ? `${nombre}: ${mensaje}`
      : mensaje;
  }

  function confirmar() {
    const validacion = esquemaVentaEntrada.safeParse({
      clienteId: cliente?.id ?? null,
      formaPago,
      items: lineas.map((linea) => ({
        productoId: linea.producto.id,
        cantidad: linea.cantidad,
      })),
    });

    if (!validacion.success) {
      setErrores(
        validacion.error.issues.map((problema) =>
          conNombre({
            productoId:
              problema.path[0] === "items"
                ? lineas[Number(problema.path[1])]?.producto.id
                : undefined,
            mensaje: problema.message,
          }),
        ),
      );
      return;
    }

    setErrores([]);
    iniciarConfirmacion(async () => {
      const respuesta = await confirmarVentaAccion(validacion.data);

      if (respuesta.confirmada) {
        setConfirmada(respuesta.numero);
        setLineas([]);
        setCliente(null);
        setFormaPago(FORMA_INICIAL);
        return;
      }

      setErrores(respuesta.errores.map(conNombre));
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="flex flex-col gap-10 lg:col-span-2">
        <SeccionCliente cliente={cliente} onCliente={elegirCliente} />

        <Seccion
          titulo="Productos"
          accion={
            lineas.length > 0 ? (
              <span className="flex h-6 items-center border border-neutral-800 px-2 text-[0.8125rem] tabular-nums">
                {lineas.length} {lineas.length === 1 ? "producto" : "productos"}
              </span>
            ) : null
          }
          className={SEPARADOR}
        >
          <BuscadorProductos onElegir={agregar} />

          {lineas.length === 0 ? (
            <Vacio>
              Todavía no hay productos en la venta. Buscalos arriba y elegí uno
              para sumarlo.
            </Vacio>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-[0.9375rem]">
                <thead>
                  <tr className="border-b border-neutral-900">
                    {COLUMNAS_LINEA.map((columna) => (
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
                  {lineas.map((linea) => (
                    <FilaLinea
                      key={linea.producto.id}
                      linea={linea}
                      onCantidad={(texto) =>
                        cambiarCantidad({ id: linea.producto.id, texto })
                      }
                      onQuitar={() => quitar(linea.producto.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Seccion>
      </div>

      <ResumenVenta
        unidades={unidades}
        total={total}
        formaPago={formaPago}
        conCliente={cliente !== null}
        errores={errores}
        confirmada={confirmada}
        confirmando={confirmando}
        onFormaPago={setFormaPago}
        onConfirmar={confirmar}
        className={`lg:border-t-0 lg:pt-0 ${SEPARADOR}`}
      />
    </div>
  );
}
