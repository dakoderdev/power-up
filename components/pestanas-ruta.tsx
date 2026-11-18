import Link from "next/link";
import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type PestanaRuta = {
  valor: string;
  href: string;
  etiqueta: string;
  icono: ReactNode;
};

// Sección 4: las pestañas de un módulo son rutas propias; el contenido lo pone cada página.
export function PestanasRuta({
  actual,
  pestanas,
  etiqueta,
}: {
  actual: string;
  pestanas: readonly PestanaRuta[];
  etiqueta: string;
}) {
  return (
    <Tabs value={actual} className="-mb-4">
      <TabsList aria-label={etiqueta}>
        {pestanas.map((pestana) => (
          <TabsTrigger key={pestana.valor} value={pestana.valor} asChild>
            <Link href={pestana.href}>
              {pestana.icono}
              {pestana.etiqueta}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
