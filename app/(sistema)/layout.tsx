import { Suspense } from "react";
import { Archive } from "pixelarticons/react/Archive.js";
import { Contact } from "pixelarticons/react/Contact.js";
import { Gamepad } from "pixelarticons/react/Gamepad.js";
import { Home } from "pixelarticons/react/Home.js";
import { Logout } from "pixelarticons/react/Logout.js";
import { Receipt } from "pixelarticons/react/Receipt.js";
import { Shield } from "pixelarticons/react/Shield.js";
import { User } from "pixelarticons/react/User.js";
import { Wallet } from "pixelarticons/react/Wallet.js";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { ETIQUETAS_ROL, obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { cerrarSesion } from "./actions";
import { EnlaceSeccion, MarcoBarra } from "./barra-lateral";

export default function LayoutSistema({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <MarcoBarra>
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
              <EnlaceSeccion href="/productos" icono={<Gamepad />}>
                Productos
              </EnlaceSeccion>
            </li>
            <li>
              <EnlaceSeccion href="/stock" icono={<Archive />}>
                Stock
              </EnlaceSeccion>
            </li>
            <li>
              <EnlaceSeccion href="/clientes" icono={<Contact />}>
                Clientes
              </EnlaceSeccion>
            </li>
            <li>
              <EnlaceSeccion href="/saldos" icono={<Wallet />}>
                Saldos
              </EnlaceSeccion>
            </li>
            <Suspense fallback={null}>
              <EnlaceUsuarios />
            </Suspense>
          </ul>
        </nav>
      </MarcoBarra>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-2 border-b border-neutral-900 px-4 sm:px-8 lg:px-12">
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
      <EnlaceSeccion href="/usuarios" icono={<Shield />}>
        Usuarios
      </EnlaceSeccion>
    </li>
  );
}

// Sección 4: barra superior con el usuario conectado y el botón de salir.
async function BarraUsuario() {
  const usuario = await obtenerUsuarioActual();

  return (
    <>
      <Link
        href="/perfil"
        aria-label={`Perfil de ${usuario.nombre}`}
        className="mr-auto flex min-w-0 items-center gap-3 text-neutral-300 transition-colors hover:text-white lg:mr-0"
      >
        <User aria-hidden="true" className="size-5 shrink-0" />
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-sm font-medium text-neutral-100">
            {usuario.nombre}
          </span>
          <span className="text-[0.8125rem] text-neutral-500">
            {ETIQUETAS_ROL[usuario.rol]}
          </span>
        </span>
      </Link>
      <form action={cerrarSesion}>
        <Button type="submit" variant="ghost">
          <Logout aria-hidden="true" className="size-5" />
          Salir
        </Button>
      </form>
    </>
  );
}

function UsuarioCargando() {
  return <Skeleton aria-hidden="true" className="h-5 w-48" />;
}
