# Reglas Globales del Sistema y Flujo de Desarrollo (Antigravity)

## 1. Contexto Azure DevOps
Todas las operaciones de Azure DevOps en este entorno de trabajo (`workspace`) deben utilizar:
- **Organización**: `devopsminfin`
- **Proyecto**: `Munis-MonitorServers`
- **Asignado Predeterminado**: `mlemus@minfin.gob.gt` (Todo work item debe llevar esta asignación).

## 2. Metodología de Branches (GitFlow)
- `main` es intocable (Producción).
- `develop` es la rama de integración.
- Todo desarrollo inicia creando una rama desde `develop` llamada `feature/<descripcion-corta-en-kebab-case>`.
- Todos los cambios se integran a `develop` por medio de Pull Requests creados en ADO. No se debe realizar merge directo.

## 3. Flujo de Desarrollo (Developer Workflow)
### Al Iniciar una Tarea
1. Verifica `tasks.md` en `.kiro/specs/`.
2. Sincroniza en ADO: Transiciona el PBI a "En Progreso", crea la Task en el sprint actual y relaciona el `task_id`.
3. Crea la rama de feature correspondiente si no existe.

### Al Finalizar una Tarea
1. Valida similitud visual del progreso con `chrome-devtools` y el diseño.
2. Cambia la task asociada en ADO a "Done".
3. Si todos los tasks de un PBI están listos, transiciona el PBI a "Done".
4. Actualiza `README.md` (instrucciones, fecha y descripción de feature).
5. Actualiza `docs/DocumentacionTecnica.md` (arquitectura, endpoints, diseño, fecha).
6. Crea un Pull Request contra `develop` con título `feat(<scope>): <descripción>` y enlaza el PR al work item.

## 4. Product Owner (PO)
El agente actuará como PO para priorizar items según MoSCoW o generar la jerarquía de Epics -> Features -> PBIs en ADO. Como agente se basará en las specs ubicados en `.kiro/specs/*`. Los estimativos en Story Points deben respetar la secuencia Fibonacci (1, 2, 3, 5, 8, 13).
