import { InfluxDB, Point } from '@influxdata/influxdb-client';

const URL = process.env.INFLUX_URL;
const TOKEN = process.env.INFLUX_TOKEN;
const ORG = process.env.INFLUX_ORG;
const BUCKET = process.env.INFLUX_BUCKET;

let writeApi = null;

if (URL && TOKEN && ORG && BUCKET) {
    console.log(`[InfluxDB] Initializing connection to ${URL}`);
    try {
        const influxDB = new InfluxDB({ url: URL, token: TOKEN });
        writeApi = influxDB.getWriteApi(ORG, BUCKET);
        // Setup default tags
        writeApi.useDefaultTags({ host: 'starlink-monitor' });
    } catch (e) {
        console.error(`[InfluxDB] Init Error: ${e.message}`);
    }
} else {
    console.log('[InfluxDB] Missing configuration, skipping persistence.');
}

export const writeSnapshot = (snapshot) => {
    if (!writeApi) return;

    try {
        const timestamp = new Date(snapshot.timestamp);

        // Point: service_status
        const servicePoint = new Point('service_status')
            .tag('state', snapshot.service.state)
            .floatField('uptime_seconds', snapshot.service.uptime_seconds)
            .floatField('obstruction_fraction', snapshot.service.obstruction_fraction)
            .timestamp(timestamp);

        // Point: network_metrics
        const networkPoint = new Point('network_metrics')
            .floatField('latency_ms', snapshot.network.latency_ms)
            .floatField('packet_loss', snapshot.network.packet_loss)
            .floatField('downlink_mbps', snapshot.network.downlink_mbps)
            .floatField('uplink_mbps', snapshot.network.uplink_mbps)
            .timestamp(timestamp);

        // Point: health_metrics
        const healthPoint = new Point('health_metrics')
            .booleanField('motors_healthy', snapshot.health.motors_healthy)
            .booleanField('thermal_throttle', snapshot.health.thermal_throttle)
            .timestamp(timestamp);

        writeApi.writePoint(servicePoint);
        writeApi.writePoint(networkPoint);
        writeApi.writePoint(healthPoint);

        // Flush optional (buffer usually handles it, but maybe flush on interval)
    } catch (e) {
        console.error(`[InfluxDB] Write Error: ${e.message}`);
    }
};
