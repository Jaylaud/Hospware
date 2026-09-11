import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import { WebSocket } from 'ws';
import { initLocalDatabase } from './db';
import { HubSyncEngine } from './sync-engine';
import { registerRoomRoutes } from './routes/rooms';
import { registerReservationRoutes } from './routes/reservations';
import { registerFolioRoutes } from './routes/folios';
import { registerShiftRoutes } from './routes/shifts';
import { registerPosRoutes } from './routes/pos';
import { registerSystemRoutes } from './routes/system';

export async function createHubServer() {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
    },
  });

  // Enable CORS for LAN devices & localhost
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Enable WebSocket for real-time LAN updates
  await server.register(fastifyWebsocket);

  // Initialize SQLite Database
  const { sqlite } = initLocalDatabase();
  const property = sqlite.prepare('SELECT id, tenant_id FROM properties LIMIT 1').get() as any;

  // Initialize Background Sync Engine
  const syncEngine = new HubSyncEngine({
    sqlite,
    propertyId: property ? property.id : 'prop-demo-001',
    tenantId: property ? property.tenant_id : 'tenant-demo-001',
  });

  // Start background sync worker
  syncEngine.start(15000);

  // Active WebSocket connections pool
  const connectedClients = new Set<WebSocket>();

  // Broadcast function
  const broadcast = (event: string, data: any) => {
    const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    for (const client of connectedClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  };

  // WebSocket endpoint: ws://192.168.x.x:4321/ws
  server.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (socket, req) => {
      connectedClients.add(socket as any);
      socket.send(JSON.stringify({ event: 'CONNECTED', message: 'Hospware LAN Real-Time Hub Connected' }));

      socket.on('close', () => {
        connectedClients.delete(socket as any);
      });
    });
  });

  // Health check
  server.get('/api/health', async () => ({ status: 'ok', time: new Date().toISOString(), mode: 'hub-desktop' }));

  // Register domain route modules
  registerRoomRoutes(server, sqlite, syncEngine, broadcast);
  registerReservationRoutes(server, sqlite, syncEngine, broadcast);
  registerFolioRoutes(server, sqlite, syncEngine, broadcast);
  registerShiftRoutes(server, sqlite, syncEngine, broadcast);
  registerPosRoutes(server, sqlite, syncEngine, broadcast);
  registerSystemRoutes(server, sqlite, syncEngine);

  // Serve static assets from web-client if built
  const webClientDistPath = path.resolve(__dirname, '../../web-client/dist');
  if (fs.existsSync(webClientDistPath)) {
    server.register(fastifyStatic, {
      root: webClientDistPath,
      prefix: '/',
    });

    server.setNotFoundHandler((req, reply) => {
      if (req.raw.url && req.raw.url.startsWith('/api')) {
        return reply.status(404).send({ success: false, error: 'API route not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return { server, sqlite, syncEngine, broadcast };
}

// Start server when executed directly
if (require.main === module) {
  createHubServer().then(({ server }) => {
    const port = parseInt(process.env.PORT || '4321', 10);
    const host = process.env.HOST || '0.0.0.0';

    server.listen({ port, host }, (err, address) => {
      if (err) {
        console.error('Failed to start Hub server:', err);
        process.exit(1);
      }
      console.log(`\n======================================================`);
      console.log(`🏨 Hospware Local Hub Server running at ${address}`);
      console.log(`📡 LAN Access URL for Staff: http://${address.replace('0.0.0.0', '192.168.1.X')}`);
      console.log(`======================================================\n`);
    });
  });
}
