"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

export function ConfirmarAccion({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  accion,
  onConfirmar,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion: string;
  accion: string;
  onConfirmar: () => void;
}) {
  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(quedaAbierto) => {
        if (!quedaAbierto) {
          onCerrar();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirmar}>
            {accion}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
