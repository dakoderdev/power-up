"use client";

import { AvisoError } from "@/components/aviso-error";
import { useId } from "react";
import type { FormEvent } from "react";
import { useFormulario } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { esquemaClienteNuevo } from "@/lib/clientes/esquemas";
import type { ClienteVenta } from "@/lib/clientes/listado";
import {
  CamposCliente,
  leerCliente,
} from "../../clientes/_comun/campos-cliente";
import { crearCliente } from "./api-venta";

export function AltaCliente({
  abierto,
  onCreado,
  onCerrar,
}: {
  abierto: boolean;
  onCreado: (cliente: ClienteVenta) => void;
  onCerrar: () => void;
}) {
  const id = useId();
  const { errores, mensaje, enviando, enviar, limpiar } = useFormulario();

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviar({
      esquema: esquemaClienteNuevo,
      datos: leerCliente(new FormData(evento.currentTarget)),
      accion: crearCliente,
      aviso: "Cliente creado y elegido para la venta.",
      onListo: onCreado,
    });
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) {
          limpiar();
          onCerrar();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>
            Queda elegido para esta venta, sin perder lo que ya cargaste.
            Teléfono o correo: al menos uno de los dos. Para vender en cuenta
            corriente, marcá que está habilitado.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={guardar}
          noValidate
          aria-label="Nuevo cliente"
          className="flex flex-col gap-6"
        >
          <CamposCliente id={id} errores={errores} enfocar />
          {mensaje ? <AvisoError>{mensaje}</AvisoError> : null}
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : "Guardar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
