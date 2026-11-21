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
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Link href="/" aria-label="Power Up: ir al inicio">
          <Isotipo className="h-8 w-auto text-foreground" />
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
                <Logo className="h-7 w-auto text-foreground" />
              </Link>
              {children}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <aside className="hidden h-full w-60 flex-col border-r border-border bg-background lg:flex">
        <Link
          href="/"
          aria-label="Power Up: ir al inicio"
          className="px-6 pb-8 pt-6"
        >
          <Logo className="h-7 w-auto text-foreground" />
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
      className={`flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors ${activo ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
    >
      <span
        aria-hidden="true"
        className={`size-4 shrink-0 [&>svg]:size-full ${activo ? "text-primary" : ""}`}
      >
        {icono}
      </span>
      {children}
    </Link>
  );
}
