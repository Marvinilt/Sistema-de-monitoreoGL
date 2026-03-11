# Monitor de Servidores e Infraestructura

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Node](https://img.shields.io/badge/node_v18+-green)

Aplicación web full-stack para monitorear en tiempo real el estado de puertos TCP y URLs HTTPS en servidores de infraestructura con una interfaz cyber-dark futurista.

## ✨ Características

- **Monitoreo en tiempo real** (TCP/HTTPS) vía WebSockets.
- **Alertas y notificaciones** por correo electrónico personalizables.
- **Visualización y configuración de umbrales de consumo de recursos** (CPU, RAM, Disco).
- **Interfaz gráfica moderna** y responsiva, con soporte nativo para **Modos Cyber-Dark y SaaS Light (Claro)**.

### Tablero Principal
![Tablero Principal](docs/assets/dashboard-1.png)

### Gestión de Servidores
![Gestión de Servidores](docs/assets/dashboard-2.png)

## 🚀 Inicio rápido

```bash
# Instalar dependencias
npm run install:all

# Ejecutar backend (puerto 3001)
npm run dev:backend

# Ejecutar frontend (puerto 3000)
npm run dev:frontend

# Ejecutar todas las pruebas
npm test
```

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express + TypeScript, WebSocket (`ws`)
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Persistencia**: JSON local (`backend/data/config.json`)
- **Testing**: Jest + fast-check (backend), Vitest + React Testing Library (frontend)

## 📚 Documentación

Para detalles profundos sobre el funcionamiento interno, dirígete a nuestros documentos:
- 📖 [Documentación Técnica (API, Arquitectura, WebSockets)](docs/DocumentacionTecnica.md)
- 📝 [Historial de Cambios (Changelog)](docs/CHANGELOG.md)

## 📄 Licencia y Contacto

- **Licencia:** Proceso y código de uso privado / Todos los derechos reservados.
- **Autor/Contacto:** Marvin Lemus Torres ([@Marvinilt](https://github.com/Marvinilt))
