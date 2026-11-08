import Link from "next/link";
import type { ReactNode } from "react";
import { Banknote } from "pixelarticons/react/Banknote.js";
import { Box } from "pixelarticons/react/Box.js";
import { claseBoton } from "./estilos";

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
    <header className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-black px-4 py-3 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h1 className="font-pixel text-5xl leading-none tracking-[-0.01em]">
          {titulo}
        </h1>
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 lg:static lg:flex-row">
          {actual === "nuevo-producto" ? null : (
            <Link
              href="/productos/nuevo"
              className={`${claseBoton({ variante: "secundario" })} bg-black max-lg:h-11`}
            >
              <Box aria-hidden="true" className="size-5" />
              Nuevo producto
            </Link>
          )}
          {actual === "nueva-venta" ? null : (
            <Link
              href="/ventas/nueva"
              className={`${claseBoton({ variante: "primario" })} max-lg:h-11`}
            >
              <Banknote aria-hidden="true" className="size-5" />
              Nueva venta
            </Link>
          )}
        </div>
      </div>
      {children ? (
        <p className="text-[0.9375rem] text-neutral-400">{children}</p>
      ) : null}
    </header>
  );
}
