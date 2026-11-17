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

        <div className="mt-auto border-t border-neutral-900 px-3 py-4">
          <Suspense fallback={<PieCargando />}>
            <PieUsuario />
          </Suspense>
        </div>
      </MarcoBarra>

      <div className="flex min-w-0 flex-1 flex-col">
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

async function PieUsuario() {
  const usuario = await obtenerUsuarioActual();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-w-0 flex-col px-3">
        <span className="truncate text-sm font-medium text-neutral-100">
          {usuario.nombre}
        </span>
        <span className="text-[0.8125rem] text-neutral-500">
          {ETIQUETAS_ROL[usuario.rol]}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <EnlaceSeccion href="/perfil" icono={<User />}>
          Perfil
        </EnlaceSeccion>
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="flex h-9 w-full items-center gap-3 border border-transparent px-3 text-[0.9375rem] text-neutral-400 transition-colors hover:text-white"
          >
            <Logout aria-hidden="true" className="size-5 shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

function PieCargando() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2 px-3">
      <span className="h-3.5 w-28 bg-neutral-900" />
      <span className="h-3 w-20 bg-neutral-900" />
      <span className="mt-4 h-3.5 w-24 bg-neutral-900" />
    </div>
  );
}
