import { Contact } from "pixelarticons/react/Contact.js";
import { Wallet } from "pixelarticons/react/Wallet.js";
import { PestanasRuta } from "@/components/pestanas-ruta";

const PESTANAS = [
  {
    valor: "listado",
    href: "/clientes",
    etiqueta: "Clientes",
    icono: <Contact aria-hidden="true" data-icon="inline-start" />,
  },
  {
    valor: "saldos",
    href: "/clientes/saldos",
    etiqueta: "Saldos",
    icono: <Wallet aria-hidden="true" data-icon="inline-start" />,
  },
] as const;

export type PestanaClientes = (typeof PESTANAS)[number]["valor"];

// Sección 4 y RF-C6: Saldos es una pantalla del módulo Clientes (`/clientes/saldos`).
export function PestanasClientes({ actual }: { actual: PestanaClientes }) {
  return (
    <PestanasRuta
      actual={actual}
      pestanas={PESTANAS}
      etiqueta="Secciones de clientes"
    />
  );
}
