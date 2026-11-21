"use client";

import { useState } from "react";
import { Calendar as IconoCalendario } from "pixelarticons/react/Calendar.js";
import { es } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const FORMATO_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

function leerDia(valor: string) {
  const partes = FORMATO_DIA.exec(valor);

  return partes
    ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
    : undefined;
}

// El día elegido no es un instante: se muestra con sus propias partes, sin convertir de zona horaria.
function mostrarDia(fecha: Date) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

function escribirDia(fecha: Date) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// Sección 8: fechas dd/mm/aaaa. Selector de shadcn/ui (Popover + Calendar); el formulario recibe AAAA-MM-DD.
export function SelectorFecha({
  id,
  nombre,
  valor = "",
  placeholder = "dd/mm/aaaa",
}: {
  id: string;
  nombre: string;
  valor?: string;
  placeholder?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [elegida, setElegida] = useState<Date | undefined>(() =>
    leerDia(valor),
  );

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <input
        type="hidden"
        name={nombre}
        value={elegida ? escribirDia(elegida) : ""}
      />
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
        >
          <span
            className={elegida ? "text-foreground" : "text-muted-foreground"}
          >
            {elegida ? mostrarDia(elegida) : placeholder}
          </span>
          <IconoCalendario aria-hidden="true" className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={es}
          selected={elegida}
          defaultMonth={elegida}
          onSelect={(dia) => {
            setElegida(dia);
            setAbierto(false);
          }}
        />
        {elegida ? (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setElegida(undefined);
                setAbierto(false);
              }}
            >
              Quitar fecha
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
