import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'metrics.db');

export class SQLiteWriter {
    constructor() {
        this.db = null;
    }

    async init() {
        try {
            this.db = new DatabaseSync(DB_PATH);
            
            console.log(`[SQLite] Connected to metrics.db via built-in node:sqlite`);
            
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    payload TEXT
                )
            `);

            // Index for faster time-based queries
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp)`);
        } catch (err) {
            console.error('[SQLite] Error opening database:', err);
        }
    }

    writeSnapshot(snapshot) {
        if (!this.db) return;

        try {
            const stmt = this.db.prepare(`
                INSERT INTO metrics (timestamp, payload) VALUES (?, ?)
            `);
            // Store the full nested object directly
            stmt.run(snapshot.timestamp, JSON.stringify(snapshot));
        } catch (err) {
            console.error('[SQLite] Write Error:', err);
        }
    }

    getHistory(limit = 720) {
        if (!this.db) return [];
        try {
            let query = `
                SELECT 
                    timestamp,
                    json_extract(payload, '$.network.downlink_mbps') as downlink,
                    json_extract(payload, '$.network.uplink_mbps') as uplink,
                    json_extract(payload, '$.network.latency_ms') as latency,
                    json_extract(payload, '$.network.packet_loss') as packet_loss,
                    json_extract(payload, '$.health.power_w') as power,
                    json_extract(payload, '$.service.obstruction_fraction') as obstruction
                FROM metrics 
                ORDER BY timestamp DESC 
                LIMIT ?
            `;
            
            // Hybrid approach: 
            // 1. Last 3600 points (approx 1 hour) in RAW resolution
            // 2. The rest of the history downsampled to 1 point per minute
            if (limit >= 3600) {
              const seconds = limit;
              query = `
                WITH raw_recent AS (
                    SELECT 
                        timestamp,
                        json_extract(payload, '$.network.downlink_mbps') as downlink,
                        json_extract(payload, '$.network.uplink_mbps') as uplink,
                        json_extract(payload, '$.network.latency_ms') as latency,
                        json_extract(payload, '$.network.packet_loss') as packet_loss,
                        json_extract(payload, '$.health.power_w') as power,
                        json_extract(payload, '$.service.obstruction_fraction') as obstruction
                    FROM metrics 
                    ORDER BY timestamp DESC 
                    LIMIT 3600
                ),
                downsampled_old AS (
                    SELECT 
                        strftime('%Y-%m-%dT%H:%M:00Z', timestamp) as timestamp,
                        max(json_extract(payload, '$.network.downlink_mbps')) as downlink,
                        max(json_extract(payload, '$.network.uplink_mbps')) as uplink,
                        avg(json_extract(payload, '$.network.latency_ms')) as latency,
                        avg(json_extract(payload, '$.network.packet_loss')) as packet_loss,
                        avg(json_extract(payload, '$.health.power_w')) as power,
                        avg(json_extract(payload, '$.service.obstruction_fraction')) as obstruction
                    FROM metrics 
                    WHERE timestamp > datetime('now', '-${seconds} seconds')
                      AND timestamp < (SELECT min(timestamp) FROM raw_recent)
                    GROUP BY strftime('%Y-%m-%d %H:%M', timestamp)
                )
                SELECT * FROM (
                    SELECT * FROM raw_recent
                    UNION ALL
                    SELECT * FROM downsampled_old
                ) ORDER BY timestamp ASC
              `;
              const stmt = this.db.prepare(query);
              return stmt.all();
            }

            const stmt = this.db.prepare(query);
            const rows = stmt.all(limit);
            return rows.reverse();
        } catch (err) {
            console.error('[SQLite] Read Error:', err);
            return [];
        }
    }
}

export const sqliteWriter = new SQLiteWriter();
