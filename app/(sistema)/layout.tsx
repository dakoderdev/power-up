import { Suspense } from "react";
import { Contact } from "pixelarticons/react/Contact.js";
import { Gamepad } from "pixelarticons/react/Gamepad.js";
import { Home } from "pixelarticons/react/Home.js";
import { Receipt } from "pixelarticons/react/Receipt.js";
import { Users } from "pixelarticons/react/Users.js";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { ETIQUETAS_ROL, obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { EnlaceSeccion, MarcoBarra } from "./barra-lateral";
import { MenuUsuario } from "./menu-usuario";

export default function LayoutSistema({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <MarcoBarra
        usuario={
          <Suspense fallback={<UsuarioCargando />}>
            <BarraUsuario />
          </Suspense>
        }
      >
        <nav aria-label="Secciones" className="px-3 pt-4 lg:pt-0">
          <ul className="flex flex-col gap-0.5">
            <li>
              <EnlaceSeccion href="/" icono={<Home />}>
                Inicio
              </EnlaceSeccion>
            </li>
            <li>
              <EnlaceSeccion href="/ventas" icono={<Receipt />}>
                Ventas
              </EnlaceSeccion>
            </li>
            <li>
              <EnlaceSeccion
                href="/productos"
                tambien={["/stock"]}
                icono={<Gamepad />}
              >
                Productos
              </EnlaceSeccion>
            </li>
            <li>
              <EnlaceSeccion href="/clientes" icono={<Contact />}>
                Clientes
              </EnlaceSeccion>
            </li>
            <Suspense fallback={null}>
              <EnlaceUsuarios />
            </Suspense>
          </ul>
        </nav>
      </MarcoBarra>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden h-14 items-center justify-end gap-2 border-b border-neutral-900 lg:flex lg:pl-12 lg:pr-9">
          <Suspense fallback={<UsuarioCargando />}>
            <BarraUsuario />
          </Suspense>
        </header>
        <main className="flex flex-1 flex-col px-4 pb-36 pt-3 lg:pb-10 sm:px-8 lg:pt-6 lg:px-12">
          {children}
        </main>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}

async function EnlaceUsuarios() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario.esAdministrador) {
    return null;
  }

  return (
    <li>
      <EnlaceSeccion href="/usuarios" icono={<Users />}>
        Usuarios
      </EnlaceSeccion>
    </li>
  );
}

// Sección 4: barra superior con el usuario conectado y el botón de salir.
async function BarraUsuario() {
  const usuario = await obtenerUsuarioActual();

  return (
    <MenuUsuario nombre={usuario.nombre} rol={ETIQUETAS_ROL[usuario.rol]} />
  );
}

function UsuarioCargando() {
  return <Skeleton aria-hidden="true" className="h-5 w-12 lg:w-48" />;
}
