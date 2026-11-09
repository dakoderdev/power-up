import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ROL_ADMINISTRADOR } from "@/lib/usuarios/sesion";

const RUTA_USUARIOS = "/usuarios";

function esRutaAdministrador(ruta: string) {
  return ruta === RUTA_USUARIOS || ruta.startsWith(`${RUTA_USUARIOS}/`);
}

export async function proxy(solicitud: NextRequest) {
  const sesion = await auth.api.getSession({ headers: solicitud.headers });

  if (!sesion || !sesion.user.active) {
    return NextResponse.redirect(new URL("/login", solicitud.url));
  }

  if (
    esRutaAdministrador(solicitud.nextUrl.pathname) &&
    sesion.user.role !== ROL_ADMINISTRADOR
  ) {
    return NextResponse.redirect(new URL("/", solicitud.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|.*\\..*).*)"],
};
