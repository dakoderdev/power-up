import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { requerirAdministrador } from "@/lib/usuarios/sesion";
import { FormularioUsuario } from "../_comun/formulario-usuario";

export const metadata: Metadata = {
  title: "Nuevo usuario · Power Up",
};

export default function NuevoUsuario() {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Nuevo usuario">
        Elegí su rol y una contraseña inicial.
      </EncabezadoPagina>

      <Suspense
        fallback={<div aria-hidden="true" className="esqueleto h-96" />}
      >
        <Formulario />
      </Suspense>
    </div>
  );
}

async function Formulario() {
  await requerirAdministrador();

  return <FormularioUsuario />;
}
