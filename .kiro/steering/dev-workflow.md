# Development Workflow Rules (GitFlow)

## Estructura de ramas

Este proyecto sigue la metodología GitFlow:

- `main` — código en producción, nunca se toca directamente
- `develop` — rama base de integración, todo feature se integra aquí
- `feature/<nombre>` — ramas de desarrollo de funcionalidades, se crean desde `develop`

## Al iniciar una nueva funcionalidad

Antes de escribir cualquier código, se debe crear un branch desde `develop` con el siguiente formato:

```
feature/<descripcion-corta-en-kebab-case>
```

Ejemplos:
- `feature/monitor-cpu-usage`
- `feature/alert-email-notification`
- `feature/dashboard-server-status`

Si el usuario no proporciona un nombre claro, pregunta por una descripción de la funcionalidad antes de crear el branch.

## Al finalizar una funcionalidad

Cuando el usuario indique que terminó el desarrollo de un feature, se deben realizar las siguientes acciones en orden:

1. Actualizar el archivo `README.md` en la raíz del proyecto con:
   - Descripción de la nueva funcionalidad agregada
   - Instrucciones de uso si aplica
   - Fecha de la actualización

2. Actualizar el archivo `docs/DocumentacionTecnica.md` con:
   - Nombre de la funcionalidad
   - Descripción técnica detallada (arquitectura, componentes, decisiones de diseño)
   - Endpoints, métodos o clases relevantes
   - Dependencias agregadas si aplica
   - Fecha de la actualización

3. Generar el mensaje de commit con el siguiente formato:
   ```
   feat(<scope>): <descripcion-corta>

   - <detalle 1 de lo implementado>
   - <detalle 2 de lo implementado>
   - <detalle 3 si aplica>

   Docs: README.md y DocumentacionTecnica.md actualizados
   ```

4. Crear un Pull Request en ADO con:
   - Título: `feat(<scope>): <descripcion-corta>`
   - Rama origen: `feature/<nombre>`
   - Rama destino: `develop`
   - Descripción detallada que incluya:
     - Qué se implementó
     - Por qué se implementó (contexto)
     - Cómo probarlo
     - Cambios en documentación

## Convenciones generales

- Nunca hacer commits directamente a `main` ni a `develop`
- Un branch por funcionalidad
- Los mensajes de commit deben estar en español, consistente con el proyecto
- Siempre actualizar la documentación antes del commit final
- Todo feature se integra a `develop` mediante Pull Request, nunca merge directo
