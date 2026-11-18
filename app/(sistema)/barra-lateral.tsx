"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Menu } from "pixelarticons/react/Menu.js";
import { Isotipo } from "@/components/isotipo";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MarcoBarra({
  usuario,
  children,
}: {
  usuario: ReactNode;
  children: ReactNode;
}) {
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
        <div className="flex items-center gap-1">
          {usuario}
          <Sheet open={abierto} onOpenChange={setAbierto}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menú"
                className="-mr-2"
              >
                <Menu aria-hidden="true" className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              onClick={cerrarAlNavegar}
              className="w-72 gap-0 overflow-y-auto p-0 sm:max-w-72"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Menú</SheetTitle>
                <SheetDescription>Secciones del sistema</SheetDescription>
              </SheetHeader>
              <Link
                href="/"
                aria-label="Power Up: ir al inicio"
                className="px-6 pb-8 pt-6"
              >
                <Logo className="h-7 w-auto text-white" />
              </Link>
              {children}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <aside className="hidden h-full w-60 flex-col border-r border-neutral-950 bg-black lg:flex">
        <Link
          href="/"
          aria-label="Power Up: ir al inicio"
          className="px-6 pb-8 pt-6"
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
  tambien?: string[];
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
    props.href === "/"
      ? ruta === "/"
      : [props.href, ...(props.tambien ?? [])].some((prefijo) =>
          ruta.startsWith(prefijo),
        );

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
