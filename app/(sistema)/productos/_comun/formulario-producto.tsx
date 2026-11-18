"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { z } from "zod";
import { ConfirmarAccion } from "@/components/confirmar-accion";
import { useFormulario } from "@/components/formulario";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { ETIQUETAS_ESTADO } from "@/lib/estados";
import { STOCK_MINIMO_INICIAL } from "@/lib/stock/etiquetas";
import { cn } from "@/lib/utils";
import { VistaPrevia, type Borrador } from "./vista-previa";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

type Campo =
  | "codigo"
  | "nombre"
  | "categoriaId"
  | "precio"
  | "stock"
  | "stockMinimo"
  | "imagenUrl";

type CategoriaOpcion = { id: number; nombre: string };

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
  { nombre: "categoriaId", etiqueta: "Categoría", tipo: "select" },
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
    nombre: "stockMinimo",
    etiqueta: "Stock mínimo",
    tipo: "text",
    modo: "numeric",
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

function leerFormulario(formulario: FormData) {
  const texto = (campo: string) => String(formulario.get(campo) ?? "");
  const stock = texto("stock").trim();
  const minimo = texto("stockMinimo").trim();
  const categoria = texto("categoriaId");

  return {
    codigo: texto("codigo"),
    nombre: texto("nombre"),
    categoriaId: categoria === "" ? undefined : Number(categoria),
    precio: texto("precio"),
    imagenUrl: texto("imagenUrl"),
    stock: stock === "" ? 0 : Number(stock),
    stockMinimo: minimo === "" ? STOCK_MINIMO_INICIAL : Number(minimo),
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

  if (campo === "stockMinimo") {
    return String(producto?.stockMinimo ?? STOCK_MINIMO_INICIAL);
  }

  if (campo === "precio") {
    return producto?.precio.replace(".", ",") ?? "";
  }

  if (campo === "categoriaId") {
    return producto?.categoriaId ? String(producto.categoriaId) : "";
  }

  return producto?.[campo] ?? "";
}

export function FormularioProducto({
  producto,
  categorias,
}: {
  producto?: ProductoFila;
  categorias: CategoriaOpcion[];
}) {
  const id = useId();
  const router = useRouter();
  const esAlta = producto === undefined;
  const {
    errores,
    mensaje,
    enviando: guardando,
    enviar,
    validar,
    ejecutar,
    limpiar,
  } = useFormulario();
  const [borrador, setBorrador] = useState(() => borradorInicial(producto));
  const formulario = useRef<HTMLFormElement>(null);
  const [pendiente, setPendiente] = useState<z.infer<
    typeof esquemaProductoEdicion
  > | null>(null);

  function reiniciar() {
    formulario.current?.reset();
    setBorrador(borradorInicial(producto));
    limpiar();
  }

  function actualizar(evento: FormEvent<HTMLFormElement>) {
    const leido = leerFormulario(new FormData(evento.currentTarget));
    setBorrador(esAlta ? leido : { ...leido, stock: producto.stock });
  }

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = leerFormulario(new FormData(evento.currentTarget));

    if (esAlta) {
      enviar({
        esquema: esquemaProductoNuevo,
        datos,
        accion: crearProductoAccion,
        aviso: "Producto creado.",
        onListo: () => {
          reiniciar();
          router.push(`/productos?${new URLSearchParams({ q: datos.codigo })}`);
        },
      });
      return;
    }

    const edicion = validar(esquemaProductoEdicion, datos);

    if (!edicion) {
      return;
    }

    if (producto.activo && !edicion.activo) {
      setPendiente(edicion);
      return;
    }

    guardarEdicion(edicion);
  }

  function guardarEdicion(datos: z.infer<typeof esquemaProductoEdicion>) {
    if (esAlta) {
      return;
    }

    ejecutar({
      accion: () => editarProductoAccion({ id: producto.id, datos }),
      aviso:
        producto.activo && !datos.activo
          ? "Producto dado de baja."
          : "Cambios guardados.",
      onListo: () => router.push("/productos"),
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

            if (campo.tipo === "select") {
              return (
                <Field key={campo.nombre}>
                  <FieldLabel htmlFor={idCampo}>{campo.etiqueta}</FieldLabel>
                  <NativeSelect
                    id={idCampo}
                    name={campo.nombre}
                    defaultValue={valorInicial({
                      campo: campo.nombre,
                      producto,
                    })}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${idCampo}-error` : undefined}
                  >
                    <NativeSelectOption value="">Elegí una</NativeSelectOption>
                    {categorias.map((categoria) => (
                      <NativeSelectOption
                        key={categoria.id}
                        value={categoria.id}
                      >
                        {categoria.nombre}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  {error ? (
                    <FieldError id={`${idCampo}-error`}>{error}</FieldError>
                  ) : null}
                </Field>
              );
            }

            if (campo.nombre === "stock" && !esAlta) {
              return (
                <div key={campo.nombre} className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-neutral-400">
                    Stock actual
                  </p>
                  <p className="flex h-11 items-center text-[0.9375rem] tabular-nums">
                    {producto.stock} unidades
                  </p>
                  <FieldDescription>
                    Cambia solo con movimientos.
                  </FieldDescription>
                </div>
              );
            }

            return (
              <Field
                key={campo.nombre}
                className={campo.completo ? "lg:col-span-full" : ""}
              >
                <FieldLabel htmlFor={idCampo}>{campo.etiqueta}</FieldLabel>
                <Input
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
                  className={campo.modo ? "tabular-nums" : ""}
                />
                {campo.ayuda ? (
                  <FieldDescription id={`${idCampo}-ayuda`}>
                    {campo.ayuda}
                  </FieldDescription>
                ) : null}
                {error ? (
                  <FieldError id={`${idCampo}-error`}>{error}</FieldError>
                ) : null}
              </Field>
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
                    className={cn(
                      buttonVariants({
                        variant: elegido ? "outline" : "ghost",
                        size: "lg",
                      }),
                      `${elegido ? "" : "border border-transparent"} has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-verde`,
                    )}
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
            <FieldDescription>
              Un producto inactivo no entra en ventas nuevas y sigue en los
              comprobantes anteriores.
            </FieldDescription>
          </fieldset>
        )}

        {mensaje ? (
          <p role="alert" className="text-sm text-red-400">
            {mensaje}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="ghost" size="lg">
            <Link href="/productos" onClick={reiniciar}>
              Cancelar
            </Link>
          </Button>
          <Button
            variant="default"
            size="lg"
            type="submit"
            disabled={guardando}
          >
            {guardando
              ? "Guardando…"
              : esAlta
                ? "Crear producto"
                : "Guardar cambios"}
          </Button>
        </div>
      </form>

      <VistaPrevia borrador={borrador} />
      <ConfirmarAccion
        abierto={pendiente !== null}
        onCerrar={() => setPendiente(null)}
        titulo={`¿Dar de baja ${producto?.nombre ?? "el producto"}?`}
        descripcion="Deja de ofrecerse en ventas nuevas y sigue en los comprobantes viejos. Lo podés volver a activar desde esta ficha."
        accion="Dar de baja"
        onConfirmar={() => {
          if (pendiente) {
            guardarEdicion(pendiente);
          }

          setPendiente(null);
        }}
      />
    </div>
  );
}
