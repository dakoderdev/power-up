const BASE_BOTON =
  "flex items-center justify-center gap-2 px-3 text-[0.9375rem] font-medium transition-colors disabled:cursor-wait disabled:opacity-60 cursor-pointer";

const VARIANTES_BOTON = {
  primario: "bg-verde text-black hover:bg-verde/85 active:bg-verde/70",
  secundario: "border border-neutral-800 text-white hover:border-neutral-600",
  texto: "text-neutral-400 hover:text-white",
};

export const CLASE_BADGE =
  "inline-flex h-6 items-center border border-neutral-800 px-2 text-[0.8125rem]";

export const CLASE_FILA = "h-11 border-b border-neutral-900 last:border-b-0";

export const CLASE_CAMPO =
  "h-11 w-full border bg-neutral-900 px-3 text-[0.9375rem] text-white transition-colors placeholder:text-neutral-500 hover:border-neutral-600 focus:border-neutral-400 focus:outline-none";

export const CLASE_AREA = `${CLASE_CAMPO.replace("h-11 ", "")} resize-none py-2`;

export function claseBoton({
  variante,
  enFormulario = false,
}: {
  variante: keyof typeof VARIANTES_BOTON;
  enFormulario?: boolean;
}) {
  return `${BASE_BOTON} ${VARIANTES_BOTON[variante]} ${enFormulario ? "h-11" : "h-10"}`;
}
