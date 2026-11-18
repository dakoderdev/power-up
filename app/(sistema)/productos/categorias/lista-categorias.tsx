"use client";

import { AvisoError } from "@/components/aviso-error";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ConfirmarAccion } from "@/components/confirmar-accion";
import { useFormulario } from "@/components/formulario";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Vacio } from "@/components/vacio";
import {
  crearCategoriaAccion,
  editarCategoriaAccion,
} from "@/lib/categorias/acciones";
import {
  esquemaCategoriaNueva,
  NOMBRE_CATEGORIA_MAXIMO,
} from "@/lib/categorias/esquemas";
import type { CategoriaFila } from "@/lib/categorias/servicio";
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from "@/lib/estados";
import { contar } from "@/lib/texto";

export function ListaCategorias({
  categorias,
  puedeEditar,
}: {
  categorias: CategoriaFila[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const alta = useFormulario();
  const edicion = useFormulario();
  const baja = useFormulario();
  const enviando = alta.enviando || edicion.enviando || baja.enviando;
  const [editando, setEditando] = useState<number | null>(null);
  const [aDarDeBaja, setADarDeBaja] = useState<CategoriaFila | null>(null);
  const errorAlta = alta.errores.nombre?.[0] ?? alta.mensaje;
  const errorEdicion = edicion.errores.nombre?.[0] ?? edicion.mensaje;
  const errorBaja = baja.errores.activa?.[0] ?? baja.mensaje;

  function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;

    alta.enviar({
      esquema: esquemaCategoriaNueva,
      datos: { nombre: String(new FormData(formulario).get("nombre")) },
      accion: crearCategoriaAccion,
      aviso: "Categoría creada.",
      onListo: () => {
        formulario.reset();
        router.refresh();
      },
    });
  }

  function renombrar(evento: FormEvent<HTMLFormElement>, id: number) {
    evento.preventDefault();
    const nombre = String(new FormData(evento.currentTarget).get("nombre"));

    edicion.ejecutar({
      accion: () => editarCategoriaAccion({ id, datos: { nombre } }),
      aviso: "Categoría renombrada.",
      onListo: () => {
        setEditando(null);
        router.refresh();
      },
    });
  }

  function cambiarEstado(categoria: CategoriaFila) {
    baja.ejecutar({
      accion: () =>
        editarCategoriaAccion({
          id: categoria.id,
          datos: { activa: !categoria.activa },
        }),
      aviso: categoria.activa
        ? "Categoría dada de baja."
        : "Categoría reactivada.",
      onListo: () => router.refresh(),
    });
  }

  return (
    <section className="flex max-w-4xl flex-col gap-6">
      {puedeEditar ? (
        <form
          onSubmit={crear}
          noValidate
          aria-label="Nueva categoría"
          className="flex flex-wrap items-end gap-2"
        >
          <Field className="max-w-md flex-1">
            <FieldLabel htmlFor="categoria-nueva">Nueva categoría</FieldLabel>
            <Input
              id="categoria-nueva"
              name="nombre"
              maxLength={NOMBRE_CATEGORIA_MAXIMO}
              aria-invalid={Boolean(errorAlta)}
              aria-describedby={errorAlta ? "categoria-nueva-error" : undefined}
            />
          </Field>
          <Button type="submit" size="lg" disabled={enviando}>
            {enviando ? "Guardando…" : "Crear categoría"}
          </Button>
          {errorAlta ? (
            <FieldError id="categoria-nueva-error" className="basis-full">
              {errorAlta}
            </FieldError>
          ) : null}
        </form>
      ) : null}

      {errorBaja ? <AvisoError>{errorBaja}</AvisoError> : null}

      {categorias.length === 0 ? (
        <Vacio>
          {puedeEditar
            ? "Todavía no hay categorías. Creá la primera con el formulario de arriba."
            : "Todavía no hay categorías. Las crea un administrador."}
        </Vacio>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Categoría</TableHead>
              <TableHead scope="col" className="w-px pr-6 text-right">
                Productos activos
              </TableHead>
              <TableHead scope="col" className="w-px pr-6">
                Estado
              </TableHead>
              {puedeEditar ? (
                <TableHead scope="col" className="w-px">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.map((categoria) => (
              <TableRow key={categoria.id}>
                <TableCell className="pr-6">
                  {editando === categoria.id ? (
                    <form
                      onSubmit={(evento) => renombrar(evento, categoria.id)}
                      className="flex flex-col gap-1 py-2"
                    >
                      <div className="flex gap-2">
                        <Input
                          name="nombre"
                          defaultValue={categoria.nombre}
                          maxLength={NOMBRE_CATEGORIA_MAXIMO}
                          aria-label={`Nuevo nombre de ${categoria.nombre}`}
                          aria-invalid={Boolean(errorEdicion)}
                          autoFocus
                          className="max-w-xs"
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          size="lg"
                          disabled={enviando}
                        >
                          Guardar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="lg"
                          onClick={() => {
                            setEditando(null);
                            edicion.limpiar();
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                      {errorEdicion ? (
                        <FieldError>{errorEdicion}</FieldError>
                      ) : null}
                    </form>
                  ) : (
                    categoria.nombre
                  )}
                </TableCell>
                <TableCell className="pr-6 text-right tabular-nums text-neutral-300">
                  {contar({
                    cantidad: categoria.productos,
                    singular: "producto",
                    plural: "productos",
                  })}
                </TableCell>
                <TableCell className="pr-6">
                  <Badge
                    className={
                      COLORES_ESTADO[categoria.activa ? "activo" : "inactivo"]
                    }
                  >
                    {ETIQUETAS_ESTADO[categoria.activa ? "activo" : "inactivo"]}
                  </Badge>
                </TableCell>
                {puedeEditar ? (
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        disabled={enviando}
                        onClick={() => {
                          setEditando(categoria.id);
                          edicion.limpiar();
                        }}
                      >
                        Renombrar
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={enviando}
                        onClick={() =>
                          categoria.activa
                            ? setADarDeBaja(categoria)
                            : cambiarEstado(categoria)
                        }
                      >
                        {categoria.activa ? "Dar de baja" : "Reactivar"}
                      </Button>
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmarAccion
        abierto={aDarDeBaja !== null}
        onCerrar={() => setADarDeBaja(null)}
        titulo={`¿Dar de baja ${aDarDeBaja?.nombre ?? "la categoría"}?`}
        descripcion="Deja de ofrecerse al cargar productos. Los productos que ya la tienen la conservan, y la podés reactivar desde acá."
        accion="Dar de baja"
        onConfirmar={() => {
          if (aDarDeBaja) {
            cambiarEstado(aDarDeBaja);
          }

          setADarDeBaja(null);
        }}
      />
    </section>
  );
}
