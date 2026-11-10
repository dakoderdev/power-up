"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import { z } from "zod";
import { CLASE_CAMPO, claseBoton } from "@/components/estilos";
import {
  crearProductoAccion,
  editarProductoAccion,
} from "@/lib/productos/acciones";
import {
  CODIGO_MAXIMO,
  NOMBRE_MAXIMO,
  esquemaProductoEdicion,
  esquemaProductoNuevo,
  type ProductoFila,
} from "@/lib/productos/esquemas";
import { ETIQUETAS_ESTADO } from "@/lib/productos/etiquetas";
import type { ErroresProducto } from "@/lib/productos/guardar";
import { VistaPrevia, type Borrador } from "./vista-previa";

type Campo = "codigo" | "nombre" | "precio" | "stock" | "imagenUrl";

const CLASE_AYUDA = "text-sm text-neutral-500";
const CLASE_ENLACE_AYUDA =
  "text-neutral-400 underline underline-offset-4 transition-colors hover:text-white";

const CAMPOS: {
  nombre: Campo;
  etiqueta: string;
  tipo: string;
  ayuda?: ReactNode;
  ejemplo?: string;
  modo?: "decimal" | "numeric";
  maximo?: number;
  completo?: boolean;
}[] = [
  {
    nombre: "nombre",
    etiqueta: "Nombre",
    tipo: "text",
    maximo: NOMBRE_MAXIMO,
    completo: true,
  },
  { nombre: "codigo", etiqueta: "Código", tipo: "text", maximo: CODIGO_MAXIMO },
  {
    nombre: "precio",
    etiqueta: "Precio de venta",
    tipo: "text",
    modo: "decimal",
    ejemplo: "45999,90",
  },
  {
    nombre: "stock",
    etiqueta: "Stock inicial",
    tipo: "text",
    modo: "numeric",
    ayuda: "Se registra como entrada.",
  },
  {
    nombre: "imagenUrl",
    etiqueta: "Imagen de tapa (opcional)",
    tipo: "url",
    ejemplo: "https://images.igdb.com/igdb/image/upload/t_cover_big/…",
    completo: true,
    ayuda: (
      <>
        Buscá el juego en{" "}
        <a
          href="https://www.igdb.com"
          target="_blank"
          rel="noreferrer"
          className={CLASE_ENLACE_AYUDA}
        >
          IGDB
        </a>
        , hacé clic derecho sobre la tapa y elegí &quot;Copiar dirección de
        imagen&quot;. Sin imagen se muestra un bloque de color.
      </>
    ),
  },
];

const ESTADOS = [
  { valor: true, etiqueta: ETIQUETAS_ESTADO.activo },
  { valor: false, etiqueta: ETIQUETAS_ESTADO.inactivo },
];

function leerFormulario(formulario: FormData): Borrador {
  const texto = (campo: string) => String(formulario.get(campo) ?? "");
  const stock = texto("stock").trim();

  return {
    codigo: texto("codigo"),
    nombre: texto("nombre"),
    precio: texto("precio"),
    imagenUrl: texto("imagenUrl"),
    stock: stock === "" ? 0 : Number(stock),
    activo: texto("activo") !== "false",
  };
}

function borradorInicial(producto?: ProductoFila): Borrador {
  return {
    codigo: producto?.codigo ?? "",
    nombre: producto?.nombre ?? "",
    precio: producto?.precio ?? "",
    imagenUrl: producto?.imagenUrl ?? "",
    stock: producto?.stock ?? 0,
    activo: producto?.activo ?? true,
  };
}

function valorInicial({
  campo,
  producto,
}: {
  campo: Campo;
  producto?: ProductoFila;
}) {
  if (campo === "stock") {
    return "0";
  }

  if (campo === "precio") {
    return producto?.precio.replace(".", ",") ?? "";
  }

  return producto?.[campo] ?? "";
}

