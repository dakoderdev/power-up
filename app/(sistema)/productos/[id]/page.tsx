import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { idPositivo } from "@/lib/esquemas-comunes";
import { obtenerProducto } from "@/lib/productos/guardar";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { FormularioProducto } from "../_comun/formulario-producto";

export const metadata: Metadata = {
  title: "Editar producto · Power Up",
};

export default function EditarProducto({
  params,
}: PageProps<"/productos/[id]">) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Editar producto">
        Cambiá los datos del producto o pasalo a inactivo.
      </EncabezadoPagina>

      <Suspense fallback={<EdicionCargando />}>
        <Edicion params={params} />
      </Suspense>
    </div>
  );
}

async function Edicion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await obtenerUsuarioActual();
  const idValido = idPositivo.safeParse(Number(id));
  const producto = idValido.success
    ? await obtenerProducto(idValido.data)
    : null;

  if (!producto) {
    notFound();
  }

  return <FormularioProducto producto={producto} />;
}

function EdicionCargando() {
  return <div aria-hidden="true" className="esqueleto h-96 max-w-2xl" />;
}
