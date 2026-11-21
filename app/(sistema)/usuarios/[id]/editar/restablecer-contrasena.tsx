"use client";

import { AvisoError } from "@/components/aviso-error";
import { useState } from "react";
import { ConfirmarAccion } from "@/components/confirmar-accion";
import { useFormulario } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { restablecerContrasenaAccion } from "@/lib/usuarios/acciones";

// RF-U5: el administrador genera una contraseña temporal; se muestra una sola vez.
export function RestablecerContrasena({
  id,
  nombre,
}: {
  id: string;
  nombre: string;
}) {
  const { mensaje, enviando, ejecutar } = useFormulario();
  const [confirmando, setConfirmando] = useState(false);
  const [temporal, setTemporal] = useState<string | null>(null);

  function restablecer() {
    setConfirmando(false);
    ejecutar({
      accion: () => restablecerContrasenaAccion(id),
      aviso: "Contraseña restablecida.",
      onListo: ({ passwordTemporal }) => setTemporal(passwordTemporal),
    });
  }

  return (
    <section
      aria-labelledby="restablecer-titulo"
      className="flex max-w-2xl flex-col gap-4 border-t border-border pt-8"
    >
      <h2 id="restablecer-titulo" className="text-sm font-medium">
        Contraseña
      </h2>
      {temporal ? (
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Contraseña temporal de {nombre}. Copiala ahora: no se vuelve a
            mostrar.
          </p>
          <code className="font-mono text-lg text-primary select-all">
            {temporal}
          </code>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Genera una contraseña temporal al azar y cierra las sesiones abiertas
          de {nombre}. Después la puede cambiar desde su perfil.
        </p>
      )}
      {mensaje ? <AvisoError>{mensaje}</AvisoError> : null}
      <Button
        variant="outline"
        className="self-start"
        disabled={enviando}
        onClick={() => setConfirmando(true)}
      >
        {enviando ? "Restableciendo…" : "Restablecer contraseña"}
      </Button>
      <ConfirmarAccion
        abierto={confirmando}
        onCerrar={() => setConfirmando(false)}
        titulo={`¿Restablecer la contraseña de ${nombre}?`}
        descripcion="La contraseña actual deja de funcionar y se cierran sus sesiones abiertas. Vas a ver la temporal una sola vez."
        accion="Restablecer"
        onConfirmar={restablecer}
      />
    </section>
  );
}
