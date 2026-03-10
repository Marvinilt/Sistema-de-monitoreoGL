# Guía de Instalación del Agente de Monitoreo de Recursos

Para que el Monitor central pueda recolectar información en tiempo real sobre el uso de **CPU, Memoria RAM y Espacio en Disco**, es necesario instalar y ejecutar un Agente ligero en cada servidor destino (Windows o Linux).

Este agente levanta un pequeño servidor web interno (por defecto en el puerto `9000`) desde el cual el Monitor central extrae las cifras en formato JSON.

---

## 1. Requisitos Previos

- **Node.js** instalado en el servidor destino (versión 14 o superior recomendada).
- Acceso al servidor destino con privilegios de Administrador (Windows) o `sudo` (Linux).
- Apertura del puerto TCP `9000` (o el que elijas) en el Firewall del servidor destino, para que el servidor monitor pueda solicitar la información.

## 2. Creación del Agente

Abre una terminal en el servidor donde vas a monitorear y crea un nuevo directorio para el agente:

```bash
mkdir C:\AgenteMonitoreo  # (Windows)
# o
mkdir -p /opt/agente-monitoreo # (Linux)

cd C:\AgenteMonitoreo
```

### 2.1. Inicializar el proyecto e instalar dependencias

Ejecuta los siguientes comandos para generar el archivo `package.json` e instalar la librería necesaria para extraer las métricas de hardware:

```bash
npm init -y
npm install express systeminformation cors
```

### 2.2. Crear el código del Agente

Crea un archivo llamado `agent.js` en ese directorio y pega exactamente el siguiente código:

```javascript
const express = require('express');
const cors = require('cors');
const si = require('systeminformation');

const app = express();
const PORT = 9000;

app.use(cors());

// Endpoint que el Monitor Principal consultará
app.get('/metrics', async (req, res) => {
    try {
        // 1. Uso de CPU
        const cpuLoad = await si.currentLoad();
        const cpuPorcentaje = cpuLoad.currentLoad;

        // 2. Uso de Memoria RAM
        const mem = await si.mem();
        const ramPorcentaje = (mem.active / mem.total) * 100;

        // 3. Uso de espacio en Disco (tomando el disco principal '/' o 'C:')
        const fsSize = await si.fsSize();
        let discoPorcentaje = 0;
        
        if (fsSize && fsSize.length > 0) {
            // Buscamos el disco principal o promediamos
            // Asumimos el primer disco duro listado o el que más se usa
            const mainDisk = fsSize.find(d => d.mount === '/' || d.mount.startsWith('C:')) || fsSize[0];
            discoPorcentaje = mainDisk.use;
        }

        // 4. Estructurar la respuestaJSON
        const recursos = {
            cpuPorcentaje: cpuPorcentaje,
            ramPorcentaje: ramPorcentaje,
            discoPorcentaje: discoPorcentaje,
            timestamp: new Date().toISOString()
        };

        res.json(recursos);

    } catch (error) {
        console.error("Error obteniendo métricas:", error);
        res.status(500).json({ error: "Error leyendo sensores del sistema" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Agente de Monitoreo corriendo en el puerto ${PORT}`);
    console.log(`URL de prueba: http://localhost:${PORT}/metrics`);
});
```

## 3. Instalar como Servicio en Segundo Plano (Recomendado)

Para que el agente arranque automáticamente cuando el servidor se reinicie, utilizaremos **PM2**.

### Instalar PM2 globalmente:
```bash
npm install -g pm2
```

### Iniciar el agente y guardar el inicio automático:
```bash
pm2 start agent.js --name "Agente-Monitoreo"
```

**Si es Windows:** Necesitas usar `pm2-wrapper` o `pm2-windows-startup`
```bash
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

**Si es Linux:**
```bash
pm2 startup
pm2 save
```

---

## 4. ¿Cómo Probar y Verificar el Funcionamiento?

### Prueba **Local** (Desde el mismo servidor monitoreado)

1. Abre un navegador web en ese mismo servidor o usa comandos por consola (PowerShell o Curl).
2. Entra a la dirección: `http://localhost:9000/metrics`
3. Si la instalación fue correcta, deberás recibir una respuesta visual similar a esta:

```json
{
  "cpuPorcentaje": 12.45,
  "ramPorcentaje": 78.20,
  "discoPorcentaje": 88.5,
  "timestamp": "2026-03-10T15:30:20.000Z"
}
```

### Prueba **Remota** (Desde el Servidor Monitor Principal)

1. Accede al servidor central donde está instalado tu backend de "Monitor de Servidores e Infraestructura".
2. Abre una terminal (o PowerShell).
3. Utiliza el comando `curl` adjuntando la IP del servidor destino. (Reemplaza la IP `172.18.X.X` por la que usas):

```bash
curl http://172.18.X.X:9000/metrics
```
4. Si obtienes el fragmento JSON con las métricas, significa que el Firewall está correctamente abierto y la comunicación funciona perfecto.

---

## 5. Casos de Error Comunes

*   **Error "Connection Refused" al hacer el `curl` remoto:** El proceso `agent.js` del cliente está detenido, o hay un Firewall de Windows/Linux bloqueando el acceso al puerto *9000*.
    *   *Solución Windows:* Abrir Panel de Control -> Firewall de Windows Defender -> Reglas de Entrada -> Crear nueva regla -> Puerto TCP 9000 -> Permitir conexión.
*   **Todos los porcentajes salen en "0":** Los permisos del usuario que está ejecutando NodeJS (y pm2) no son lo suficientemente altos como para consultar el hardware base (suele pasar en Linux si no pertenece al grupo `wheel`/`sudo`).
*   **Múltiples unidades de almacenamiento conectadas:** En el código actual del agente (sección de Disco), lee automáticamente la montura `"/"` en Linux o la partición `"C:"` en Windows. Si deseas monitorear discos distintos, edita la condición de `d.mount === 'C:'` en el `agent.js`.
