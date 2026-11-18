import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { obtenerCliente } from "@/lib/clientes/detalle";
import { idPositivo } from "@/lib/esquemas-comunes";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { FormularioCliente } from "../../_comun/formulario-cliente";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagina } from "@/components/maquetacion";

export const metadata: Metadata = {
  title: "Editar cliente · Power Up",
};

export default function EditarCliente({
  params,
}: PageProps<"/clientes/[id]/editar">) {
  return (
    <Pagina>
      <EncabezadoPagina titulo="Editar cliente">
        Cambiá los datos de contacto o el límite de crédito.
      </EncabezadoPagina>

      <Suspense
        fallback={<Skeleton aria-hidden="true" className="h-96 max-w-2xl" />}
      >
        <Edicion params={params} />
      </Suspense>
    </Pagina>
  );
}

async function Edicion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await obtenerUsuarioActual();
  const idValido = idPositivo.safeParse(Number(id));
  const cliente = idValido.success ? await obtenerCliente(idValido.data) : null;

  if (!cliente) {
    notFound();
  }

  return <FormularioCliente cliente={cliente} />;
}
