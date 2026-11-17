import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { obtenerUsuario } from "@/lib/usuarios/detalle";
import { FormularioUsuario } from "../../_comun/formulario-usuario";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Editar usuario · Power Up",
};

export default function EditarUsuario({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Editar usuario">
        Cambiá nombre, correo, rol o estado.
      </EncabezadoPagina>

      <Suspense fallback={<Skeleton aria-hidden="true" className="h-96" />}>
        <Formulario parametros={params} />
      </Suspense>
    </div>
  );
}

async function Formulario({
  parametros,
}: {
  parametros: Promise<{ id: string }>;
}) {
  const { id } = await parametros;
  const detalle = await obtenerUsuario(id);

  if (!detalle) {
    notFound();
  }

  return (
    <FormularioUsuario usuario={detalle.usuario} esActual={detalle.esActual} />
  );
}
