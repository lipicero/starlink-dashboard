import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../protos/full_device.proto');
const TARGET = process.env.GRPC_TARGET || '192.168.100.1:9200';
const MOCK_MODE = process.env.MOCK_MODE === 'true';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
// Access nested package SpaceX.API.Device
const deviceProto = protoDescriptor.SpaceX.API.Device;

let client = null;

if (!MOCK_MODE) {
    client = new deviceProto.Device(TARGET, grpc.credentials.createInsecure());
    console.log(`[gRPC] Client initialized connecting to ${TARGET}`);
} else {
    console.log(`[gRPC] MOCK MODE ENABLED. No connection to Dishy.`);
}

const mockResponse = {
    dish_get_status: {
        device_info: {
            id: "ut01000000-00000000-000b2d61",
            hardware_version: "rev3_proto2",
            software_version: "a6b0ac68-2c2e-4340-85f8-2c35848c08f4.ut.release",
            country_code: "US"
        },
        device_state: { uptime_s: "123456" },
        dish_state: "CONNECTED",
        outage: { cause: "UNKNOWN", start_timestamp_ns: "0", duration_ns: "0", did_switch: false },
        gps_stats: { gps_valid: true, sat_count: 12 },
        ready_states: { cady: true, scp: true, l1l2: true, xphy: true, aap: true, rf: true },
        obstruction_stats: {
            fraction_obstructed: 0.0,
            valid_s: 100.0,
            currently_obstructed: false,
            avg_prolonged_obstruction_duration_s: 0,
            avg_prolonged_obstruction_interval_s: 0,
            avg_prolonged_obstruction_valid: false,
            time_fully_obstructed_s: 0,
            time_obscured_s: 0
        },
        alerts: {
            motors_stuck: false,
            thermal_throttle: false,
            thermal_shutdown: false,
            mast_not_near_vertical: false,
            unexpected_location: false,
            slow_ethernet_speeds: false,
            roaming: false
        },
        downlink_throughput_bps: 150000000, // 150 Mbps
        uplink_throughput_bps: 20000000,    // 20 Mbps
        pop_ping_latency_ms: 35.5,
        pop_ping_drop_rate: 0.0,
        eth_link_active: true
    }
};

export const getStatus = () => {
    return new Promise((resolve, reject) => {
        if (MOCK_MODE) {
            // ... mock code omitted for brevity but strictly not used if false ...
            // (Mantener el código mock existente dentro del if, pero no se ejecutará)
            const variableResponse = JSON.parse(JSON.stringify(mockResponse));
            return resolve(variableResponse);
        }

        const request = { get_status: {} };

        // Intento 1: Usar Handle (Estándar)
        client.Handle(request, (err, response) => {
            if (err) {
                console.error(`[gRPC] Handle Error: ${err.code} - ${err.details}`);
                // Si falla Handle con UNIMPLEMENTED (12), es posible que debamos usar otro método o que la definición esté mal.
                return reject(err);
            }
            if (!response || !response.dish_get_status) {
                return reject(new Error("Invalid response from Dishy"));
            }
            resolve(response);
        });
    });
};
