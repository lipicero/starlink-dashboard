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
            const stmt = this.db.prepare(`
                SELECT payload FROM metrics ORDER BY timestamp DESC LIMIT ?
            `);
            const rows = stmt.all(limit);
            
            // Reconstruct array of objects in chronological order
            return rows.reverse().map(row => JSON.parse(row.payload));
        } catch (err) {
            console.error('[SQLite] Read Error:', err);
            return [];
        }
    }
}

export const sqliteWriter = new SQLiteWriter();
