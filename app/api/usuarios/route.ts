import { revalidatePath } from "next/cache";
import { noEncontrado } from "@/lib/api/errores";
import { esquemaUsuarioNuevoApi } from "@/lib/api/esquemas";
import { formatearUsuarioApi, respuestaPaginada } from "@/lib/api/formato";
import { leerBusqueda, leerOpcion, leerPaginacion } from "@/lib/api/parametros";
import { leerJson, responder, ruta, validar } from "@/lib/api/ruta";
import { consultarUsuario } from "@/lib/usuarios/detalle";
import { crearUsuario, exigirUsuarioCreado } from "@/lib/usuarios/guardar";
import { consultarUsuarios } from "@/lib/usuarios/listado";

const ESTADOS = ["true", "false"] as const;

// RF-U4: listado de usuarios, sin el hash de contraseña (admin).
export const GET = ruta({ admin: true }, async ({ solicitud }) => {
  const parametros = solicitud.nextUrl.searchParams;
  const { page, pageSize } = leerPaginacion(parametros);
  const activo = leerOpcion({
    parametros,
    nombre: "activo",
    opciones: ESTADOS,
  });

  const lista = await consultarUsuarios({
    busqueda: leerBusqueda(parametros),
    activo: activo === undefined ? undefined : activo === "true",
  });
  const desde = (page - 1) * pageSize;

  return responder(
    respuestaPaginada({
      data: lista.slice(desde, desde + pageSize).map(formatearUsuarioApi),
      page,
      pageSize,
      total: lista.length,
    }),
  );
});

// RF-U4: alta de usuario con rol y contraseña temporal (admin).
export const POST = ruta({ admin: true }, async ({ solicitud, usuario }) => {
  const entrada = validar(esquemaUsuarioNuevoApi, await leerJson(solicitud));
  const id = exigirUsuarioCreado(await crearUsuario({ usuario, entrada }));
  const creado = await consultarUsuario(id);

  if (!creado) {
    throw noEncontrado("El usuario");
  }

  revalidatePath("/usuarios");

  return responder(formatearUsuarioApi(creado), 201);
});
