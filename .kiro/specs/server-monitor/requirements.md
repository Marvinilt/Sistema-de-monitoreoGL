# Documento de Requisitos: Monitor de Servidores e Infraestructura

## Introducción

Esta aplicación permite a los administradores de sistemas monitorear en tiempo real el estado de sus servidores e infraestructura. Incluye verificación de puertos, monitoreo de URLs de sitios IIS, verificación de disponibilidad HTTPS y un dashboard visual interactivo que muestra el estado general de cada servidor (OK o Alerta).

## Glosario

- **Monitor**: El sistema principal de monitoreo de servidores e infraestructura.
- **Servidor**: Máquina registrada en el sistema con una dirección IP o hostname.
- **Puerto**: Punto de comunicación de red identificado por un número (0-65535).
- **URL**: Dirección web de un sitio publicado en IIS que será monitoreada.
- **Sitio_IIS**: Sitio web publicado mediante Internet Information Services en un servidor.
- **Verificador_Puertos**: Componente encargado de comprobar la conectividad de puertos TCP.
- **Verificador_HTTPS**: Componente encargado de comprobar la disponibilidad y validez de sitios HTTPS.
- **Dashboard**: Panel visual principal que muestra el estado consolidado de todos los servidores.
- **Estado_OK**: Condición en la que todos los puertos y URLs de un servidor responden correctamente.
- **Estado_Alerta**: Condición en la que al menos un puerto o URL de un servidor presenta un problema.
- **Gestor_Configuracion**: Componente encargado de almacenar y recuperar la configuración de servidores y URLs.

---

## Requisitos

### Requisito 1: Gestión de Servidores

**Historia de Usuario:** Como administrador de sistemas, quiero agregar y gestionar servidores en el sistema, para poder monitorear su estado de forma centralizada.

#### Criterios de Aceptación

1. WHEN un usuario envía un formulario con nombre, dirección IP o hostname de un servidor, THE Gestor_Configuracion SHALL registrar el servidor en el sistema y hacerlo disponible para monitoreo.
2. WHEN un usuario solicita eliminar un servidor, THE Gestor_Configuracion SHALL eliminar el servidor y todos sus puertos y URLs asociados del sistema.
3. THE Gestor_Configuracion SHALL persistir la configuración de servidores entre reinicios de la aplicación.
4. IF un usuario intenta registrar un servidor con una dirección IP o hostname duplicado, THEN THE Gestor_Configuracion SHALL rechazar el registro y mostrar un mensaje de error descriptivo.
5. THE Monitor SHALL mostrar en el dashboard la lista completa de servidores registrados con su estado actual.

---

### Requisito 2: Gestión de Puertos por Servidor

**Historia de Usuario:** Como administrador de sistemas, quiero configurar los puertos a monitorear en cada servidor, para verificar que los servicios de red estén disponibles.

#### Criterios de Aceptación

1. WHEN un usuario agrega un número de puerto (0-65535) a un servidor existente, THE Gestor_Configuracion SHALL asociar ese puerto al servidor para su monitoreo.
2. WHEN un usuario solicita eliminar un puerto de un servidor, THE Gestor_Configuracion SHALL remover ese puerto de la lista de monitoreo del servidor.
3. IF un usuario intenta agregar un número de puerto fuera del rango 0-65535, THEN THE Gestor_Configuracion SHALL rechazar la operación y mostrar un mensaje de error.
4. IF un usuario intenta agregar un puerto duplicado al mismo servidor, THEN THE Gestor_Configuracion SHALL rechazar la operación y mostrar un mensaje de error.

---

### Requisito 3: Gestión de URLs por Servidor

**Historia de Usuario:** Como administrador de sistemas, quiero configurar las URLs de sitios IIS a monitorear en cada servidor, para verificar su disponibilidad.

#### Criterios de Aceptación

1. WHEN un usuario agrega una URL a un servidor existente, THE Gestor_Configuracion SHALL asociar esa URL al servidor para su monitoreo.
2. WHEN un usuario solicita eliminar una URL de un servidor, THE Gestor_Configuracion SHALL remover esa URL de la lista de monitoreo del servidor.
3. IF un usuario intenta agregar una URL con formato inválido, THEN THE Gestor_Configuracion SHALL rechazar la operación y mostrar un mensaje de error descriptivo.
4. IF un usuario intenta agregar una URL duplicada al mismo servidor, THEN THE Gestor_Configuracion SHALL rechazar la operación y mostrar un mensaje de error.
5. WHERE el protocolo de la URL sea HTTPS, THE Verificador_HTTPS SHALL incluir la validación del certificado SSL en el monitoreo.

---

### Requisito 4: Verificación de Puertos

**Historia de Usuario:** Como administrador de sistemas, quiero que el sistema verifique automáticamente la conectividad de los puertos configurados, para detectar servicios caídos.

#### Criterios de Aceptación

