"use client";

import { useEffect, useId, useState } from "react";
import type { FocusEvent, ReactNode } from "react";
import { ChevronDown } from "pixelarticons/react/ChevronDown.js";
import { CLASE_CAMPO } from "@/components/estilos";

const ESPERA_BUSQUEDA = 250;
const CLASE_OPCION =
  "flex h-11 w-full items-center gap-3 text-left text-neutral-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-neutral-500";

export function Combobox<T extends { id: number }>({
  etiqueta,
  placeholder,
  elegido,
  buscar,
  onElegir,
  opcionFija,
  deshabilitada,
  renderOpcion,
}: {
  etiqueta: string;
  placeholder: string;
  elegido?: string;
  buscar: (busqueda: string) => Promise<T[]>;
  onElegir: (opcion: T) => void;
  opcionFija?: { etiqueta: string; onElegir: () => void };
  deshabilitada?: (opcion: T) => boolean;
  renderOpcion: (opcion: T) => ReactNode;
}) {
  const idCampo = useId();
  const idLista = useId();
  const [busqueda, setBusqueda] = useState("");
  const [encontrados, setEncontrados] = useState<T[] | null>(null);
  const [buscando, setBuscando] = useState(true);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let vigente = true;
    const espera = setTimeout(async () => {
      const lista = await buscar(busqueda);

      if (vigente) {
        setEncontrados(lista);
        setBuscando(false);
      }
    }, ESPERA_BUSQUEDA);

    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [busqueda, buscar]);

  function cambiarBusqueda(texto: string) {
    setBusqueda(texto);
    setBuscando(true);
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
    setBusqueda("");
  }

  function cerrarAlSalir(evento: FocusEvent<HTMLDivElement>) {
    if (!evento.currentTarget.contains(evento.relatedTarget)) {
      cerrar();
    }
  }

  return (
    <div
      onBlur={cerrarAlSalir}
      onKeyDown={(evento) => {
        if (evento.key === "Escape") {
          cerrar();
        }
      }}
      className="relative flex flex-col gap-2"
    >
      <label htmlFor={idCampo} className="text-sm font-medium text-neutral-400">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={idCampo}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={abierto}
          aria-controls={idLista}
          value={abierto ? busqueda : (elegido ?? busqueda)}
          onChange={(evento) => cambiarBusqueda(evento.target.value)}
          onFocus={() => setAbierto(true)}
          maxLength={120}
          placeholder={abierto && elegido ? elegido : placeholder}
          autoComplete="off"
          className={`${CLASE_CAMPO} border-neutral-800 pr-10`}
        />
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 size-5 text-neutral-400"
        />
      </div>

      {abierto ? (
        <div
          id={idLista}
          aria-busy={buscando}
          className="absolute inset-x-0 top-full z-10 mt-2 border border-neutral-800 bg-black p-3"
        >
          <ul
            className={`text-[0.9375rem] transition-opacity ${buscando ? "opacity-60" : ""}`}
          >
            {opcionFija ? (
              <li className="border-b border-neutral-900">
                <button
                  type="button"
                  onClick={() => {
                    opcionFija.onElegir();
                    cerrar();
                  }}
                  className={CLASE_OPCION}
                >
                  {opcionFija.etiqueta}
                </button>
              </li>
            ) : null}
            {encontrados === null ? (
              <li aria-hidden="true" className="esqueleto mt-2 h-32" />
            ) : encontrados.length === 0 ? (
              <li className="pt-3 text-sm text-neutral-500">
                No hay resultados para la búsqueda.
              </li>
            ) : (
              encontrados.map((opcion) => (
                <li
                  key={opcion.id}
                  className="border-b border-neutral-900 last:border-b-0"
                >
                  <button
                    type="button"
                    disabled={deshabilitada?.(opcion)}
                    onClick={() => {
                      onElegir(opcion);
                      cerrar();
                    }}
                    className={`group ${CLASE_OPCION}`}
                  >
                    {renderOpcion(opcion)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
