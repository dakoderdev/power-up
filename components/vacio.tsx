import type { ReactNode } from "react";
import { Empty, EmptyDescription } from "@/components/ui/empty";

export function Vacio({ children }: { children: ReactNode }) {
  return (
    <Empty>
      <EmptyDescription>{children}</EmptyDescription>
    </Empty>
  );
}
