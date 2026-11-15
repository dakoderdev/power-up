import { CLASE_BADGE } from "@/components/estilos";
import { MOTIVOS_SUGERIDOS } from "@/lib/stock/etiquetas";

export function MotivosSugeridos({
  tipo,
  onElegir,
}: {
  tipo: keyof typeof MOTIVOS_SUGERIDOS;
  onElegir: (motivo: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOTIVOS_SUGERIDOS[tipo].map((sugerido) => (
        <button
          key={sugerido}
          type="button"
          onClick={() => onElegir(sugerido)}
          className={`${CLASE_BADGE} cursor-pointer text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white`}
        >
          {sugerido}
        </button>
      ))}
    </div>
  );
}
