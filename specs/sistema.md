# Sistema de ventas y gestión comercial

Fuente de verdad de las reglas de negocio. Un solo archivo, una sección por módulo. Los campos de las tablas viven en `lib/db/schema.ts`.

La consigna del parcial (enunciado del profesor, 29/10/2026) manda sobre esta spec: cuando una regla de acá la contradice, se cambia acá y queda anotado en Decisiones. Entre paréntesis se cita el requerimiento de la consigna (RF-xx) o la regla de negocio (regla n) que cada línea cumple. `[pendiente]` marca una regla ya decidida que todavía no está implementada.

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
- VE-12: del pago con tarjeta se guardan solo tipo (débito o crédito), marca y últimos 4 dígitos; nunca se pide ni se guarda el número completo, y un cuerpo que lo traiga se rechaza (RF-V5, regla 9).
- VE-49: se puede agregar un producto a la venta solo con teclado: escribir en el buscador, recorrer los resultados con las flechas y elegir con Enter.
- VE-50: en el pago de contado se ingresa el monto recibido y se muestra el vuelto; el monto recibido cubre el total, validado en el servidor (RF-V5); si falta, se toma el total, y el comprobante guarda monto y vuelto.
- VE-51: al agregar o cambiar una cantidad se muestra la existencia disponible y no se permite superarla (RF-V4).
- VE-52: el comprador por defecto es consumidor final; un cliente registrado se busca por nombre o documento (RF-V2).

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
- VE-29: una venta confirmada no se edita; solo se puede anular (VE-37 a VE-46).
- VE-32: el número de comprobante tiene punto de venta (4 dígitos) y correlativo (8 dígitos), con el formato `0001-00000001`.
- VE-33: la fecha del comprobante la asigna el servidor al confirmar.
- VE-34: del consumidor final solo se guarda la etiqueta "Consumidor final", sin documento ni otros datos.
- VE-47: el correlativo es por punto de venta y se asigna como el último más uno dentro de la transacción de la venta, así no quedan números salteados.
- VE-48: hay un solo punto de venta, fijo en el código; cambiarlo no altera los comprobantes ya emitidos, que guardan el suyo.

### Anulación

- VE-37: solo un administrador anula una venta, verificado en el servidor.
- VE-38: anular exige escribir un motivo.
- VE-39: una venta anulada no se borra: sigue visible, marcada como anulada, con fecha, usuario y motivo de la anulación.
- VE-40: anular devuelve el stock de cada producto con un movimiento de entrada con origen anulación.
- VE-41: anular una venta en cuenta corriente registra un movimiento de anulación que resta su total del saldo del cliente.
- VE-42: no se anula una venta en cuenta corriente si el saldo del cliente quedaría negativo (por ejemplo, porque ya pagó parte).
- VE-43: una venta anulada no se vuelve a anular.
- VE-44: anular graba la marca, los movimientos de stock y el de cuenta corriente en una sola transacción.
- VE-45: las ventas anuladas no suman en los totales del listado de ventas, no aparecen en las ventas de hoy de Inicio y no cuentan en "más vendidos".
- VE-46: el número de una venta anulada no se reutiliza.

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
- PR-18: el listado de productos se puede ordenar por más recientes, más vendidos, nombre, precio o stock (precio y stock, ascendente y descendente); por defecto, por nombre.
- PR-19: el listado de productos se puede ver como lista o como grilla de tapas.
- PR-20: el orden y la vista elegidos se recuerdan en el navegador.
- PR-21: toda búsqueda del sistema ignora mayúsculas y acentos.
- PR-22: el listado de productos incluye los inactivos, identificados por su estado.
- PR-23: "más vendidos" ordena por unidades vendidas en toda la historia, sin contar ventas anuladas, con los productos sin ventas al final; a igual cantidad, por nombre.
- PR-24: el listado de productos se pagina de a 36; cambiar la búsqueda o el orden vuelve a la primera página.

## Stock

