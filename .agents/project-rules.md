# Reglas Globales del Sistema y Flujo de Desarrollo (Antigravity)

## 1. Metodología de Branches (GitFlow)
- `main` es intocable (Producción).
- `develop` es la rama de integración.
- Todo desarrollo inicia creando una rama desde `develop` llamada `feature/<descripcion-corta-en-kebab-case>`.
- Todos los cambios se integran a `develop` por medio de Pull Requests. No se debe realizar merge directo.

## 2. Flujo de Desarrollo (Developer Workflow)
### Al Iniciar el desarrollo de una funcionalidad
1. Crea la rama de feature correspondiente si no existe.

### Al Finalizar el desarrollo de una funcionalidad
1. Actualiza `README.md` (instrucciones, fecha y descripción de feature).
2. Actualiza `docs/DocumentacionTecnica.md` (arquitectura, endpoints, diseño, fecha).
3. Realiza el commit de todos los cambios con una descripción detallada del desarrollo y ha push al feature branch.
4. Crea un Pull Request del feature branch hacia `develop` con título `feat(<scope>): <descripción>`.