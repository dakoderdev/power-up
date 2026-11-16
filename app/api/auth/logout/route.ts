import { ruta } from "@/lib/api/ruta";
import { auth } from "@/lib/auth";

// RF-U1: cierre de sesión; borra la cookie.
export const POST = ruta({}, async ({ solicitud }) => {
  const { headers } = await auth.api.signOut({
    headers: solicitud.headers,
    returnHeaders: true,
  });

  return new Response(null, { status: 204, headers });
});
