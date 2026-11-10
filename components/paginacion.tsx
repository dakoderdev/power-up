import Link from "next/link";
import { claseBoton } from "./estilos";

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
        <Link
          href={enlace(pagina - 1)}
          className={claseBoton({ variante: "secundario" })}
        >
          Anterior
        </Link>
      ) : null}
      {pagina < paginas ? (
        <Link
          href={enlace(pagina + 1)}
          className={claseBoton({ variante: "secundario" })}
        >
          Siguiente
        </Link>
      ) : null}
    </nav>
  );
}
