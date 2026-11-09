import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ventas } from "@/lib/db/schema";

async function moverVentasAHoy() {
  const movidas = await db
    .update(ventas)
    .set({
      creadoEn: sql`${ventas.creadoEn} + (now() - (select max(${ventas.creadoEn}) from ${ventas}))`,
    })
    .returning({ id: ventas.id });

  console.log(`Ventas movidas: ${movidas.length}.`);
}

moverVentasAHoy()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
