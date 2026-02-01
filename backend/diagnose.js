import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET = '192.168.100.1:9200';
const PROTO_PATH = path.join(__dirname, 'protos/full_device.proto');

console.log(`[Diagnose] Loading Proto: ${PROTO_PATH}`);
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

// We suspect the service name might be different or method.
// Let's try to construct clients for different potential services.

async function test() {
    // 1. Test standard SpaceX.API.Device.Device
    console.log('\n--- Test 1: SpaceX.API.Device.Device ---');
    try {
        const Device = protoDescriptor.SpaceX.API.Device.Device;
        const client = new Device(TARGET, grpc.credentials.createInsecure());

        await runCalls(client, 'Standard');
    } catch (e) {
        console.log('Skipping Test 1:', e.message);
    }
}

async function runCalls(client, label) {
    const methods = [
        { name: 'get_status', payload: { get_status: {} } },
        { name: 'get_device_info', payload: { get_device_info: {} } },
        { name: 'get_history', payload: { get_history: {} } }
    ];

    for (const m of methods) {
        console.log(`[${label}] Calling Handle(${m.name})...`);
        await new Promise(resolve => {
            client.Handle(m.payload, (err, res) => {
                if (err) {
                    console.log(`   -> FAILED: ${err.code} (${err.details})`);
                } else {
                    console.log(`   -> SUCCESS!`);
                    console.log(JSON.stringify(res, null, 2).substring(0, 200) + '...');
                }
                resolve();
            });
        });
    }
}

test();