export function FormularioProducto({ producto }: { producto?: ProductoFila }) {
  const id = useId();
  const router = useRouter();
  const esAlta = producto === undefined;
  const [errores, setErrores] = useState<ErroresProducto>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [borrador, setBorrador] = useState(() => borradorInicial(producto));
  const [guardando, iniciarGuardado] = useTransition();
  const formulario = useRef<HTMLFormElement>(null);

  function reiniciar() {
    formulario.current?.reset();
    setBorrador(borradorInicial(producto));
    setErrores({});
    setMensaje(null);
  }

  function actualizar(evento: FormEvent<HTMLFormElement>) {
    const leido = leerFormulario(new FormData(evento.currentTarget));
    setBorrador(esAlta ? leido : { ...leido, stock: producto.stock });
  }

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = leerFormulario(new FormData(evento.currentTarget));
    const validacion = esAlta
      ? esquemaProductoNuevo.safeParse(datos)
      : esquemaProductoEdicion.safeParse(datos);

    if (!validacion.success) {
      setErrores(z.flattenError(validacion.error).fieldErrors);
      setMensaje(null);
      return;
    }

    setErrores({});
    setMensaje(null);
    iniciarGuardado(async () => {
      const respuesta = esAlta
        ? await crearProductoAccion(validacion.data)
        : await editarProductoAccion({
            id: producto.id,
            datos: validacion.data,
          });

      if (respuesta.guardado) {
        if (esAlta) {
          reiniciar();
        }

        router.push(
          esAlta
            ? `/productos?${new URLSearchParams({ q: validacion.data.codigo })}`
            : "/productos",
        );
        return;
      }

      setErrores(respuesta.errores);
      setMensaje(respuesta.mensaje ?? null);
    });
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      <form
        ref={formulario}
        onSubmit={guardar}
        onInput={actualizar}
        noValidate
        aria-label={esAlta ? "Nuevo producto" : "Editar producto"}
        className="flex max-w-2xl flex-1 flex-col gap-6"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {CAMPOS.map((campo) => {
            const error = errores[campo.nombre]?.[0];
            const idCampo = `${id}-${campo.nombre}`;
            const descripciones = [
              campo.ayuda ? `${idCampo}-ayuda` : null,
              error ? `${idCampo}-error` : null,
            ].filter(Boolean);

            if (campo.nombre === "stock" && !esAlta) {
              return (
                <div key={campo.nombre} className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-neutral-400">
                    Stock actual
                  </p>
                  <p className="flex h-11 items-center text-[0.9375rem] tabular-nums">
                    {producto.stock} unidades
                  </p>
                  <p className={CLASE_AYUDA}>Cambia solo con movimientos.</p>
                </div>
              );
            }

            return (
              <div
                key={campo.nombre}
                className={`flex flex-col gap-2 ${campo.completo ? "lg:col-span-full" : ""}`}
              >
                <label
                  htmlFor={idCampo}
                  className="text-sm font-medium text-neutral-400"
                >
                  {campo.etiqueta}
                </label>
                <input
                  id={idCampo}
                  name={campo.nombre}
                  type={campo.tipo}
                  inputMode={campo.modo}
                  maxLength={campo.maximo}
                  placeholder={campo.ejemplo}
                  autoFocus={esAlta && campo.nombre === "nombre"}
                  defaultValue={valorInicial({ campo: campo.nombre, producto })}
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    descripciones.length > 0
                      ? descripciones.join(" ")
                      : undefined
                  }
                  className={`${CLASE_CAMPO} ${campo.modo ? "tabular-nums" : ""} ${error ? "border-red-400" : "border-neutral-800"}`}
                />
                {campo.ayuda ? (
                  <p id={`${idCampo}-ayuda`} className={CLASE_AYUDA}>
                    {campo.ayuda}
                  </p>
                ) : null}
                {error ? (
                  <p id={`${idCampo}-error`} className="text-sm text-red-400">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {esAlta ? null : (
          <fieldset className="flex flex-col gap-2">
            <legend className="pb-2 text-sm font-medium text-neutral-400">
              Estado
            </legend>
            <div className="flex gap-2">
              {ESTADOS.map((estado) => {
                const elegido = borrador.activo === estado.valor;

                return (
                  <label
                    key={estado.etiqueta}
                    className={`${claseBoton({ variante: elegido ? "secundario" : "texto", enFormulario: true })} ${elegido ? "" : "border border-transparent"} has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-verde`}
                  >
                    <input
                      type="radio"
                      name="activo"
                      value={String(estado.valor)}
                      defaultChecked={producto.activo === estado.valor}
                      className="sr-only"
                    />
                    {estado.etiqueta}
                  </label>
                );
              })}
            </div>
            <p className={CLASE_AYUDA}>
              Un producto inactivo no entra en ventas nuevas y sigue en los
              comprobantes anteriores.
            </p>
          </fieldset>
        )}

        {mensaje ? (
          <p role="alert" className="text-sm text-red-400">
            {mensaje}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href="/productos"
            onClick={reiniciar}
            className={claseBoton({ variante: "texto", enFormulario: true })}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={guardando}
            className={claseBoton({ variante: "primario", enFormulario: true })}
          >
            {guardando
              ? "Guardando…"
              : esAlta
                ? "Crear producto"
                : "Guardar cambios"}
          </button>
        </div>
      </form>

      <VistaPrevia borrador={borrador} />
    </div>
  );
}
