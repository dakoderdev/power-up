import { MOTIVOS_SUGERIDOS } from "@/lib/stock/etiquetas";
import { Badge } from "@/components/ui/badge";

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
        <Badge asChild key={sugerido}>
          <button
            type="button"
            onClick={() => onElegir(sugerido)}
            className="cursor-pointer text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
          >
            {sugerido}
          </button>
        </Badge>
      ))}
    </div>
  );
}
