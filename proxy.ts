import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ROL_ADMINISTRADOR } from "@/lib/usuarios/sesion";

const RUTA_USUARIOS = "/usuarios";
const PREFIJO_API = "/api/";
const EDICION_PRODUCTO = /^\/productos\/(nuevo|\d+)$/;

// Sección 3: usuarios y alta o edición de productos son solo del administrador.
function esRutaAdministrador(ruta: string) {
  return (
    ruta === RUTA_USUARIOS ||
    ruta.startsWith(`${RUTA_USUARIOS}/`) ||
    EDICION_PRODUCTO.test(ruta)
  );
}

// RF-U2 y sección 10.5: primera barrera; sin sesión, la API responde 401 y las páginas van al login.
export async function proxy(solicitud: NextRequest) {
  const sesion = await auth.api.getSession({ headers: solicitud.headers });

  if (!sesion || !sesion.user.active) {
    if (solicitud.nextUrl.pathname.startsWith(PREFIJO_API)) {
      return NextResponse.json(
        {
          error: {
            code: "NO_AUTENTICADO",
            message: "Iniciá sesión para continuar.",
          },
        },
        { status: 401 },
      );
    }

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
