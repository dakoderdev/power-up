# Sistema de ventas y gestión comercial

Fuente de verdad de las reglas de negocio. Un solo archivo, una sección por módulo. Los campos de las tablas viven en `lib/db/schema.ts`.

## Ventas y comprobantes

### Armado de la venta

- VE-01: una venta tiene un cliente: consumidor final o un cliente registrado.
- VE-02: una venta tiene al menos un producto.
- VE-03: solo se pueden agregar productos activos del catálogo.
- VE-04: la cantidad de cada producto es un entero positivo.
- VE-05: mientras se arma la venta se pueden agregar y quitar productos y cambiar cantidades.
- VE-06: el subtotal de cada línea es precio unitario × cantidad.
- VE-07: el total es la suma de los subtotales.
- VE-08: subtotales y total se actualizan al cambiar el detalle.
- VE-09: la forma de pago es una sola por venta: contado, tarjeta o cuenta corriente.
- VE-10: se puede dar de alta un cliente durante la venta sin perder lo ya cargado.
- VE-11: el cliente recién creado queda seleccionado en la venta.
- VE-12: el pago con tarjeta es simulado; no se piden ni guardan datos de tarjeta.

### Confirmación

- VE-13: antes de confirmar, el servidor verifica stock suficiente de todos los productos.
- VE-14: si falta stock, se informa qué productos fallan y se permite corregir la venta.
- VE-15: cuenta corriente solo se admite con cliente registrado, validado en el servidor.
- VE-16: el servidor toma precio y descripción del producto al confirmar, no los del cliente.
- VE-17: confirmar graba comprobante, detalle, movimientos de stock y deuda en una sola transacción.
- VE-18: si algo falla, no queda comprobante, descuento de stock ni deuda.
- VE-19: cada producto vendido genera un movimiento de salida con origen venta.
- VE-20: contado y tarjeta no generan deuda.
- VE-21: cuenta corriente suma el total al saldo del cliente.
- VE-22: dos confirmaciones simultáneas no pueden dejar el stock negativo.

### Comprobante

- VE-23: el comprobante tiene número único.
- VE-24: el comprobante guarda fecha, cliente, detalle, total y forma de pago.
- VE-25: el comprobante guarda copia de código, descripción, cantidad, precio unitario y subtotal de cada línea.
- VE-26: el comprobante guarda copia del nombre y documento del cliente al momento de la venta.
- VE-27: un comprobante no se recalcula ni cambia si luego cambian producto o cliente.
- VE-28: un producto pasado a inactivo sigue visible en sus comprobantes viejos.
- VE-29: una venta confirmada no se edita ni se anula.
- VE-32: el número de comprobante es un correlativo entero simple.
- VE-33: la fecha del comprobante la asigna el servidor al confirmar.
- VE-34: del consumidor final solo se guarda la etiqueta "Consumidor final", sin documento ni otros datos.

### Consulta

- VE-30: hay un listado de ventas, de la más reciente a la más antigua.
- VE-31: cada comprobante tiene una vista de detalle.
- VE-35: el listado de ventas se agrupa por día (hora de Argentina), y cada día muestra su cantidad de ventas y su total.
- VE-36: el listado de ventas se pagina de a 30.

## Productos

- PR-01: se puede dar de alta, consultar y modificar un producto.
- PR-02: un producto tiene código, nombre, precio de venta, stock actual y estado activo/inactivo, y puede tener imagen (PR-12).
- PR-03: el código es único.
- PR-04: el precio es mayor que cero.
- PR-05: se busca por nombre o código.
- PR-06: la baja es lógica (pasar a inactivo); no se borra físicamente.
- PR-07: un producto inactivo no se puede agregar a ventas nuevas, validado en el servidor.
- PR-08: un producto inactivo sigue apareciendo en los comprobantes anteriores.
- PR-09: cambiar precio o nombre no modifica comprobantes existentes.
- PR-10: el nombre tiene hasta 120 caracteres y el código hasta 30.
- PR-11: un producto inactivo se puede reactivar editando su estado.
- PR-12: un producto puede tener una imagen, indicada como dirección https; es opcional.
- PR-13: un producto sin imagen muestra un bloque de color en su lugar.
- PR-14: la imagen se muestra en el listado de productos, al elegir productos para una venta y en los listados de Inicio (ventas de hoy y productos con stock bajo).
- PR-15: la imagen no forma parte del comprobante; los listados de ventas la toman del producto actual, sin copia.
- PR-18: el listado de productos se puede ordenar por más recientes, más vendidos, nombre o precio (ascendente y descendente); por defecto, por nombre.
- PR-19: el listado de productos se puede ver como lista o como grilla de tapas.
- PR-20: el orden y la vista elegidos se recuerdan en el navegador.
- PR-21: toda búsqueda del sistema ignora mayúsculas y acentos.
- PR-22: el listado de productos incluye los inactivos, identificados por su estado.
- PR-23: "más vendidos" ordena por unidades vendidas en toda la historia, con los productos sin ventas al final; a igual cantidad, por nombre.
- PR-24: el listado de productos se pagina de a 32; cambiar la búsqueda o el orden vuelve a la primera página.

