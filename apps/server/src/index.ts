import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { createDatabaseClient } from '@hospware/database';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DB_PATH || 'hospware.db';

// Initialize SQLite database
const db = createDatabaseClient(DB_PATH);

app.use(cors());
app.use(express.json());

// Basic health and node discovery endpoint for local hotel network
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Hospware Hub Server',
    mode: 'offline-first',
    timestamp: new Date().toISOString(),
  });
});

// WebSocket connection for real-time LAN sync (between receptionist dashboard, POS, housekeeper app)
wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected to Hub');
  
  ws.send(JSON.stringify({ type: 'CONNECTED', payload: { message: 'Connected to Hospware Local Hub' } }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('[WebSocket] Message received:', data.type);
      
      // Broadcast to other local terminals
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === ws.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (err) {
      console.error('[WebSocket] Error parsing message:', err);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🏨 Hospware Local Hub Server listening on port ${PORT}`);
});
