import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Banknote } from "pixelarticons/react/Banknote.js";
import { Box } from "pixelarticons/react/Box.js";
import { Button } from "./ui/button";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";

export function EncabezadoPagina({
  titulo,
  actual,
  children,
}: {
  titulo: string;
  actual?: "nueva-venta" | "nuevo-producto";
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-background px-4 py-3 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{titulo}</h1>
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 lg:static lg:flex-row">
          {actual === "nuevo-producto" ? null : (
            <Suspense fallback={null}>
              <BotonNuevoProducto />
            </Suspense>
          )}
          {actual === "nueva-venta" ? null : (
            <Button
              asChild
              variant="default"
              className="max-lg:shadow-[0_8px_24px_black]"
            >
              <Link href="/ventas/nueva">
                <Banknote aria-hidden="true" className="size-4" />
                Nueva venta
              </Link>
            </Button>
          )}
        </div>
      </div>
      {children ? (
        <p className="text-sm text-muted-foreground">{children}</p>
      ) : null}
    </header>
  );
}

async function BotonNuevoProducto() {
  const { esAdministrador } = await obtenerUsuarioActual();

  if (!esAdministrador) {
    return null;
  }

  return (
    <Button
      asChild
      variant="outline"
      className="bg-background max-lg:shadow-[0_8px_24px_black]"
    >
      <Link href="/productos/nuevo">
        <Box aria-hidden="true" className="size-4" />
        Nuevo producto
      </Link>
    </Button>
  );
}
