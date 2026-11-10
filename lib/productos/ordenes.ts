export const ORDENES = {
  recientes: "Más recientes",
  vendidos: "Más vendidos",
  nombre: "Nombre (A-Z)",
  precio_menor: "Precio: menor a mayor",
  precio_mayor: "Precio: mayor a menor",
};

export type Orden = keyof typeof ORDENES;

export const ORDEN_INICIAL: Orden = "nombre";

export const COOKIE_VISTA = "productos_vista";
export const COOKIE_ORDEN = "productos_orden";