- ST-01: el stock se maneja en unidades enteras.
- ST-02: el stock nunca queda negativo.
- ST-03: todo cambio de stock es un movimiento.
- ST-04: un movimiento tiene tipo (entrada o salida), cantidad, motivo y origen (manual, venta o anulación).
- ST-05: la cantidad de un movimiento es un entero positivo.
- ST-06: el motivo de un movimiento manual es obligatorio.
- ST-07: una salida manual mayor que el stock actual se rechaza en el servidor.
- ST-08: un stock inicial mayor que cero al crear el producto se registra como entrada.
- ST-09: un stock inicial de cero no genera movimiento.
- ST-10: el stock actual coincide con la suma de entradas menos salidas.
- ST-11: se consultan los movimientos de stock de cada producto, del más reciente al más antiguo.
- ST-12: el listado distingue ajustes manuales de movimientos por venta.
- ST-13: un movimiento registrado no se edita ni se elimina.
- ST-14: el stock no se edita directamente: solo cambia por movimientos.
- ST-15: el motivo de un movimiento manual tiene entre 3 y 200 caracteres.
- ST-16: se permiten ajustes manuales sobre productos inactivos.
- ST-17: un producto sin mínimo propio tiene stock bajo cuando le quedan 3 unidades o menos, incluido cero; ese valor es el mínimo inicial de todo producto nuevo.
- ST-18: la sección Stock lista todos los productos con su stock actual, de menor a mayor stock, y se busca por nombre o código.
- ST-19: el listado de stock marca el stock de los productos activos con stock bajo (ST-17).
- ST-20: al entrar a un producto desde Stock se ven su stock actual y sus movimientos, filtrables por origen.
- ST-21: el ajuste manual se registra desde el detalle de stock del producto, eligiendo entrada o salida, cantidad y motivo; desde cada fila del listado de stock se registra una entrada sin salir del listado.
- ST-22: solo el administrador registra ajustes manuales de stock (ingresos y egresos), verificado en el servidor; el operador consulta el stock y sus movimientos pero no ve los controles de ajuste (RF-P4, RF-P5, sección 3).
- ST-23: cada producto tiene un stock mínimo propio (por defecto 3); está bajo el mínimo cuando su stock es menor o igual a ese valor (RF-P1, RF-T1).
- ST-24: cada movimiento muestra la existencia resultante (RF-P6). Se calcula como la suma de entradas menos salidas del producto hasta ese movimiento, y sale en la pantalla de movimientos y en la API.

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
- CC-03: el saldo es la suma de ventas en cuenta corriente menos la suma de anulaciones y de pagos.
- CC-04: se consulta el saldo adeudado.
- CC-05: se listan las ventas en cuenta corriente del cliente.
- CC-06: se consulta el historial de movimientos (ventas y pagos) en orden cronológico.
- CC-07: las ventas de contado o tarjeta no figuran como deuda.
- CC-08: el listado de clientes muestra el saldo de cada uno.
- CC-09: un cliente puede tener un límite de crédito; es opcional y, sin límite, la cuenta corriente no tiene tope.
- CC-10: el límite de crédito es un importe mayor que cero.
- CC-11: una venta en cuenta corriente no puede dejar el saldo del cliente por encima de su límite, validado en el servidor.
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
- US-08: ambos roles emiten y consultan ventas, consultan productos y stock, dan de alta y editan clientes y registran pagos. Solo el administrador anula ventas, da de alta, edita y da de baja productos, registra ajustes de stock y administra usuarios (sección 3).
- US-30: el operador corresponde al rol "vendedor" de la consigna; en la API el rol se llama `operator`.
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
- US-24: al crear un usuario, el administrador elige su rol: administrador u operador.
- US-26: el listado de usuarios muestra primero los activos, ordenados por nombre.
- US-27: el administrador puede cambiar el rol de otro usuario.
- US-28: no se puede pasar a operador ni desactivar al último administrador activo (US-16).
- US-29: un administrador no puede cambiar su propio rol ni desactivarse a sí mismo.
- US-20: cada usuario cambia su propia contraseña desde `/perfil`, indicando la actual (RF-U5). Disponible en la API (`PUT /api/auth/password`) y en la pantalla.
- US-31: el administrador restablece la contraseña de otro usuario con una temporal generada al azar que se muestra una sola vez (RF-U5).

