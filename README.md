# 🛰️ Starlink Dashboard

Un panel de control moderno para monitorear el estado y rendimiento de tu kit Starlink (específicamente optimizado para Gen 3 Rev4 Panda). Visualiza en tiempo real el ancho de banda, la latencia, las obstrucciones y el consumo eléctrico, integrando datos de Prometheus y ofreciendo persistencia opcional en InfluxDB.

## ✨ Características

- **Visualización en Tiempo Real**: Gráficos dinámicos de descarga, subida y latencia mediante WebSockets.
- **Métricas Detalladas**: Estado de salud de los motores, temperatura (calefacción), inclinación, azimut y señal SNR.
- **Rastreo de Datos**: Seguimiento del consumo de datos (sesión, diario y mensual).
- **Alertas**: Notificaciones visuales sobre obstrucciones, límites térmicos y errores de hardware.
- **Arquitectura de Microservicios**: Backend robusto en Node.js y Frontend moderno con Next.js y Tailwind CSS.

## 🛠️ Tecnologías

- **Frontend**: Next.js 15+, React, Tailwind CSS, Recharts, Lucide Icons, Socket.io-client.
- **Backend**: Node.js, Express, Socket.io, Prometheus Query API.
- **Persistencia (Opcional)**: InfluxDB para series temporales.
- **Métricas de Origen**: Se asume el uso de `starlink-exporter` enviando datos a un servidor Prometheus.

## 🐳 Despliegue con Docker en Windows (Recomendado)

Esta es la forma más sencilla de ejecutar el proyecto, ya que incluye todos los componentes necesarios (Frontend, Backend, Prometheus y Starlink Exporter) configurados automáticamente.

### 1. Instalación de Docker en Windows
1. Descarga e instala **[Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/)**.
2. Durante la instalación, asegúrate de activar la opción **"Use the WSL 2 based engine"** (recomendado para mejor rendimiento).
3. Reinicia tu PC si el instalador lo solicita.
4. Abre la aplicación **Docker Desktop** y espera a que el icono de la ballena en la barra de tareas esté en verde (indica que el motor está corriendo).

### 2. Compilación y Ejecución
Desde una terminal (PowerShell o CMD) en la raíz de este proyecto:

*   **Para compilar e iniciar todo por primera vez:**
    ```powershell
    docker-compose up -d --build
    ```
*   **Para detener los servicios:**
    ```powershell
    docker-compose down
    ```
*   **Para ver si todo está bien:**
    ```powershell
    docker-compose ps
    ```

### 3. Cómo llevar el proyecto a otra PC (Despliegue Offline)
Si necesitas llevar el proyecto a una computadora que no tiene internet pero está conectada a la antena Starlink:

1. **En la PC con internet:**
   - Compila las imágenes: `docker-compose build`
   - Guarda las imágenes en archivos físicos:
     ```powershell
     docker save -o dashboard_frontend.tar starlink-dashboard-frontend:latest
     docker save -o dashboard_backend.tar starlink-dashboard-backend:latest
     ```
2. **En la PC de destino:**
   - Instala **Docker Desktop**.
   - Copia los archivos `.tar` y el archivo `docker-compose.yml` de este repositorio.
   - Carga las imágenes:
     ```powershell
     docker load -i dashboard_frontend.tar
     docker load -i dashboard_backend.tar
     ```
   - Inicia el sistema: `docker-compose up -d`

### Acceso:
- **Frontend**: `http://localhost:3000` (Interfaz de usuario)
- **Backend**: `http://localhost:4000` (API y WebSockets)
- **Prometheus**: `http://localhost:9090` (Panel de métricas crudas)
- **Starlink Exporter**: `http://localhost:9451` (Extractor de la antena)

## 📁 Estructura del Proyecto

- `frontend/`: Aplicación SPA/SSR (Next.js) para la interfaz de usuario.
- `backend/`: Servidor encargado de consultar Prometheus, gestionar el estado del sistema y distribuir datos en tiempo real.

## 🚀 Instalación y Uso

### Requisitos Previos

- **Node.js**: Versión 18 o superior.
- **Prometheus**: Debe estar recolectando métricas del kit Starlink (usualmente vía `starlink-exporter`).

### Paso 1: Configurar el Backend

1. Entra al directorio del backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea tu archivo `.env` basándote en `env.example`:
   ```bash
   cp env.example .env
   ```
4. Configura la URL de tu servidor Prometheus (`PROMETHEUS_URL`) y opcionalmente los datos de InfluxDB.

### Paso 2: Ejecutar el Proyecto Completo

Desde la **raíz del proyecto**, puedes iniciar tanto el backend como el frontend simultáneamente:

```bash
# Instalar dependencias globales (si es necesario)
npm run install-all

# Iniciar en modo desarrollo
npm run dev
```

El dashboard estará disponible en `http://localhost:3000`.

## ⚙️ Configuración (.env)

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor backend | `4000` |
| `PROMETHEUS_URL` | URL de la API de Prometheus | `http://localhost:9090` |
| `POLL_INTERVAL_MS` | Frecuencia de actualización de datos | `5000` |
| `INFLUX_URL` | (Opcional) URL de InfluxDB | - |
| `INFLUX_TOKEN` | (Opcional) API Token de InfluxDB | - |
| `INFLUX_ORG` | (Opcional) Organización de InfluxDB | - |
| `INFLUX_BUCKET` | (Opcional) Bucket de InfluxDB | - |

---

Diseñado para monitorear conexiones de alto rendimiento. ¡Despegando hacia una mejor conectividad! 🚀
