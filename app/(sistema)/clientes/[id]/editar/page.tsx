import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { obtenerCliente } from "@/lib/clientes/detalle";
import { idPositivo } from "@/lib/esquemas-comunes";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { FormularioCliente } from "../../_comun/formulario-cliente";

export const metadata: Metadata = {
  title: "Editar cliente · Power Up",
};

export default function EditarCliente({
  params,
}: PageProps<"/clientes/[id]/editar">) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Editar cliente">
        Cambiá los datos de contacto o el límite de crédito.
      </EncabezadoPagina>

      <Suspense
        fallback={
          <div aria-hidden="true" className="esqueleto h-96 max-w-2xl" />
        }
      >
        <Edicion params={params} />
      </Suspense>
    </div>
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
