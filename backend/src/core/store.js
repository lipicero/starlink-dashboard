const MAX_HISTORY = 720; // 1 hour at 5s intervals

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
    }

    resetDaily() {
        this.consumption.day_bytes = 0;
    }

    resetMonthly() {
        this.consumption.month_bytes = 0;
    }

    update(snapshot) {
        // Integrate Consumption
        const now = Date.now();
        const deltaSeconds = (now - this.consumption.last_integration_ts) / 1000;
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
    }

    getLatest() {
        return this.latestSnapshot;
    }

    getHistory() {
        return this.historyBuffer;
    }
}

export default new Store();