## Stock

- ST-01: el stock se maneja en unidades enteras.
- ST-02: el stock nunca queda negativo.
- ST-03: todo cambio de stock es un movimiento.
- ST-04: un movimiento tiene tipo (entrada o salida), cantidad, motivo y origen (manual o venta).
- ST-05: la cantidad de un movimiento es un entero positivo.
- ST-06: el motivo de un movimiento manual es obligatorio.
- ST-07: una salida manual mayor que el stock actual se rechaza en el servidor.
- ST-08: un stock inicial mayor que cero al crear el producto se registra como entrada.
- ST-09: un stock inicial de cero no genera movimiento.
- ST-10: el stock actual coincide con la suma de entradas menos salidas.
- ST-11: se consultan los movimientos de stock.
- ST-12: el listado distingue ajustes manuales de movimientos por venta.
- ST-13: un movimiento registrado no se edita ni se elimina.
- ST-14: el stock no se edita directamente: solo cambia por movimientos.
- ST-16: se permiten ajustes manuales sobre productos inactivos.
- ST-17: un producto tiene stock bajo cuando le quedan 3 unidades o menos, incluido cero.

## Clientes

- CL-01: se puede dar de alta, consultar y modificar un cliente.
- CL-02: un cliente tiene nombre y apellido o razón social, documento o identificación y un dato de contacto.
- CL-03: nombre y documento son obligatorios.
- CL-04: hay al menos un dato de contacto.
- CL-05: se busca por nombre o documento.
- CL-06: los clientes no se eliminan.
- CL-07: modificar un cliente no altera los comprobantes existentes.
- CL-08: el alta durante una venta usa las mismas reglas que el alta normal.
- CL-09: el documento del cliente es único.
- CL-10: el documento no puede estar vacío y es numérico; no se valida el formato de DNI ni CUIT.

## Cuentas corrientes y pagos

- CC-01: cada cliente registrado tiene una cuenta corriente.
- CC-02: el consumidor final no tiene cuenta corriente.
- CC-03: el saldo es la suma de ventas en cuenta corriente menos la suma de pagos.
- CC-04: se consulta el saldo adeudado.
- CC-05: se listan las ventas en cuenta corriente del cliente.
- CC-06: se consulta el historial de movimientos (ventas y pagos) en orden cronológico.
- CC-07: las ventas de contado o tarjeta no figuran como deuda.
- CC-08: el listado de clientes muestra el saldo de cada uno.
- PA-01: un pago tiene fecha, importe y observación opcional.
- PA-02: el importe es mayor que cero.
- PA-03: un pago no puede superar el saldo adeudado, validado en el servidor.
- PA-04: un cliente con saldo cero no admite pagos.
- PA-05: el pago reduce el saldo global del cliente, sin asignarse a una venta concreta.
- PA-06: un pago registrado no se edita ni se anula.
- PA-07: dos pagos simultáneos no pueden dejar el saldo negativo.
- PA-08: la fecha del pago la asigna el servidor al registrarlo.

## Usuarios y acceso

Login y sesiones los maneja Better Auth; acá solo las reglas de negocio.

- US-01: toda pantalla y server action requiere sesión iniciada.
- US-02: sin sesión se redirige al inicio de sesión.
- US-03: se puede cerrar la sesión.
- US-04: un usuario inactivo no inicia sesión.
- US-05: desactivar un usuario cierra sus sesiones abiertas.
- US-06: las contraseñas se guardan hasheadas, nunca en texto plano.
- US-07: hay dos roles: administrador y operador.
- US-08: ambos roles operan ventas, productos, clientes, stock y pagos.
- US-09: la administración de usuarios es solo del administrador.
- US-10: rol y estado activo se verifican en el servidor en cada server action que lo requiera.
- US-11: el menú no muestra la sección de usuarios a un operador.
- US-12: el administrador consulta, crea, edita y activa o desactiva usuarios.
- US-13: un usuario tiene nombre, correo o nombre de acceso, contraseña, rol y estado activo.
- US-14: el correo o nombre de acceso es único.
- US-15: los usuarios no se borran físicamente.
- US-16: el sistema no puede quedar sin ningún administrador activo.
- US-17: el primer administrador se crea con el seed o un script de inicialización.
- US-18: las credenciales de evaluación se documentan en el README.
- US-19: el administrador puede cambiar la contraseña de otro usuario.
- US-21: la contraseña tiene al menos 8 caracteres.

## Inicio

- IN-01: las ventas de hoy son las del día actual en hora de Argentina.
- IN-02: se muestran hasta 15 ventas de hoy, de la más reciente a la más antigua.
- IN-03: se muestran hasta 5 clientes con saldo, de mayor a menor saldo.
- IN-04: la sección Stock bajo lista productos activos con stock bajo (ST-17), de menor a mayor stock, hasta 5.

## Abierto

