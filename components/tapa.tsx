"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const FONDO_SIN_IMAGEN = "bg-linear-to-br from-white to-verde to-60%";

export function Tapa({
  url,
  className,
}: {
  url: string | null;
  className: string;
}) {
  const imagen = useRef<HTMLImageElement>(null);
  const [cargada, setCargada] = useState(false);
  const clase = cn("rounded-xs object-cover", className);

  useEffect(() => {
    if (imagen.current?.complete && imagen.current.naturalWidth > 0) {
      setCargada(true);
    }
  }, []);

  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- las direcciones son externas y de cualquier dominio (PR-12)
    <img
      ref={imagen}
      src={url}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onLoad={() => setCargada(true)}
      className={`${clase} ${cargada ? "" : FONDO_SIN_IMAGEN}`}
    />
  ) : (
    <span aria-hidden="true" className={`block ${FONDO_SIN_IMAGEN} ${clase}`} />
  );
}
