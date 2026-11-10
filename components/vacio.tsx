import type { ReactNode } from "react";

export function Vacio({ children }: { children: ReactNode }) {
  return (
    <p className="border border-dashed border-neutral-800 px-6 py-8 text-center text-sm text-neutral-500">
      {children}
    </p>
  );
}
