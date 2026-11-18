import type { ReactNode } from "react";
import { Field, FieldLabel } from "@/components/ui/field";

export function Seccion({
  titulo,
  accion,
  className = "",
  children,
}: {
  titulo: string;
  accion?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`flex flex-col gap-6 ${className}`}>
      <div className="flex min-h-10 items-center justify-between gap-6">
        <h2 className="font-pixel text-3xl leading-none tracking-[-0.01em]">
          {titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function Campo({
  etiqueta,
  id,
  children,
}: {
  etiqueta: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      {children}
    </Field>
  );
}

export function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="text-neutral-400">{etiqueta}</dt>
      <dd className="tabular-nums text-neutral-300">{children}</dd>
    </div>
  );
}
