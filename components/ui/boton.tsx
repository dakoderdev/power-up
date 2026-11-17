import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

export const variantesBoton = cva(
  "flex cursor-pointer items-center justify-center gap-2 px-3 text-[0.9375rem] font-medium transition-colors disabled:cursor-wait disabled:opacity-60",
  {
    variants: {
      variante: {
        primario: "bg-verde text-black hover:bg-verde/85 active:bg-verde/70",
        secundario:
          "border border-neutral-800 text-white hover:border-neutral-600",
        texto: "text-neutral-400 hover:text-white",
      },
      enFormulario: {
        true: "h-11",
        false: "h-10",
      },
    },
    defaultVariants: {
      enFormulario: false,
    },
  },
);

type Variante = NonNullable<VariantProps<typeof variantesBoton>["variante"]>;

export function Boton({
  className,
  variante,
  enFormulario = false,
  asChild = false,
  ...props
}: ComponentProps<"button"> & {
  variante: Variante;
  enFormulario?: boolean;
  asChild?: boolean;
}) {
  const Elemento = asChild ? Slot.Root : "button";

  return (
    <Elemento
      data-slot="button"
      data-variante={variante}
      className={cn(variantesBoton({ variante, enFormulario }), className)}
      {...props}
    />
  );
}
