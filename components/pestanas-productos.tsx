import { Gamepad } from "pixelarticons/react/Gamepad.js";
import { Archive } from "pixelarticons/react/Archive.js";
import { Label } from "pixelarticons/react/Label.js";
import { PestanasRuta } from "@/components/pestanas-ruta";

const PESTANAS = [
  {
    valor: "catalogo",
    href: "/productos",
    etiqueta: "Catálogo",
    icono: <Gamepad aria-hidden="true" data-icon="inline-start" />,
  },
  {
    valor: "existencias",
    href: "/stock",
    etiqueta: "Existencias",
    icono: <Archive aria-hidden="true" data-icon="inline-start" />,
  },
  {
    valor: "categorias",
    href: "/productos/categorias",
    etiqueta: "Categorías",
    icono: <Label aria-hidden="true" data-icon="inline-start" />,
  },
] as const;

export type PestanaProductos = (typeof PESTANAS)[number]["valor"];

// Sección 4: «Existencias» y Categorías son pestañas dentro de Productos.
export function PestanasProductos({ actual }: { actual: PestanaProductos }) {
  return (
    <PestanasRuta
      actual={actual}
      pestanas={PESTANAS}
      etiqueta="Secciones de productos"
    />
  );
}
