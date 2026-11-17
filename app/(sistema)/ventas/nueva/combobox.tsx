"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, ReactNode } from "react";
import { ChevronDown } from "pixelarticons/react/ChevronDown.js";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field";

const ESPERA_BUSQUEDA = 250;
const SELECTOR_OPCION = "[data-opcion]:not(:disabled)";
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
  const contenedor = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const volviendo = useRef(false);

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

  function volverAlCampo() {
    volviendo.current = true;
    campo.current?.focus();
  }

  function abrirAlEnfocar() {
    if (volviendo.current) {
      volviendo.current = false;
      return;
    }

    setAbierto(true);
  }

  function elegir(accion: () => void) {
    accion();
    cerrar();
    volverAlCampo();
  }

  function moverFoco(paso: number) {
    const opciones = [
      ...(contenedor.current?.querySelectorAll<HTMLElement>(SELECTOR_OPCION) ??
        []),
    ];

    if (opciones.length === 0) {
      return;
    }

    const actual = opciones.indexOf(document.activeElement as HTMLElement);
    const siguiente =
      actual === -1 ? (paso > 0 ? 0 : opciones.length - 1) : actual + paso;

    if (siguiente < 0 || siguiente >= opciones.length) {
      volverAlCampo();
      return;
    }

    opciones[siguiente].focus();
  }

  function manejarTeclas(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "Escape") {
      cerrar();
      volverAlCampo();
      return;
    }

    if (evento.key !== "ArrowDown" && evento.key !== "ArrowUp") {
      return;
    }

    evento.preventDefault();

    if (!abierto) {
      setAbierto(true);
      return;
    }

    moverFoco(evento.key === "ArrowDown" ? 1 : -1);
  }

  function cerrarAlSalir(evento: FocusEvent<HTMLDivElement>) {
    if (!evento.currentTarget.contains(evento.relatedTarget)) {
      cerrar();
    }
  }

  return (
    <div
      ref={contenedor}
      onBlur={cerrarAlSalir}
      onKeyDown={manejarTeclas}
      className="relative flex flex-col gap-2"
    >
      <FieldLabel htmlFor={idCampo}>{etiqueta}</FieldLabel>
      <div className="relative">
        <Input
          ref={campo}
          id={idCampo}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={abierto}
          aria-controls={idLista}
          value={abierto ? busqueda : (elegido ?? busqueda)}
          onChange={(evento) => cambiarBusqueda(evento.target.value)}
          onFocus={abrirAlEnfocar}
          maxLength={120}
          placeholder={abierto && elegido ? elegido : placeholder}
          autoComplete="off"
          className="pr-10"
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
                  data-opcion
                  onClick={() => elegir(opcionFija.onElegir)}
                  className={CLASE_OPCION}
                >
                  {opcionFija.etiqueta}
                </button>
              </li>
            ) : null}
            {encontrados === null ? (
              <li aria-hidden="true" className="mt-2">
                <Skeleton className="h-32" />
              </li>
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
                    data-opcion
                    disabled={deshabilitada?.(opcion)}
                    onClick={() => elegir(() => onElegir(opcion))}
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
