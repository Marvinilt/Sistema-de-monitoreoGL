# Reglas Globales del Sistema y Flujo de Desarrollo (Antigravity)

## 1. Metodología de Branches (GitFlow)
- `main` es intocable (Producción).
- `develop` es la rama de integración.
- Todo desarrollo inicia creando una rama desde `develop` llamada `feature/<descripcion-corta-en-kebab-case>`.
- Todos los cambios se integran a `develop` por medio de Pull Requests. No se debe realizar merge directo.

## 2. Flujo de Desarrollo (Developer Workflow)
### Al Iniciar una nueva implementación
1. Crea en git una rama de feature correspondiente para iniciar a desarrollar la funcionalidad.
2. Nunca desarrolles ni hagas commit sobre la rama develop, prohibido.
3. Verificar que estes en una rama feature antes de realizar commits.

### Al Finalizar el desarrollo de una funcionalidad
1. Cuando el usuario indique que ha finalizado el desarrollo realiza estas acciones:
    a. Actualiza `README.md` (instrucciones, fecha y descripción de feature).
    b. Actualiza `docs/DocumentacionTecnica.md` (arquitectura, endpoints, diseño, fecha).
    c. Realiza el commit de todos los cambios con una descripción detallada del desarrollo y has push al feature branch.
    d. Crea un Pull Request del feature branch hacia `develop` con título `feat(<scope>): <descripción>`.