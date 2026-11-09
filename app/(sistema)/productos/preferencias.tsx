"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ChevronDown } from "pixelarticons/react/ChevronDown.js";
import { claseBoton } from "@/components/estilos";
import { ORDENES, type Orden } from "@/lib/productos/ordenes";

const CLAVE = "productos:preferencias";

function leerGuardadas() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE) ?? "null");

    return guardadas && typeof guardadas === "object" ? guardadas : null;
  } catch {
    return null;
  }
}

export function Preferencias({
  vista,
  orden,
  aplicar,
}: {
  vista: string;
  orden: string;
  aplicar: boolean;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const parametros = useSearchParams();

  useEffect(() => {
    if (aplicar) {
      const guardadas = leerGuardadas();

      if (guardadas) {
        const siguientes = new URLSearchParams(parametros);
        siguientes.set("vista", String(guardadas.vista));
        siguientes.set("orden", String(guardadas.orden));
        router.replace(`${ruta}?${siguientes.toString()}`);
        return;
      }
    }

    try {
      localStorage.setItem(CLAVE, JSON.stringify({ vista, orden }));
    } catch {}
  }, [aplicar, vista, orden, parametros, ruta, router]);

  return null;
}

export function SelectorOrden({ orden }: { orden: Orden }) {
  const router = useRouter();
  const ruta = usePathname();
  const parametros = useSearchParams();

  function cambiar(valor: string) {
    const siguientes = new URLSearchParams(parametros);
    siguientes.set("orden", valor);
    siguientes.delete("pagina");
    router.push(`${ruta}?${siguientes.toString()}`);
  }

  return (
    <div className="relative">
      <select
        aria-label="Ordenar por"
        value={orden}
        onChange={(evento) => cambiar(evento.target.value)}
        className={`${claseBoton({ variante: "secundario", enFormulario: true })} appearance-none bg-black pr-10`}
      >
        {Object.entries(ORDENES).map(([valor, etiqueta]) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 size-5 text-neutral-400"
      />
    </div>
  );
}
