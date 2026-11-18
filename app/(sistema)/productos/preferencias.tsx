"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
    <div className="w-48">
      <NativeSelect
        aria-label="Ordenar por"
        value={orden}
        onChange={(evento) => cambiar(evento.target.value)}
        className="bg-black text-white"
      >
        {Object.entries(ORDENES).map(([valor, etiqueta]) => (
          <NativeSelectOption key={valor} value={valor}>
            {etiqueta}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