## Inicio

- IN-01: las ventas de hoy son las del día actual en hora de Argentina.
- IN-02: se muestran hasta 15 ventas de hoy, de la más reciente a la más antigua.
- IN-03: se muestran hasta 5 clientes con saldo, de mayor a menor saldo.
- IN-04: la sección Stock bajo lista productos activos con stock bajo (ST-17), de menor a mayor stock, hasta 5.
- IN-05: el inicio muestra ventas del día y del mes (cantidad e importe), total adeudado en cuentas corrientes y cantidad de productos bajo el mínimo (RF-T1). Calculado en `GET /api/tablero` y mostrado en la pantalla.
- IN-06: el inicio muestra con Chart.js las ventas diarias de los últimos 30 días y las del mes por forma de pago (RF-T2). `[pendiente]`
- IN-07: el inicio muestra los 5 productos más vendidos del mes por unidades (RF-T3). Calculado en la API y mostrado en la pantalla.

## Consulta, filtros e impresión

- CO-01: el listado de ventas se filtra por rango de fechas, cliente, forma de pago, vendedor y estado, y se busca por número o nombre del cliente (RF-V8). Disponible en `GET /api/facturas` y en la pantalla de ventas.
- CO-02: el comprobante de venta tiene una vista imprimible con datos del comercio, número, fecha y hora, vendedor, comprador, detalle, total y forma de pago (RF-V7). Se imprime desde el detalle de la venta; los datos del comercio están en `lib/comercio.ts`.
- CO-03: cada pago genera un recibo numerado e imprimible, con numeración propia (RF-C5, regla 4). Se abre desde la cuenta corriente del cliente (`/pagos/[id]`) y se imprime con el diálogo del navegador.
- CO-04: hay una pantalla de saldos (`/saldos`) con los clientes que deben, de mayor a menor, y el total adeudado (RF-C6). Disponible también en `GET /api/clientes?conDeuda=true&orden=saldo`.

## Pendientes de la consigna

Decididos por la consigna y no implementados todavía; cada uno requiere cambio de esquema con migración.

- PE-01: categorías de productos con alta, edición y baja (RF-P7). Reemplaza la decisión del 2026-11-09 que las descartaba.
- PE-02: cliente con tipo de documento (DNI o CUIT), domicilio, habilitación de cuenta corriente y baja lógica (RF-C2, RF-C7, regla 6).
- PE-03: el pago registra su medio: efectivo, transferencia o tarjeta (RF-C5).
- PE-04: el seed carga al menos 2 usuarios (uno por rol), 5 categorías, 30 productos, 10 clientes y 50 facturas en los últimos 30 días, usando los mismos servicios que la app (sección 8 y 10.7).

## API REST

- AP-01: las operaciones del sistema se exponen bajo `/api` con Route Handlers, según la sección 11 de la consigna.
- AP-02: toda ruta exige sesión salvo `POST /api/auth/login`; sin sesión responde 401 y una ruta de administrador responde 403 a un operador.
- AP-03: importes en centavos enteros, fechas ISO 8601 en UTC y filtros de día interpretados en hora de Argentina.
- AP-04: los cuerpos se validan con esquemas estrictos: un campo no previsto (por ejemplo `existencia` o el número completo de tarjeta) responde 422.
- AP-05: todo error tiene la forma `{ error: { code, message, details? } }`; un error inesperado responde 500 sin detalle.
- AP-06: las rutas no contienen reglas: llaman a los mismos servicios de `lib/` que las server actions.

## Interfaz

- IU-01: todo listado muestra un estado mientras carga, un estado vacío que dice qué falta y un estado de error que permite reintentar.

## Abierto

