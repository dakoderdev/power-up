import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "pixelarticons/react/Search.js";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const LARGO_BUSQUEDA = 120;

export function Buscador({
  ruta,
  busqueda,
  etiqueta,
  limpiar = ruta,
  ocultos = {},
  children,
}: {
  ruta: string;
  busqueda: string;
  etiqueta: string;
  limpiar?: string;
  ocultos?: Record<string, string>;
  children?: ReactNode;
}) {
  return (
    <form
      role="search"
      action={ruta}
      className="flex flex-wrap items-center gap-2"
    >
      {Object.entries(ocultos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      <Input
        type="search"
        name="q"
        defaultValue={busqueda}
        maxLength={LARGO_BUSQUEDA}
        placeholder={etiqueta}
        aria-label={etiqueta}
        className="max-w-md flex-1"
      />
      <Button variant="outline" size="lg" type="submit">
        <Search aria-hidden="true" className="size-5" />
        Buscar
      </Button>
      {busqueda ? (
        <Button asChild variant="ghost" size="lg">
          <Link href={limpiar}>Limpiar</Link>
        </Button>
      ) : null}
      {children}
    </form>
  );
}
