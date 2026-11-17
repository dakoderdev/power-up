import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { ETIQUETAS_ROL, obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { CambiarContrasena } from "./cambiar-contrasena";

export const metadata: Metadata = {
  title: "Perfil · Power Up",
};

export default function Perfil() {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Perfil">
        Tus datos de acceso y el cambio de contraseña.
      </EncabezadoPagina>

      <Suspense
        fallback={
          <div aria-hidden="true" className="esqueleto h-96 max-w-4xl" />
        }
      >
        <Ficha />
      </Suspense>
    </div>
  );
}

async function Ficha() {
  const usuario = await obtenerUsuarioActual();

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex min-h-10 items-center">
          <h2 className="truncate font-pixel text-3xl leading-none tracking-[-0.01em]">
            {usuario.nombre}
          </h2>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <dt className="text-sm text-neutral-400">Rol</dt>
            <dd className="text-white">{ETIQUETAS_ROL[usuario.rol]}</dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-4 border-t border-neutral-900 pt-10">
        <div className="flex min-h-10 items-center">
          <h2 className="font-pixel text-3xl leading-none tracking-[-0.01em]">
            Cambiar contraseña
          </h2>
        </div>
        <CambiarContrasena />
      </section>
    </div>
  );
}
