import { getStatus } from '../grpc/client.js';
import store from './store.js';
import { writeSnapshot } from '../persistence/influxWriter.js';

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS) || 5000;
let ioInstance = null;

const normalize = (rawData) => {
    const dish = rawData.dish_get_status;
    const now = new Date().toISOString();

    const alerts = [];
    if (dish.alerts?.motors_stuck) alerts.push({ id: 'motors_stuck', message: 'Motors Stuck', level: 'error' });
    if (dish.alerts?.thermal_throttle) alerts.push({ id: 'thermal_throttle', message: 'Thermal Throttling', level: 'warning' });
    if (dish.alerts?.thermal_shutdown) alerts.push({ id: 'thermal_shutdown', message: 'Thermal Shutdown', level: 'error' });
    if (dish.alerts?.mast_not_near_vertical) alerts.push({ id: 'mast_alignment', message: 'Mast Not Vertical', level: 'error' });
    if (dish.obstruction_stats?.currently_obstructed) alerts.push({ id: 'obstructed', message: 'Dish Obstructed', level: 'warning' });

    return {
        timestamp: now,
        health: {
            motors_healthy: !dish.alerts?.motors_stuck,
            is_heating: false,
            thermal_throttle: dish.alerts?.thermal_throttle || false,
            dish_temperature: 0
        },
        service: {
            uptime_seconds: parseInt(dish.device_state?.uptime_s || 0),
            downtime_seconds: 0,
            obstruction_fraction: dish.obstruction_stats?.fraction_obstructed || 0,
            state: dish.dish_state || "UNKNOWN"
        },
        network: {
            latency_ms: dish.pop_ping_latency_ms || 0,
            packet_loss: dish.pop_ping_drop_rate || 0,
            downlink_mbps: (dish.downlink_throughput_bps || 0) / 1000000,
            uplink_mbps: (dish.uplink_throughput_bps || 0) / 1000000,
            eth_link_active: dish.eth_link_active || false
        },
        installation: {
            tilt_current: 0,
            tilt_target: 0,
            tilt_delta: 0,
            rotation_delta: 0
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
        const rawData = await getStatus();
        const snapshot = normalize(rawData);

        store.update(snapshot);
        writeSnapshot(snapshot);

        if (ioInstance) {
            ioInstance.emit('status', snapshot);
        }
    } catch (err) {
        console.error(`[Poller] Cycle Error: ${err.message}`);
        if (process.env.MOCK_MODE !== 'true') {
            if (ioInstance) {
                ioInstance.emit('status', { error: "Connection Failed", details: err.message, timestamp: new Date().toISOString() });
            }
        }
    }
};
