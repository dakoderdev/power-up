"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

const SEPARACION = 8;

export function MasJuegos({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  const id = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  function estaAbierto() {
    return panel.current?.matches(":popover-open") ?? false;
  }

  function ocultar() {
    if (estaAbierto()) {
      panel.current?.hidePopover();
    }
  }

  function mostrar() {
    if (!boton.current || !panel.current || estaAbierto()) {
      return;
    }

    panel.current.showPopover();

    const ancla = boton.current.getBoundingClientRect();
    const { width, height } = panel.current.getBoundingClientRect();
    const izquierda = Math.max(
      SEPARACION,
      Math.min(ancla.left, window.innerWidth - width - SEPARACION),
    );
    const cabeAbajo = ancla.bottom + SEPARACION + height <= window.innerHeight;
    const arriba = cabeAbajo
      ? ancla.bottom + SEPARACION
      : ancla.top - SEPARACION - height;

    panel.current.style.inset = `${arriba}px auto auto ${izquierda}px`;
  }

  useEffect(() => {
    function cerrarAlDesplazar() {
      if (panel.current?.matches(":popover-open")) {
        panel.current.hidePopover();
      }
    }

    window.addEventListener("scroll", cerrarAlDesplazar, true);

    return () => window.removeEventListener("scroll", cerrarAlDesplazar, true);
  }, []);

  return (
    <>
      <button
        ref={boton}
        type="button"
        aria-describedby={id}
        onMouseEnter={mostrar}
        onMouseLeave={ocultar}
        onFocus={mostrar}
        onBlur={ocultar}
        className="ml-2 inline-flex h-6 shrink-0 items-center border border-neutral-800 px-2 text-[0.8125rem] tabular-nums text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
      >
        {etiqueta}
      </button>
      <div
        ref={panel}
        id={id}
        popover="auto"
        role="tooltip"
        className="m-0 border border-neutral-800 bg-black p-3 text-[0.9375rem] text-white"
      >
        {children}
      </div>
    </>
  );
}
