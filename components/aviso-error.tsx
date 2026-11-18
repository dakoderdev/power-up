import type { ReactNode } from "react";
import { WarningDiamond } from "pixelarticons/react/WarningDiamond.js";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Sección 10.6: el aviso de error de un formulario o pantalla se resuelve una vez.
export function AvisoError({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Alert variant="destructive" className={className}>
      <WarningDiamond aria-hidden="true" />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
