# Documentación de Dockerización (Sistema de Monitoreo GL)

Esta documentación explica cómo utilizar los archivos Docker provistos para levantar de forma orquestada el backend y el frontend (con Nginx) del Sistema de Monitoreo GL.

## Archivos Creados

1. **`backend/Dockerfile`**: Configuración para construir y correr el backend en Node 20.
2. **`frontend/Dockerfile`**: Configuración multi-fase (Multi-stage). Compila la aplicación de React/Vite usando Node 20 y luego sirve los archivos estáticos usando Nginx.
3. **`frontend/nginx.conf`**: Archivo de configuración de Nginx que se inyecta en el contenedor de frontend. Sirve el React Router y efectúa un reverse proxy hacia el backend (`/api` y `/ws`) para evadir problemas de CORS.
4. **`docker-compose.yml`**: Define la orquestación de ambos contenedores, su mapeo de puertos y volúmenes.

## Puertos Expuestos

- **Frontend (`8080`)**: El contenedor de frontend expone el puerto 80 del Nginx hacia el puerto 8080 del host. La interfaz web es accesible a través de `http://localhost:8080`.
- **Backend (`3001`)**: El contenedor expone el puerto 3001, lo cual permite acceso directo al motor backend (aunque la UI se comunica vía proxy inverso sobre Nginx internamente por el puerto 80).

## Redes y Comunicación

`docker-compose` automáticamente crea una red interna donde ambos servicios (`frontend` y `backend`) pueden resolverse por su nombre. La configuración de Nginx (`frontend/nginx.conf`) redirige todo el tráfico a `/api/` y `/ws` al nombre DNS `backend` (resolviendo la IP de la red de Docker).

## Mapeo de Volúmenes (Persistencia)

- **`./backend/data:/app/data`**: El directorio de data del host se mapea al contenedor backend. Todos los archivos JSON como `config.json` y `notifications.json` persisten aunque los contenedores se destruyan.

## Comandos para Levantar los Contenedores

1. **Construir y Levantar en Segundo Plano (Recomendado)**  
   Ubicado en la raíz del proyecto (`c:\Proyectos NUEVOS IA\Sistema-de-monitoreoGL`), ejecuta:
   ```bash
   docker-compose up -d --build
   ```
   *(Añadir `--build` es necesario solo la primera vez o si hubo un cambio en el código que requiera recompilar. En iteraciones sin cambio de código se puede omitir).*

2. **Ver Logs**  
   Para ver logs de ambos contenedores:
   ```bash
   docker-compose logs -f
   ```
   Para ver solo el backend:
   ```bash
   docker-compose logs -f backend
   ```

3. **Detener Contenedores**  
   ```bash
   docker-compose down
   ```
