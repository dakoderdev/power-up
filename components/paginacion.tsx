import Link from "next/link";
import { Boton } from "./ui/boton";

export function Paginacion({
  pagina,
  paginas,
  enlace,
}: {
  pagina: number;
  paginas: number;
  enlace: (pagina: number) => string;
}) {
  if (paginas <= 1) {
    return null;
  }

  return (
    <nav aria-label="Páginas" className="flex items-center justify-end gap-2">
      <p className="mr-auto text-sm tabular-nums text-neutral-400">
        Página {pagina} de {paginas}
      </p>
      {pagina > 1 ? (
        <Boton asChild variante="secundario">
          <Link href={enlace(pagina - 1)}>Anterior</Link>
        </Boton>
      ) : null}
      {pagina < paginas ? (
        <Boton asChild variante="secundario">
          <Link href={enlace(pagina + 1)}>Siguiente</Link>
        </Boton>
      ) : null}
    </nav>
  );
}
