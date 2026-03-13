# 🛰️ Starlink Dashboard

Panel de control en tiempo real para monitorear el estado y rendimiento de tu kit Starlink. Visualiza métricas de red, salud del hardware, datos de instalación y consumo de datos con una interfaz oscura y responsiva.

## 📐 Arquitectura

El proyecto es un monorepo con tres servicios principales orquestados con Docker Compose:

```
starlink-dashboard/
├── frontend/          # Next.js 16 + React 19 + Tailwind CSS v4
├── backend/           # Node.js + Express + Socket.io
├── prometheus/        # Configuración de Prometheus
├── docker-compose.yml # Orquestación completa
└── prometheus.yml     # Scrape config (intervalo: 1s)
```

### Flujo de datos

```
Antena Starlink (gRPC :9200)
        ↓
starlink-exporter :9451   ← expone métricas en formato Prometheus
        ↓
Prometheus :9090           ← almacena series temporales
        ↓
Backend :4000              ← consulta Prometheus, normaliza y emite por WebSocket
        ↓
Frontend :3000             ← recibe eventos en tiempo real vía Socket.io
```

## ✨ Métricas monitoreadas

### Red
- **Descarga / Subida** (Mbps) con promedios históricos de sesión
- **Latencia** (ms) + pérdida de paquetes (%)
- **SNR** — calidad de señal (sincronizada / ruido alto)
- **Enlace Ethernet** activo/inactivo

### Salud del Hardware
- **Temperatura** de la antena con alerta de Thermal Throttling
- **Motores** — estado sano / atascado
- **Calefacción** activa/inactiva
- **Potencia** consumida (Watts)

### Servicio
- **Estado** Online / Offline
- **Uptime** y downtime acumulado
- **Obstrucciones** — fracción actual y segundos obstruido en las últimas 24h
- **Clase de movilidad** — Fija / Móvil
- **Ahorro de energía** (Power Save Idle)
- **Actualización de firmware** disponible

### Instalación
- **Inclinación y Azimuth** — valores actual y objetivo
- **GPS** — satélites visibles, validez, latitud, longitud y altitud

### Consumo de datos
- Sesión actual (GB)
- Hoy (GB)
- Mes (GB)

### Índice de Calidad de Enlace
Score 0–100% calculado en tiempo real combinando pérdida de paquetes, latencia, SNR y obstrucciones.

### Alertas automáticas
| Alerta | Nivel |
|--------|-------|
| Motores atascados | Error |
| Límite térmico alcanzado | Warning |
| Apagado térmico | Error |
| Mástil no vertical | Error |
| Antena obstruida | Warning |
| Señal más baja de lo esperado | Warning |
| Ubicación inesperada (restricción regional) | Error |
| Instalación pendiente | Info |

## 🚀 Despliegue rápido con Docker

El método recomendado. Solo necesitás **Docker** instalado — ningún archivo extra, nada de Git.

### 1. Descargar el `docker-compose.yml`

**Linux / macOS:**
```bash
mkdir starlink && cd starlink
curl -O https://raw.githubusercontent.com/lipicero/starlink-dashboard/main/docker-compose.yml
```

**Windows (PowerShell):**
```powershell
mkdir starlink; cd starlink
Invoke-WebRequest -Uri https://raw.githubusercontent.com/lipicero/starlink-dashboard/main/docker-compose.yml -OutFile docker-compose.yml
```