- [abierto] ST-15: largo mínimo y máximo del motivo de un movimiento manual (por qué se ajusta el stock, p. ej. "rotura" o "conteo de inventario").
- [abierto] US-20: si cada usuario puede cambiar su propia contraseña (a revisar al final, opcional).
- [abierto] US-22: cómo recibe su contraseña inicial un usuario nuevo: la fija el administrador, la genera el sistema al azar y se muestra una sola vez, o llega un enlace de invitación por correo.
- [abierto] US-23: si el usuario debe cambiar la contraseña inicial en su primer ingreso (requiere un campo nuevo en usuario y una migración).
- [abierto] US-24: si el administrador elige el rol (administrador u operador) al crear un usuario, o solo crea operadores y los administradores salen del seed.
- [abierto] US-25: si se suma un servicio de correo para invitaciones y avisos (puede tener costo; el proyecto se publica en planes gratuitos).
- [abierto] PR-16: qué imagen definitiva reemplaza al bloque de color de los productos sin imagen (PR-13).
- [abierto] PR-17: dónde se alojan las imágenes reales de los productos; las direcciones externas, como las de Wikimedia, pueden limitar su uso directo.

## Descartado

- ARCA y comprobantes fiscales (2026-11-07: el comprobante es interno según el enunciado).
- Descuentos, impuestos, cuotas, intereses, pagos combinados, devoluciones (2026-11-07: fuera del alcance del enunciado).
- Asignación de pagos a facturas concretas (2026-11-07: los pagos reducen el saldo global).
- Borrado físico de productos y usuarios (2026-11-07: el enunciado exige baja lógica).
- Multiempresa, multidepósito, multimoneda, cantidades decimales (2026-11-07: una empresa, un depósito, pesos, unidades enteras).
- Roles y permisos configurables, gráficos, filtros de ventas e impresión (2026-11-07: opcionales, solo con lo obligatorio terminado).
- Auth propia (2026-11-07: la maneja Better Auth).

## Decisiones

- 2026-11-07: el precio lo fija el servidor al confirmar para evitar manipulación desde el cliente.
- 2026-11-07: el stock no se edita a mano; todo cambio pasa por un movimiento para mantener el historial auditable.
- 2026-11-07: el saldo se deriva de ventas y pagos en lugar de guardarse como campo, para que no se desincronice.
- 2026-11-07: comprobante con correlativo simple y fecha asignada por el servidor, igual que los pagos, para que nadie pueda falsear fechas.
- 2026-11-07: documento de cliente único y solo numérico, para evitar duplicados sin atar el sistema a un formato fiscal.
- 2026-11-07: el administrador puede cambiar contraseñas ajenas para recuperar accesos; mínimo de 8 caracteres.
- 2026-11-07: los productos inactivos se pueden reactivar y ajustar, para poder corregir existencias.
- 2026-11-07: el rol se verifica en el servidor; ocultar el menú es solo comodidad de UI.
- 2026-11-07: el origen de un movimiento de stock es manual o venta; el stock inicial se registra como entrada manual, y las ventas solo generan salidas.
- 2026-11-07: reglas de integridad también en la base (checks e índices únicos) además del servidor: motivo manual obligatorio, documento numérico, subtotal = precio × cantidad, un movimiento de deuda por venta.
- 2026-11-07: sin Neon Auth (login con Better Auth); sin fecha duplicada en movimientos de cuenta, porque la spec no la pide.
- 2026-11-08: la imagen del producto se guarda como dirección externa y no como archivo subido, para no sumar un servicio de almacenamiento a los planes gratuitos.
- 2026-11-08: el umbral de stock bajo es un valor fijo de 3 unidades y no un mínimo por producto, para no sumar un campo ni una migración.
- 2026-11-08: el seed incluye clientes, productos y ventas de demostración, porque no es un proyecto real y sirve para ver las pantallas con contenido.
- 2026-11-08: el sistema usa siempre modo oscuro, sin versión clara ni selector de tema: una sola paleta (negro, escala neutral y verde de marca) mantiene la identidad y simplifica el diseño.
- 2026-11-08: el rol es un enum en la base y no texto libre, para que solo existan los dos roles de US-07.
- 2026-11-08: el proxy valida la sesión completa contra la base y no solo la cookie, para que ni un usuario inactivo ni un rol incorrecto vean la pantalla un instante.
- 2026-11-09: sin categoría, plataforma ni entidad aparte para juegos y consolas: ninguna regla de venta, stock o comprobante cambia según el tipo de producto y ninguna pantalla obligatoria lo usa; el mismo juego en dos plataformas son dos productos con código y stock propios.
- 2026-11-09: el orden y la vista de productos se guardan en una cookie y no por usuario en la base, para que el servidor renderice la preferencia en la primera carga, sin un campo ni una migración; se adelantan a lo obligatorio por pedido del desarrollador.
- 2026-11-09: la búsqueda ignora acentos con `translate`, nativa de Postgres, y no con la extensión `unaccent` ni con una collation no determinista, para no sumar una migración.
