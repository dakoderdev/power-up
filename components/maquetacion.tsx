import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const CLASE_TITULO =
  "font-pixel text-3xl leading-none tracking-[-0.01em]";

const TONOS = {
  principal: "text-white",
  tenue: "text-neutral-300",
  secundario: "text-neutral-400",
  ayuda: "text-neutral-500",
};

type Tono = keyof typeof TONOS;

type Contenedor = "div" | "main" | "header" | "aside" | "section" | "nav";

type PropsContenedor = HTMLAttributes<HTMLElement> & { as?: Contenedor };

export function Pagina({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-8", className)} {...props} />;
}

export function Columna({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex max-w-4xl flex-col gap-10", className)}
      {...props}
    />
  );
}

export function Pila({
  as: Elemento = "div",
  className,
  ...props
}: PropsContenedor) {
  return <Elemento className={cn("flex flex-col", className)} {...props} />;
}

export function Fila({
  as: Elemento = "div",
  className,
  ...props
}: PropsContenedor) {
  return <Elemento className={cn("flex items-center", className)} {...props} />;
}

export function Grilla({
  as: Elemento = "div",
  className,
  ...props
}: PropsContenedor) {
  return <Elemento className={cn("grid", className)} {...props} />;
}

export function Texto({
  tono = "principal",
  className,
  ...props
}: ComponentProps<"p"> & { tono?: Tono }) {
  return <p className={cn(TONOS[tono], className)} {...props} />;
}

export function Linea({
  tono,
  className,
  ...props
}: ComponentProps<"span"> & { tono?: Tono }) {
  return <span className={cn(tono ? TONOS[tono] : "", className)} {...props} />;
}

export function Titulo({
  nivel = 2,
  className,
  ...props
}: ComponentProps<"h2"> & { nivel?: 1 | 2 }) {
  const Encabezado = nivel === 1 ? "h1" : "h2";

  return <Encabezado className={cn(CLASE_TITULO, className)} {...props} />;
}

export function Seccion({
  titulo,
  accion,
  separada = false,
  className,
  children,
}: {
  titulo?: ReactNode;
  accion?: ReactNode;
  separada?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4",
        separada ? "border-t border-neutral-900 pt-10" : "",
        className,
      )}
    >
      {titulo === undefined ? null : (
        <div className="flex min-h-10 items-center justify-between gap-4">
          {typeof titulo === "string" ? (
            <Titulo className="truncate">{titulo}</Titulo>
          ) : (
            titulo
          )}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function ListaDatos({ className, ...props }: ComponentProps<"dl">) {
  return (
    <dl className={cn("grid gap-4 sm:grid-cols-2", className)} {...props} />
  );
}

export function Dato({
  termino,
  className,
  children,
}: {
  termino: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="text-sm text-neutral-400">{termino}</dt>
      <dd className={cn("text-white", className)}>{children}</dd>
    </div>
  );
}
