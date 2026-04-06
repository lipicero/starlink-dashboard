import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { startPolling } from './core/poller.js';
import store from './core/store.js';
import { sqliteWriter } from './persistence/sqliteWriter.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for local dev
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// REST Endpoints
app.get('/', (req, res) => {
    res.send('Servidor corriendo');
});
app.get('/api/status', (req, res) => {
    const snapshot = store.getLatest();
    if (!snapshot) {
        return res.status(503).json({ error: "System initializing or disconnected" });
    }
    res.json(snapshot);
});

app.get('/api/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 86400;
    res.json(sqliteWriter.getHistory(limit));
});

// Start System after DB init
sqliteWriter.init().then(() => {
    startPolling(io);

    httpServer.listen(PORT, () => {
        console.log(`[Server] Backend running on port ${PORT}`);
        console.log(`[Mode] MOCK_MODE=${process.env.MOCK_MODE}`);
        console.log(`[Mode] POLL_INTERVAL=${process.env.POLL_INTERVAL_MS}ms`);
    });
}).catch(err => {
    console.error("Failed to initialize SQLite DB", err);
});
