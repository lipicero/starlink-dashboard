import fs from 'fs';
import path from 'path';

const MAX_HISTORY = 720; // 1 hour at 5s intervals
const FILE_PATH = path.join(process.cwd(), 'consumption.json');

class Store {
    constructor() {
        this.latestSnapshot = null;
        this.historyBuffer = [];
        this.consumption = {
            session_bytes: 0,
            day_bytes: 0,
            month_bytes: 0,
            last_integration_ts: Date.now()
        };
        this.lastSaveTime = 0;

        this.loadConsumption();
    }

    loadConsumption() {
        try {
            if (fs.existsSync(FILE_PATH)) {
                const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
                // session_bytes se mantiene en 0 al inicio (no se carga de disco)
                this.consumption.day_bytes = data.day_bytes || 0;
                this.consumption.month_bytes = data.month_bytes || 0;
                console.log("[Store] Data de consumo recuperada del disco (Día/Mes).");
            }
        } catch (err) {
            console.error("[Store] No se pudo cargar el historial de consumo:", err.message);
        }
    }

    saveConsumption() {
        const dataToSave = {
            day_bytes: this.consumption.day_bytes,
            month_bytes: this.consumption.month_bytes
        };
        fs.writeFile(FILE_PATH, JSON.stringify(dataToSave), (err) => {
            if (err) console.error("[Store] Error guardando al disco:", err.message);
        });
    }

    resetDaily() {
        this.consumption.day_bytes = 0;
        this.saveConsumption();
    }

    resetMonthly() {
        this.consumption.month_bytes = 0;
        this.saveConsumption();
    }

    update(snapshot) {
        // Integrate Consumption
        const now = Date.now();
        const deltaSeconds = (now - this.consumption.last_integration_ts) / 1000;
        
        // Check for day/month reset
        const prevDate = new Date(this.consumption.last_integration_ts);
        const currentDate = new Date(now);
        
        if (prevDate.getDate() !== currentDate.getDate()) {
            this.resetDaily();
        }
        if (prevDate.getMonth() !== currentDate.getMonth()) {
            this.resetMonthly();
        }

        this.consumption.last_integration_ts = now;

        if (deltaSeconds > 0 && deltaSeconds < 60) { // Avoid huge jumps if paused
            // downlink_mbps is actually Mbps, convert to bps
            const downBps = (snapshot.network.downlink_mbps || 0) * 1e6;
            const upBps = (snapshot.network.uplink_mbps || 0) * 1e6;
            const totalBps = downBps + upBps;

            const bytes = (totalBps * deltaSeconds) / 8;

            this.consumption.session_bytes += bytes;
            this.consumption.day_bytes += bytes;
            this.consumption.month_bytes += bytes;
        }

        // Augment snapshot with consumption data
        snapshot.consumption = {
            session_gb: this.consumption.session_bytes / 1e9,
            day_gb: this.consumption.day_bytes / 1e9,
            month_gb: this.consumption.month_bytes / 1e9
        };

        this.latestSnapshot = snapshot;
        this.historyBuffer.push(snapshot);
        if (this.historyBuffer.length > MAX_HISTORY) {
            this.historyBuffer.shift();
        }

        // Guardar a disco cada 10 segundos
        if (now - this.lastSaveTime > 10000) {
            this.saveConsumption();
            this.lastSaveTime = now;
        }
    }

    getLatest() {
        return this.latestSnapshot;
    }

    getHistory() {
        return this.historyBuffer;
    }
}

export default new Store();
