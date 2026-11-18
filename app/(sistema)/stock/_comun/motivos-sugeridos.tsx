import { Button } from "@/components/ui/button";
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
        <Button
          key={sugerido}
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onElegir(sugerido)}
          className="font-normal text-neutral-300 hover:text-white"
        >
          {sugerido}
        </Button>
      ))}
    </div>
  );
}
