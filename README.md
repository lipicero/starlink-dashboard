# 🛰️ Starlink Dashboard - Deep Space Edition v2.0

Un panel de control de alto rendimiento y diseño premium diseñado para monitorear el estado y rendimiento de tu kit Starlink (específicamente optimizado para Gen 3).

Visualiza en tiempo real la salud de tu conexión con una estética futurista, optimizada para baja latencia visual y máxima precisión técnica.

![Screenshot de la Interfaz](https://via.placeholder.com/1200x600/020205/ffffff?text=Starlink+Dashboard+Deep+Space+v2.0)

## ✨ Características Principales

- **Índice de Calidad de Enlace**: Métrica inteligente (0-100%) que combina pérdida de paquetes, latencia y obstrucciones para darte el estado real de tu conexión.
- **Visualización Técnica Avanzada**:
  - **Gráficos Ultra-Rápidos**: Optimizados para 0 "bounce" y mínimo uso de CPU/GPU.
  - **Monitor Térmico**: Seguimiento de temperatura de la antena y alertas de *Thermal Throttling*.
  - **Pérdida de Paquetes**: Visualización instantánea de estabilidad de red.
  - **SNR y Enlace Ethernet**: Diagnóstico físico de señal y cableado.
- **Cálculo de Promedios**: Visibilidad de promedios históricos de la sesión para bajada, subida y latencia.
- **Diseño Responsivo**: Totalmente optimizado para móviles, tablets y monitores de alta resolución.
- **Actualizaciones Automáticas**: Integración con **Watchtower** para que el sistema se actualice solo al detectar nuevas versiones.

## 🚀 Despliegue Rápido (Cualquier PC)

Ya no necesitas descargar todo el código fuente. La forma más limpia de usarlo es mediante Docker:

### 1. Preparación
Crea una carpeta llamada `starlink` y descarga los dos archivos de configuración esenciales:

```bash
mkdir starlink && cd starlink
# Descarga la configuración
curl -O https://raw.githubusercontent.com/lipicero/starlink-dashboard/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/lipicero/starlink-dashboard/main/prometheus.yml
```

### 2. Inicio
Ejecuta el siguiente comando para descargar las imágenes preparadas y encender el sistema:

```bash
docker-compose up -d
```

### 3. Acceso
- **Frontend**: `http://localhost:3000` (Interfaz de usuario)
- **Backend**: `http://localhost:4000` (API y WebSockets)
- **Prometheus**: `http://localhost:9090`

## 🛠️ Tecnologías

- **Frontend**: Next.js 15+, React, Tailwind CSS, Recharts (Linear Paths), Lucide Icons, Socket.io.
- **Backend**: Node.js, Express, Socket.io, Prometheus Query API.
- **CI/CD**: GitHub Actions con auto-build y auto-push a GHCR.
- **Automatización**: Watchtower para actualizaciones sin intervención manual.

## ⚙️ Configuración (.env)

El sistema funciona "out of the box", pero puedes personalizar el `docker-compose.yml`:

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `PROMETHEUS_URL` | URL de la API de Prometheus | `http://prometheus:9090` |
| `POLL_INTERVAL_MS` | Frecuencia de actualización de datos | `1000` |
| `WATCHTOWER_POLL_INTERVAL` | Frecuencia de chequeo de actualizaciones | `300` seg |

## 👨‍💻 Desarrollo

Si quieres modificar el código y ver tus propios cambios reflejados:

1. Realiza tus modificaciones en `frontend/` o `backend/`.
2. Haz `git push` a tu repositorio.
3. El flujo de **GitHub Actions** compilará las imágenes automáticamente.
4. Tu dashboard instalado se actualizará solo en pocos minutos.

---

Diseñado para exploradores digitales. ¡Despegando hacia una mejor conectividad! 🚀🛰️
