import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

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
    <Pagination aria-label="Páginas" className="items-center justify-end gap-2">
      <p className="mr-auto text-sm tabular-nums text-muted-foreground">
        Página {pagina} de {paginas}
      </p>
      <PaginationContent>
        {pagina > 1 ? (
          <PaginationItem>
            <PaginationPrevious href={enlace(pagina - 1)} />
          </PaginationItem>
        ) : null}
        {pagina < paginas ? (
          <PaginationItem>
            <PaginationNext href={enlace(pagina + 1)} />
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </Pagination>
  );
}