- [abierto] US-22: cómo recibe su contraseña inicial un usuario nuevo: la fija el administrador, la genera el sistema al azar y se muestra una sola vez, o llega un enlace de invitación por correo.
- [abierto] US-23: si el usuario debe cambiar la contraseña inicial en su primer ingreso (requiere un campo nuevo en usuario y una migración).
- [abierto] US-25: si se suma un servicio de correo para invitaciones y avisos (puede tener costo; el proyecto se publica en planes gratuitos).
- [abierto] PR-16: qué imagen definitiva reemplaza al bloque de color de los productos sin imagen (PR-13).

## Descartado

- ARCA y comprobantes fiscales (2026-11-07: el comprobante es interno según el enunciado).
- Descuentos, impuestos, cuotas, intereses, pagos combinados, devoluciones (2026-11-07: fuera del alcance del enunciado).
- Asignación de pagos a facturas concretas (2026-11-07: los pagos reducen el saldo global).
- Borrado físico de productos y usuarios (2026-11-07: el enunciado exige baja lógica).
- Multiempresa, multidepósito, multimoneda, cantidades decimales (2026-11-07: una empresa, un depósito, pesos, unidades enteras).
- Roles y permisos configurables (2026-11-07: fuera del alcance del enunciado).
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
- 2026-11-07: el origen de un movimiento de stock es manual o venta; el stock inicial se registra como entrada manual, y las ventas solo generan salidas. (Reemplazada en parte por la del 2026-11-11: las anulaciones suman el origen anulación, con entradas.)
- 2026-11-07: reglas de integridad también en la base (checks e índices únicos) además del servidor: motivo manual obligatorio, documento numérico, subtotal = precio × cantidad, un movimiento de deuda por venta.
- 2026-11-07: sin Neon Auth (login con Better Auth); sin fecha duplicada en movimientos de cuenta, porque la spec no la pide.
- 2026-11-08: la imagen del producto se guarda como dirección externa y no como archivo subido, para no sumar un servicio de almacenamiento a los planes gratuitos.
- 2026-11-08: el umbral de stock bajo es un valor fijo de 3 unidades y no un mínimo por producto, para no sumar un campo ni una migración.
- 2026-11-08: el seed incluye clientes, productos y ventas de demostración, porque no es un proyecto real y sirve para ver las pantallas con contenido.
- 2026-11-10: el seed genera stock, clientes, ventas, pagos y ajustes manuales de stock al azar en cada corrida, con rangos ajustables en su configuración, para probar las pantallas con datos distintos; el catálogo de juegos queda fijo porque sus tapas están asociadas a mano. Los motivos de los ajustes son cortos y fijos, sin resolver ST-15. (ST-15 se resolvió el 2026-11-14; los motivos del seed salen de las mismas sugerencias que la pantalla de ajuste.)
- 2026-11-10: el seed acepta `--reiniciar`, que borra físicamente los datos de demostración (no los usuarios) para volver a generarlos; es una herramienta de desarrollo y no contradice la baja lógica de la app, que sigue sin borrar productos, usuarios ni clientes.
- 2026-11-08: el sistema usa siempre modo oscuro, sin versión clara ni selector de tema: una sola paleta (negro, escala neutral y verde de marca) mantiene la identidad y simplifica el diseño.
- 2026-11-08: el rol es un enum en la base y no texto libre, para que solo existan los dos roles de US-07.
- 2026-11-08: el proxy valida la sesión completa contra la base y no solo la cookie, para que ni un usuario inactivo ni un rol incorrecto vean la pantalla un instante.
- 2026-11-09: sin categoría, plataforma ni entidad aparte para juegos y consolas: ninguna regla de venta, stock o comprobante cambia según el tipo de producto y ninguna pantalla obligatoria lo usa; el mismo juego en dos plataformas son dos productos con código y stock propios.
- 2026-11-09: el orden y la vista de productos se guardan en una cookie y no por usuario en la base, para que el servidor renderice la preferencia en la primera carga, sin un campo ni una migración; se adelantan a lo obligatorio por pedido del desarrollador.
- 2026-11-09: la búsqueda ignora acentos con `translate`, nativa de Postgres, y no con la extensión `unaccent` ni con una collation no determinista, para no sumar una migración.
- 2026-11-10: los importes que se escriben aceptan coma decimal (`45999,90`, también `45.999,90`) además de punto, porque es como se escriben en Argentina; se normalizan a punto antes de validar y guardar.
- 2026-11-10: PR-17 resuelto: las imágenes de los productos no se alojan en el sistema; se usa la dirección de la tapa en IGDB (`images.igdb.com`), que el formulario explica cómo copiar, en línea con no sumar un servicio de almacenamiento.
- 2026-11-10: US-24 resuelto: el administrador elige el rol al crear un usuario, igual que puede cambiarlo después (US-27); así sumar otro administrador no obliga a crear un operador y ascenderlo.
- 2026-11-11: la base pasa de Postgres (Neon) a Turso (libSQL/SQLite) por requerimiento del profesor. Consecuencias: los importes se guardan en centavos enteros, porque SQLite no tiene decimales exactos; el número de comprobante se asigna como el máximo más uno dentro de la transacción de la venta, porque no hay secuencias; VE-22 y PA-07 se apoyan en que toda transacción de libSQL toma el lock de escritura al empezar (no existe `FOR UPDATE`) y en el check de stock no negativo; los enums son texto con check; la búsqueda ignora mayúsculas y acentos con un patrón `GLOB` armado en el servidor, que reemplaza a la decisión del 2026-11-09 sobre `translate`; el día de una venta se calcula con el desfase fijo de Argentina (UTC−3).
- 2026-11-11: se permite anular ventas, porque la consigna del parcial lo pregunta en la defensa; reemplaza la parte de VE-29 que lo prohibía. Solo la anula un administrador y con motivo, como las demás acciones sensibles, y se rechaza si dejaría el saldo del cliente negativo, para no manejar saldos a favor. La venta no se borra: queda marcada, y stock y cuenta se corrigen con movimientos nuevos, para mantener el historial auditable.
- 2026-11-11: límite de crédito opcional por cliente, porque la consigna lo pregunta; vacío significa sin tope, para que el alta rápida durante una venta siga igual.
- 2026-11-11: el número de comprobante suma un punto de venta fijo (`0001-00000001`), guardado en cada venta, porque la consigna pide poder cambiarlo; reemplaza el correlativo simple de VE-32. El correlativo se calcula dentro de la transacción (no con un autoincremental) para que no queden números salteados.
- 2026-11-11: el buscador de la venta se recorre con flechas y se elige con Enter (VE-49), y las pantallas tienen un estado de error con reintento (IU-01), porque la consigna los pregunta en la defensa.
- 2026-11-14: la sección Stock muestra primero el stock actual de cada producto y los movimientos por producto, en lugar de un historial general, porque la pregunta habitual en el mostrador es cuántas unidades quedan; reemplaza el historial general de ST-11.
- 2026-11-14: el motivo de un ajuste manual va de 3 a 200 caracteres, para que diga algo útil sin volverse una nota larga; resuelve ST-15.
- 2026-11-14: el ajuste manual de stock lo hacían los dos roles. (Reemplazada el 2026-11-14 por ST-22.)
- 2026-11-14: los ajustes manuales de stock pasan a ser solo del administrador (ST-22), porque la tabla de permisos de la consigna (sección 3) lo exige: el vendedor no toca el stock. Reemplaza la decisión anterior que se los permitía a los dos roles.
- 2026-11-15: alta y edición de productos pasan a ser solo del administrador (US-08), por la tabla de permisos de la consigna; el operador consulta catálogo y stock, y no ve el botón Nuevo producto ni la ficha de edición.
- 2026-11-14: la consigna del profesor tiene prioridad sobre las decisiones propias; donde choquen, se adapta la spec y se anota acá.
- 2026-11-14: gráficos, filtros del listado de ventas e impresión de comprobantes y recibos dejan de estar descartados (CO-01 a CO-03, IN-06), porque la consigna los pide (RF-V7, RF-V8, RF-C5, RF-T2).
- 2026-11-14: el pago con tarjeta guarda tipo, marca y últimos 4 dígitos (VE-12), y el de contado el monto recibido y el vuelto (VE-50), porque la consigna lo pide (RF-V5, regla 9); reemplaza la tarjeta sin datos. Implementado el 2026-11-16 (migración `0002`); las ventas anteriores a la migración quedan con esos campos vacíos.
- 2026-11-14: se suma la API REST de la consigna (sección 11) en `app/api`, como adaptador sobre los servicios existentes; las pantallas siguen usando server actions, que llaman a los mismos servicios.
- 2026-11-14: US-20 resuelto: cada usuario cambia su propia contraseña, porque la consigna lo pide (RF-U5).
- 2026-11-14: la venta y el ajuste de stock descuentan con condición (`stock >= cantidad`) y abortan si no se modificó la fila, como pide la consigna (sección 10.2), además del check de la base.
- 2026-11-10: un administrador no se cambia el rol ni se desactiva a sí mismo (US-29), como en la mayoría de los sistemas, para que nadie se quede afuera por error en medio de su propia sesión; el cambio lo hace otro administrador.
- 2026-11-14: US-22 resuelto: el administrador fija la contraseña inicial al crear el usuario. El alta inserta user y account directo con el hash de Better Auth, para no abrir sesión como el usuario nuevo.
- 2026-11-16: los filtros del listado de ventas viajan en la URL (formulario GET), para paginar y compartir con ellos; la cantidad y el total de cada día respetan el filtro, y con el estado "anuladas" el día muestra solo la cantidad, porque las anuladas no suman en los totales (VE-45). Los selectores de cliente y vendedor ofrecen solo quienes tienen ventas.
- 2026-11-16: el comprobante se imprime con el diálogo del navegador y una hoja de estilos de impresión (blanco y negro, sin librerías), para no sumar una dependencia; indica que es un comprobante interno sin validez fiscal, porque ARCA está descartado. El comercio se configura en `lib/comercio.ts`.
- 2026-11-16: la pantalla de saldos es una página propia y no un filtro del listado de clientes, porque la consigna la pide como pantalla (RF-C6); reutiliza `listarClientes` con `conDeuda`, así que el total y el orden salen del mismo servicio que la API.
- 2026-11-16: el recibo de cada pago lleva un número propio, correlativo entre todos los pagos e independiente del de las facturas, guardado en `recibo_numero` del movimiento de cuenta; se asigna como el último más uno dentro de la transacción del pago, igual que el de las ventas. Los pagos anteriores a la migración se numeraron por orden de fecha (migración `0004`). Se muestra con el formato `0001-00000001`.
- 2026-11-16: el recibo se muestra en `/pagos/[id]` y reutiliza la hoja de estilos de impresión del comprobante; indica el saldo actual del cliente y no el de la fecha del pago, porque el saldo se deriva y no se guarda por movimiento. El recibo sale con el punto de venta fijo del código, igual que el comprobante nuevo.
- 2026-11-16: la existencia resultante de cada movimiento se calcula en la consulta (suma acumulada por producto, ordenada por fecha y número) y no se guarda, igual que el saldo de las cuentas, para que no se desincronice ni requiera migración.
- 2026-11-16: `/perfil` se abre desde el pie de la barra lateral, junto a Cerrar sesión, y no como sección del menú, porque es un dato propio del usuario y no una herramienta de trabajo; al cambiar la contraseña se cierran las demás sesiones del usuario.
- 2026-11-16: los indicadores y los más vendidos del Inicio salen de `obtenerTablero`, el mismo servicio de `GET /api/tablero`, para que pantalla y API den siempre las mismas cifras; "Cuentas por cobrar" enlaza a la pantalla de saldos.
- 2026-11-16: el stock mínimo pasa a ser un campo de cada producto (`stock_minimo`, por defecto 3), porque la consigna lo pide (RF-P1, RF-T1); reemplaza la decisión del 2026-11-08 del umbral fijo. Su regla (entero no negativo) vive en Zod y no en un check de la base, para no reconstruir la tabla.
