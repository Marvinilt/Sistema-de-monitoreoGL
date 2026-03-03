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

## Sincronización con Azure DevOps durante el desarrollo

### Al iniciar el desarrollo de un task o subtask de Kiro

Antes de escribir cualquier código, el agente DEBE:

1. Leer el archivo `tasks.md` del spec activo para identificar el subtask hijo a desarrollar.
2. Buscar en ADO (proyecto `Munis-MonitorServers`) el ID del PBI asociado al subtask.
3. Si el work item existe, actualizar el PBI a `En Progreso`
4. Crear el subtask a desarrollar como nuevo item `Task` bajo el Product Backlog asociado, en el sprint actual, y marcarlo con estado `In Progress`.
5. Asocia el id de este `Task` creado al subtask del spec en la sección `ado:` agregandolo como `task_id:{id}`, para poderlo encontrar al finalizar la tarea.
6. Recién después de completar la sincronización, iniciar el desarrollo

### Al finalizar el desarrollo de un task de Kiro

Cuando el agente complete exitosamente un task (código implementado, tests pasando), DEBE:

1. Buscar en ADO el ID del `Task` asociado y marca el item a estado `Done`
2. Si no hay ningun ID de `Task` asociado es porque algo falló en las instrucciones de inicio de task, crea el subtask desarrollado como un nuevo item `Task` bajo el Product Backlog asociado, en el sprint actual, y marcarlo con estado `Done`.
3. Buscar en ADO el ID del PBI asociado al task completado
4. Busca si existen otros task pendientes de trabajar y que tengan el mismo ID de PBI asociado 
5. Si no existen mas task pendientes con el ID del PBI, actualiza el item a estado `Done`
6. Si existe un Pull Request asociado al feature, vincularlo al work item
7. Buscar el Feature padre en ADO y verificar si todos sus PBIs/Tasks están Done — si es así, actualizar el Feature a `Done` también
8. Reportar al usuario la sincronización realizada

## Convenciones generales

- Nunca hacer commits directamente a `main` ni a `develop`
- Un branch por funcionalidad
- Los mensajes de commit deben estar en español, consistente con el proyecto
- Siempre actualizar la documentación antes del commit final
- Todo feature se integra a `develop` mediante Pull Request, nunca merge directo
