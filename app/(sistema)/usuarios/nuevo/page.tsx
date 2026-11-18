import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { requerirAdministrador } from "@/lib/usuarios/sesion";
import { FormularioUsuario } from "../_comun/formulario-usuario";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagina } from "@/components/maquetacion";

export const metadata: Metadata = {
  title: "Nuevo usuario · Power Up",
};

export default function NuevoUsuario() {
  return (
    <Pagina>
      <EncabezadoPagina titulo="Nuevo usuario">
        Elegí su rol y una contraseña inicial.
      </EncabezadoPagina>

      <Suspense fallback={<Skeleton aria-hidden="true" className="h-96" />}>
        <Formulario />
      </Suspense>
    </Pagina>
  );
}

async function Formulario() {
  await requerirAdministrador();

  return <FormularioUsuario />;
}
