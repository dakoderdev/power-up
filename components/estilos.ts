const BASE_BOTON =
  "flex items-center justify-center gap-2 px-3 text-[0.9375rem] font-medium transition-colors disabled:cursor-wait disabled:opacity-60";

const VARIANTES_BOTON = {
  primario: "bg-verde text-black hover:bg-verde/85 active:bg-verde/70",
  secundario: "border border-neutral-800 text-white hover:border-neutral-600",
  texto: "text-neutral-400 hover:text-white",
};

export const CLASE_CAMPO =
  "h-11 w-full border bg-neutral-900 px-3 text-[0.9375rem] text-white transition-colors placeholder:text-neutral-500 hover:border-neutral-600 focus:border-neutral-400 focus:outline-none";

export function claseBoton({
  variante,
  enFormulario = false,
}: {
  variante: keyof typeof VARIANTES_BOTON;
  enFormulario?: boolean;
}) {
  return `${BASE_BOTON} ${VARIANTES_BOTON[variante]} ${enFormulario ? "h-11" : "h-10"}`;
}