> **Nota:** En PowerShell, `curl` es un alias de `Invoke-WebRequest`. Para usar el `curl` real escribí `curl.exe`, o instalá [Git for Windows](https://git-scm.com/download/win) que incluye bash y curl nativo.

### 2. Levantar el stack

```bash
docker-compose up -d
```

Esto inicia cinco contenedores:

| Contenedor | Imagen | Puerto |
|---|---|---|
| `starlink-exporter` | `ghcr.io/joshuasing/starlink_exporter` | `9451` |
| `prometheus` | `ghcr.io/lipicero/starlink-dashboard-prometheus` | `9090` |
| `starlink-backend` | `ghcr.io/lipicero/starlink-dashboard-backend` | `4000` |
| `starlink-frontend` | `ghcr.io/lipicero/starlink-dashboard-frontend` | `3000` |
| `watchtower` | `containrrr/watchtower` | — |

### 3. Acceder

| Servicio | URL |
|---|---|
| **Dashboard** | http://localhost:3000 |
| **API Backend** | http://localhost:4000 |
| **Prometheus** | http://localhost:9090 |

### 4. Parar el stack

```bash
docker-compose down
```

## ⚙️ Variables de entorno (Backend)

Copiá `backend/env.example` a `backend/.env` para desarrollo local:

| Variable | Descripción | Default |
|---|---|---|
| `PROMETHEUS_URL` | URL de la API de Prometheus | `http://localhost:9090` |
| `POLL_INTERVAL_MS` | Frecuencia de consulta a Prometheus | `5000` |
| `PORT` | Puerto del servidor backend | `4000` |
| `MOCK_MODE` | Activar datos simulados (sin antena real) | `false` |

En Docker, estas variables están definidas en el `docker-compose.yml`.

## 👨‍💻 Desarrollo local

### Requisitos

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- Una instancia de Prometheus corriendo localmente (o via Docker)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/lipicero/starlink-dashboard.git
cd starlink-dashboard

# Instalar dependencias de todos los paquetes del workspace
pnpm install
```

### Configurar el backend

```bash
# Windows (PowerShell)
Copy-Item backend/env.example backend/.env

# Linux / macOS
cp backend/env.example backend/.env
```

Editá `backend/.env` con la URL de tu Prometheus.

### Iniciar en modo desarrollo

```bash
# Levanta backend (nodemon) y frontend (Next.js) en paralelo
pnpm dev
```

| Servicio | URL |
|---|---|
| Frontend (Next.js dev) | http://localhost:3000 |
| Backend (Node.js) | http://localhost:4000 |

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Backend + Frontend en modo desarrollo (hot-reload) |
| `pnpm start` | Backend + Frontend en modo producción |
| `pnpm build` | Compilar el frontend para producción |
| `pnpm install-all` | Instalar dependencias del workspace |

## 🛠️ Stack tecnológico

### Frontend (`/frontend`)
- **Next.js 16** + **React 19** — Framework y UI
- **TypeScript 5** — Tipado estático
- **Tailwind CSS v4** — Estilos
- **Recharts 3** — Gráficos de red (downlink/uplink/latencia)
- **Socket.io Client 4** — Actualizaciones en tiempo real
- **Lucide React** — Iconografía

### Backend (`/backend`)
- **Node.js** (ESM) + **Express 5** — Servidor HTTP
- **Socket.io 4** — Emisión de métricas en tiempo real
- **InfluxDB Client** — Persistencia de métricas (opcional)
- **dotenv** — Gestión de variables de entorno

### Infraestructura
- **starlink-exporter** — Expone métricas gRPC de la antena como endpoints Prometheus
- **Prometheus** — Almacenamiento de series temporales (scrape cada 1s)
- **Watchtower** — Actualización automática de contenedores al detectar nuevas imágenes en GHCR
- **GitHub Actions** — CI/CD: build y push automático de imágenes a GHCR en cada push a `main`

## 🤖 CI/CD

Cada push a `main` o `master` dispara el workflow `.github/workflows/docker-publish.yml`, que publica tres imágenes en GitHub Container Registry (GHCR):

- `ghcr.io/lipicero/starlink-dashboard-backend:latest`
- `ghcr.io/lipicero/starlink-dashboard-frontend:latest`
- `ghcr.io/lipicero/starlink-dashboard-prometheus:latest`

Watchtower detecta las nuevas imágenes y actualiza los contenedores en producción sin intervención manual (revisión cada 5 minutos).

---

Diseñado para exploradores digitales. 🚀🛰️
