"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ChevronDown } from "pixelarticons/react/ChevronDown.js";
import { claseBoton } from "@/components/estilos";
import {
  COOKIE_ORDEN,
  COOKIE_VISTA,
  ORDENES,
  type Orden,
} from "@/lib/productos/ordenes";

const UN_ANIO = 60 * 60 * 24 * 365;

function guardarCookie({ nombre, valor }: { nombre: string; valor: string }) {
  document.cookie = `${nombre}=${valor}; path=/productos; max-age=${UN_ANIO}; samesite=lax`;
}

export function Preferencias({
  vista,
  orden,
}: {
  vista: string;
  orden: string;
}) {
  useEffect(() => {
    guardarCookie({ nombre: COOKIE_VISTA, valor: vista });
    guardarCookie({ nombre: COOKIE_ORDEN, valor: orden });
  }, [vista, orden]);

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
