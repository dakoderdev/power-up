"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Close } from "pixelarticons/react/Close.js";
import { Menu } from "pixelarticons/react/Menu.js";
import { Isotipo } from "@/components/isotipo";
import { Logo } from "@/components/logo";

export function MarcoBarra({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);

  function cerrarAlNavegar(evento: MouseEvent<HTMLElement>) {
    if (evento.target instanceof Element && evento.target.closest("a")) {
      setAbierto(false);
    }
  }

  return (
    <div className="lg:sticky lg:top-0 lg:h-screen">
      <header className="flex h-14 items-center justify-between border-b border-neutral-900 bg-black px-4 lg:hidden">
        <Link href="/" aria-label="Power Up: ir al inicio">
          <Isotipo className="h-8 w-auto text-white" />
        </Link>
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          aria-expanded={abierto}
          aria-controls="barra-lateral"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="-mr-2 grid size-10 place-items-center text-neutral-300 transition-colors hover:text-white"
        >
          {abierto ? (
            <Close className="size-6" aria-hidden="true" />
          ) : (
            <Menu className="size-6" aria-hidden="true" />
          )}
        </button>
      </header>

      <aside
        id="barra-lateral"
        onClick={cerrarAlNavegar}
        className={`${abierto ? "flex" : "hidden"} fixed inset-x-0 bottom-0 top-14 z-20 flex-col overflow-y-auto bg-black lg:static lg:flex lg:h-full lg:w-60 lg:border-r lg:border-neutral-950`}
      >
        <Link
          href="/"
          aria-label="Power Up: ir al inicio"
          className="hidden px-6 pb-8 pt-6 lg:block"
        >
          <Logo className="h-7 w-auto text-white" />
        </Link>
        {children}
      </aside>
    </div>
  );
}

type PropsEnlace = {
  href: string;
  icono: ReactNode;
  children: ReactNode;
};

export function EnlaceSeccion(props: PropsEnlace) {
  return (
    <Suspense fallback={<Enlace {...props} activo={false} />}>
      <EnlaceSegunRuta {...props} />
    </Suspense>
  );
}

function EnlaceSegunRuta(props: PropsEnlace) {
  const ruta = usePathname();
  const activo =
    props.href === "/" ? ruta === "/" : ruta.startsWith(props.href);

  return <Enlace {...props} activo={activo} />;
}

function Enlace({
  href,
  icono,
  children,
  activo,
}: PropsEnlace & { activo: boolean }) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`flex h-9 items-center gap-3 px-3 text-[0.9375rem] transition-colors ${activo ? "border border-neutral-800 bg-neutral-950 text-white" : "border border-transparent text-neutral-400 hover:text-white"}`}
    >
      <span
        aria-hidden="true"
        className={`size-5 shrink-0 [&>svg]:size-full ${activo ? "text-verde" : ""}`}
      >
        {icono}
      </span>
      {children}
    </Link>
  );
}
