import Fastify from 'fastify';
import cors from '@fastify/cors';
import { CloudSyncService } from './sync-handler';
import { CloudLicenseService } from './license-service';
import { PaystackWebhookHandler } from './paystack-webhook';

export async function createCloudApiServer() {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
    },
  });

  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Health check
  server.get('/api/health', async () => ({
    status: 'ok',
    mode: 'cloud-saas-master',
    time: new Date().toISOString(),
  }));

  // Sync Push from local hotel hubs
  server.post('/api/sync/push', async (request: any, reply) => {
    const pushResponse = CloudSyncService.handlePush(request.body);
    return reply.send(pushResponse);
  });

  // Sync Pull for local hotel hubs
  server.get('/api/sync/pull', async (request: any, reply) => {
    const { propertyId, lastSyncedTimestamp } = request.query;
    const pullResponse = CloudSyncService.handlePull(propertyId, lastSyncedTimestamp);
    return reply.send(pullResponse);
  });

  // Public key endpoint for hubs
  server.get('/api/license/public-key', async () => ({
    publicKeyPem: CloudLicenseService.getPublicKeyPem(),
  }));

  // Issue signed Ed25519 license key
  server.post('/api/license/issue', async (request: any, reply) => {
    const {
      tenantId = 'tenant-demo-001',
      propertyId = 'prop-demo-001',
      hotelName = 'Grand Horizon Hotel & Suites',
      tier = 'STANDARD',
      maxRooms = 50,
      maxDeviceSeats = 10,
      enabledFeatures = ['POS', 'GUEST_PORTAL', 'OFFLINE_SYNC', 'RECEIPT_PRINTER'],
      validDays = 365,
    } = request.body || {};

    const license = CloudLicenseService.issueLicense({
      tenantId,
      propertyId,
      hotelName,
      tier,
      maxRooms,
      maxDeviceSeats,
      enabledFeatures,
      validDays,
    });

    return reply.send({ success: true, data: license });
  });

  // Paystack Webhook
  server.post('/api/payments/paystack/webhook', async (request: any, reply) => {
    const signature = request.headers['x-paystack-signature'] as string;
    const secret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_secret';

    if (signature && !PaystackWebhookHandler.verifySignature(JSON.stringify(request.body), signature, secret)) {
      return reply.status(401).send({ error: 'Invalid Paystack signature' });
    }

    const processed = PaystackWebhookHandler.processEvent(request.body);
    return reply.send({ received: true, processed });
  });

  return server;
}

if (require.main === module) {
  createCloudApiServer().then((server) => {
    const port = parseInt(process.env.PORT || '5001', 10);
    server.listen({ port, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        console.error('Failed to start Cloud API server:', err);
        process.exit(1);
      }
      console.log(`☁️ Hospware Cloud SaaS API running at ${address}`);
    });
  });
}
