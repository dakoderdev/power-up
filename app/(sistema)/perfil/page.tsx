import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import {
  Columna,
  Dato,
  ListaDatos,
  Pagina,
  Seccion,
} from "@/components/maquetacion";
import { ETIQUETAS_ROL, obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { CambiarContrasena } from "./cambiar-contrasena";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Perfil · Power Up",
};

export default function Perfil() {
  return (
    <Pagina>
      <EncabezadoPagina titulo="Perfil">
        Tus datos de acceso y el cambio de contraseña.
      </EncabezadoPagina>

      <Suspense
        fallback={<Skeleton aria-hidden="true" className="h-96 max-w-4xl" />}
      >
        <Ficha />
      </Suspense>
    </Pagina>
  );
}

async function Ficha() {
  const usuario = await obtenerUsuarioActual();

  return (
    <Columna>
      <Seccion titulo={usuario.nombre}>
        <ListaDatos>
          <Dato termino="Rol">{ETIQUETAS_ROL[usuario.rol]}</Dato>
        </ListaDatos>
      </Seccion>

      <Seccion titulo="Cambiar contraseña" separada>
        <CambiarContrasena />
      </Seccion>
    </Columna>
  );
}
