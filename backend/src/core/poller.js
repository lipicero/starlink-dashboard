import store from './store.js';
import { writeSnapshot } from '../persistence/influxWriter.js';

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS) || 5000;
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
let ioInstance = null;

const fetchPrometheusMetrics = async () => {
    const response = await fetch(`${PROMETHEUS_URL}/api/v1/query?query={job="starlink"}`);
    if (!response.ok) {
        throw new Error(`Prometheus query failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.status !== "success") {
        throw new Error(`Prometheus query unsuccessful: ${data.status}`);
    }

    // Convert vector array into a simple key-value map
    const metricsMap = {};
    for (const result of data.data.result) {
        const value = parseFloat(result.value[1]);
        const name = result.metric.__name__;

        if (!isNaN(value)) {
            metricsMap[name] = value;
        }
    }
    return metricsMap;
}

const normalize = (metrics) => {
    const now = new Date().toISOString();

    const alerts = [];
    if (metrics.starlink_dish_alert_motors_stuck) alerts.push({ id: 'motors_stuck', message: 'Motores Atascados', level: 'error' });
    if (metrics.starlink_dish_alert_thermal_throttle) alerts.push({ id: 'thermal_throttle', message: 'Límite Térmico Alcanzado', level: 'warning' });
    if (metrics.starlink_dish_alert_thermal_shutdown) alerts.push({ id: 'thermal_shutdown', message: 'Apagado Térmico', level: 'error' });
    if (metrics.starlink_dish_alert_mast_not_near_vertical) alerts.push({ id: 'mast_alignment', message: 'Mástil No Vertical', level: 'error' });
    if (metrics.starlink_dish_currently_obstructed) alerts.push({ id: 'obstructed', message: 'Antena Obstruida', level: 'warning' });
    if (metrics.starlink_dish_alert_signal_lower_than_predicted) alerts.push({ id: 'signal_low', message: 'Señal más baja de lo esperado', level: 'warning' });
    if (metrics.starlink_dish_alert_unexpected_location) alerts.push({ id: 'unexpected_location', message: 'Ubicación Inesperada (Restricción Regional)', level: 'error' });
    if (metrics.starlink_dish_alert_install_pending) alerts.push({ id: 'install_pending', message: 'Instalación Pendiente', level: 'info' });

    return {
        timestamp: now,
        health: {
            motors_healthy: !metrics.starlink_dish_alert_motors_stuck,
            is_heating: !!metrics.starlink_dish_alert_is_heating,
            thermal_throttle: !!metrics.starlink_dish_alert_thermal_throttle,
            dish_temperature: metrics.starlink_dish_temperature || 0,
            power_w: metrics.starlink_dish_power_input_watts || 0
        },
        service: {
            uptime_seconds: metrics.starlink_dish_uptime_seconds || 0,
            downtime_seconds: metrics.starlink_dish_downtime_seconds_total || 0,
            obstruction_fraction: metrics.starlink_dish_fraction_obstruction_ratio || 0,
            state: metrics.starlink_dish_up ? "ONLINE" : "OFFLINE",
            update_ready: !!metrics.starlink_dish_software_update_reboot_ready,
            obstructed_seconds_24h: metrics.starlink_dish_last_24h_obstructed_seconds || 0,
            mobility_class: typeof metrics.starlink_dish_mobility_class !== 'undefined' ? metrics.starlink_dish_mobility_class.toString() : "Fixed",
            power_save_idle: !!metrics.starlink_dish_alert_is_power_save_idle
        },
        network: {
            latency_ms: (metrics.starlink_dish_pop_ping_latency_seconds || 0) * 1000,
            packet_loss: metrics.starlink_dish_pop_ping_drop_ratio || 0,
            downlink_mbps: (metrics.starlink_dish_downlink_throughput_bps || 0) / 1000000,
            uplink_mbps: (metrics.starlink_dish_uplink_throughput_bps || 0) / 1000000,
            eth_link_active: !!metrics.starlink_dish_eth_connected,
            snr_valid: !!metrics.starlink_dish_snr_above_noise_floor && !metrics.starlink_dish_snr_persistently_low
        },
        installation: {
            tilt_current: metrics.starlink_dish_boresight_elevation_deg || 0,
            tilt_target: metrics.starlink_dish_desired_boresight_elevation_deg || 0,
            azimuth_current: metrics.starlink_dish_boresight_azimuth_deg || 0,
            azimuth_target: metrics.starlink_dish_desired_boresight_azimuth_deg || 0,
            tilt_delta: 0,
            rotation_delta: 0,
            gps_satellites: metrics.starlink_dish_gps_satellites || 0,
            gps_valid: !!metrics.starlink_dish_gps_valid,
            altitude_m: metrics.starlink_dish_location_altitude_meters || 0,
            latitude: metrics.starlink_dish_location_latitude_deg || 0,
            longitude: metrics.starlink_dish_location_longitude_deg || 0
        },
        alerts: alerts
    };
};

export const startPolling = (io) => {
    ioInstance = io;
    console.log(`[Poller] Starting polling every ${POLL_INTERVAL}ms`);

    // Initial Fetch
    runCycle();

    setInterval(runCycle, POLL_INTERVAL);
};

const runCycle = async () => {
    try {
        const metrics = await fetchPrometheusMetrics();
        const snapshot = normalize(metrics);

        store.update(snapshot);
        writeSnapshot(snapshot);

        if (ioInstance) {
            ioInstance.emit('status', snapshot);
        }
    } catch (err) {
        console.error(`[Poller] Cycle Error: ${err.message}`);
        if (ioInstance) {
            ioInstance.emit('status', { error: "Connection Failed", details: err.message, timestamp: new Date().toISOString() });
        }
    }
};
