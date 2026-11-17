import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { idPositivo } from "@/lib/esquemas-comunes";
import { obtenerProducto } from "@/lib/productos/guardar";
import { requerirAdministrador } from "@/lib/usuarios/sesion";
import { FormularioProducto } from "../_comun/formulario-producto";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagina } from "@/components/maquetacion";

export const metadata: Metadata = {
  title: "Editar producto · Power Up",
};

export default function EditarProducto({
  params,
}: PageProps<"/productos/[id]">) {
  return (
    <Pagina>
      <EncabezadoPagina titulo="Editar producto">
        Cambiá los datos del producto o pasalo a inactivo.
      </EncabezadoPagina>

      <Suspense fallback={<EdicionCargando />}>
        <Edicion params={params} />
      </Suspense>
    </Pagina>
  );
}

async function Edicion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requerirAdministrador();
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
  return <Skeleton aria-hidden="true" className="h-96 max-w-2xl" />;
}
