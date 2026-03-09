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

## 🐳 Despliegue con Docker (Recomendado)

Para correr todo el stack (Frontend, Backend, Prometheus y Starlink Exporter) de forma unificada:

1. **Asegúrate de tener Docker y Docker Compose instalados.**
2. **Ejecuta el stack:**
   ```bash
   docker-compose up -d --build
   ```
3. **Acceso:**
   - **Frontend**: `http://localhost:3000`
   - **Backend (API/Socket)**: `http://localhost:4000`
   - **Prometheus**: `http://localhost:9090`
   - **Starlink Exporter**: `http://localhost:9817`

### Beneficios de Docker:
- **Todo en uno**: No necesitas instalar Node.js ni configurar Prometheus manualmente.
- **Portabilidad**: Puedes correrlo en cualquier máquina que tenga acceso a la red de Starlink (IP `192.168.100.1`).
- **Aislado**: Cada servicio corre en su propio contenedor.

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
