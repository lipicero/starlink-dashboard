import fs from 'fs';
import path from 'path';

const MAX_HISTORY = 720; // 1 hour at 5s intervals
const FILE_PATH = path.join(process.cwd(), 'consumption.json');

class Store {
    constructor() {
        this.latestSnapshot = null;
        this.consumption = {
            session_bytes: 0,
            day_bytes: 0,
            month_bytes: 0,
            last_reset_month: -1, // To Track the 5th of the month reset
            last_integration_ts: Date.now()
        };
        this.lastSaveTime = 0;

        this.loadConsumption();
    }

    loadConsumption() {
        try {
            if (fs.existsSync(FILE_PATH)) {
                const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
                // session_bytes is always 0 on start
                this.consumption.day_bytes = data.day_bytes || 0;
                this.consumption.month_bytes = data.month_bytes || 0;
                this.consumption.last_reset_month = typeof data.last_reset_month !== 'undefined' ? data.last_reset_month : -1;
                console.log(`[Store] Data de consumo recuperada. Último corte: Mes ${this.consumption.last_reset_month + 1}.`);
            }
        } catch (err) {
            console.error("[Store] No se pudo cargar el historial de consumo:", err.message);
        }
    }

    saveConsumption() {
        const dataToSave = {
            day_bytes: this.consumption.day_bytes,
            month_bytes: this.consumption.month_bytes,
            last_reset_month: this.consumption.last_reset_month
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
        
        const currentDate = new Date(now);
        const currentMonth = currentDate.getMonth(); 
        const currentDay = currentDate.getDate();
        
        // Reset Diario (A la medianoche)
        if (new Date(this.consumption.last_integration_ts).getDate() !== currentDay) {
            this.resetDaily();
        }
        
        // Reset Mensual (Día 5 de cada mes)
        // Si el día >= 5 y no hemos reiniciado este mes todavía, reiniciamos.
        if (currentDay >= 5 && this.consumption.last_reset_month !== currentMonth) {
            console.log(`[Store] Iniciando nuevo ciclo mensual (Día 5 detectado).`);
            this.resetMonthly();
            this.consumption.last_reset_month = currentMonth;
            this.saveConsumption();
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

        // Guardar a disco cada 10 segundos
        if (now - this.lastSaveTime > 10000) {
            this.saveConsumption();
            this.lastSaveTime = now;
        }
    }

    getLatest() {
        return this.latestSnapshot;
    }

}

export default new Store();