1. WHEN se ejecuta una verificación, THE Verificador_Puertos SHALL intentar establecer una conexión TCP al puerto especificado en el servidor objetivo.
2. WHEN la conexión TCP al puerto es exitosa, THE Verificador_Puertos SHALL registrar el estado del puerto como "abierto".
3. WHEN la conexión TCP al puerto falla o supera el tiempo de espera, THE Verificador_Puertos SHALL registrar el estado del puerto como "cerrado" o "sin respuesta".
4. THE Verificador_Puertos SHALL completar cada verificación de puerto en un máximo de 5 segundos.
5. WHEN se completa la verificación de todos los puertos de un servidor, THE Monitor SHALL actualizar el estado del servidor en el dashboard.

---

### Requisito 5: Verificación de URLs e HTTPS

**Historia de Usuario:** Como administrador de sistemas, quiero que el sistema verifique la disponibilidad de los sitios IIS publicados con HTTPS, para asegurar que los sitios estén accesibles y con certificados válidos.

#### Criterios de Aceptación

1. WHEN se ejecuta una verificación, THE Verificador_HTTPS SHALL realizar una solicitud HTTP GET a cada URL configurada.
2. WHEN la URL responde con un código HTTP entre 200 y 399, THE Verificador_HTTPS SHALL registrar el estado de la URL como "disponible".
3. WHEN la URL responde con un código HTTP 400 o superior, o no responde, THE Verificador_HTTPS SHALL registrar el estado de la URL como "no disponible" junto con el código de error.
4. WHEN una URL HTTPS presenta un certificado SSL inválido, vencido o no confiable, THE Verificador_HTTPS SHALL registrar el estado como "error de certificado" y marcarlo como alerta.
5. THE Verificador_HTTPS SHALL completar cada verificación de URL en un máximo de 10 segundos.
6. WHEN se completa la verificación de todas las URLs de un servidor, THE Monitor SHALL actualizar el estado del servidor en el dashboard.

---

### Requisito 6: Monitoreo Automático Periódico

**Historia de Usuario:** Como administrador de sistemas, quiero que el sistema ejecute verificaciones periódicas automáticamente, para mantener el estado actualizado sin intervención manual.

#### Criterios de Aceptación

1. THE Monitor SHALL ejecutar verificaciones automáticas de todos los servidores, puertos y URLs configurados en intervalos regulares configurables.
2. WHEN el intervalo de monitoreo es configurado por el usuario, THE Monitor SHALL aplicar el nuevo intervalo en el siguiente ciclo de verificación.
3. THE Monitor SHALL permitir configurar el intervalo de monitoreo entre 30 segundos y 60 minutos.
4. IF el intervalo configurado está fuera del rango permitido (30 segundos - 60 minutos), THEN THE Monitor SHALL rechazar la configuración y mostrar un mensaje de error.
5. WHEN una verificación automática detecta un cambio de estado en un servidor, THE Monitor SHALL actualizar el dashboard inmediatamente.

---

### Requisito 7: Dashboard Visual e Interactivo

**Historia de Usuario:** Como administrador de sistemas, quiero un dashboard visual e interactivo que muestre el estado de todos los servidores, para identificar rápidamente problemas en la infraestructura.

#### Criterios de Aceptación

1. THE Dashboard SHALL mostrar una tarjeta visual por cada servidor registrado con su estado actual (OK o Alerta).
2. WHEN el estado de un servidor es Estado_OK, THE Dashboard SHALL mostrar la tarjeta del servidor con indicadores visuales en color verde.
3. WHEN el estado de un servidor es Estado_Alerta, THE Dashboard SHALL mostrar la tarjeta del servidor con indicadores visuales en color rojo o naranja.
4. WHEN un usuario hace clic en la tarjeta de un servidor, THE Dashboard SHALL mostrar el detalle de todos los puertos y URLs de ese servidor con sus estados individuales.
5. THE Dashboard SHALL mostrar un resumen global con el conteo de servidores en Estado_OK y servidores en Estado_Alerta.
6. WHEN se actualiza el estado de cualquier servidor, THE Dashboard SHALL reflejar el cambio visualmente sin requerir recarga manual de la página.
7. THE Dashboard SHALL mostrar la fecha y hora de la última verificación realizada para cada servidor.

---

### Requisito 8: Verificación Manual

**Historia de Usuario:** Como administrador de sistemas, quiero poder ejecutar una verificación manual de un servidor o de toda la infraestructura, para obtener el estado actualizado de forma inmediata.

#### Criterios de Aceptación

1. WHEN un usuario solicita una verificación manual de un servidor específico, THE Monitor SHALL ejecutar inmediatamente la verificación de todos los puertos y URLs de ese servidor.
2. WHEN un usuario solicita una verificación manual de toda la infraestructura, THE Monitor SHALL ejecutar inmediatamente la verificación de todos los servidores registrados.
3. WHILE una verificación manual está en progreso, THE Dashboard SHALL mostrar un indicador visual de carga para el servidor o servidores siendo verificados.
4. WHEN la verificación manual finaliza, THE Dashboard SHALL actualizar el estado y la marca de tiempo de la última verificación.
