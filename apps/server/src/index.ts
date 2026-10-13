import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { 
  createDatabaseClient, 
  hotels, 
  users, 
  userInvitations, 
  rooms, 
  syncJournal, 
  eq, 
  desc 
} from '@hospware/database';

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

// Helper to broadcast WebSocket events to connected terminals
function broadcast(event: { type: string; payload: unknown }) {
  const message = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

// 1. Basic health and node discovery endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Hospware Hub Server',
    mode: 'offline-first',
    timestamp: new Date().toISOString(),
  });
});

// 2. Current Hotel Profile and Licensing Status
app.get('/api/hotels/current', (req, res) => {
  try {
    const existingHotels = db.select().from(hotels).limit(1).all();
    if (!existingHotels || existingHotels.length === 0) {
      return res.json({ paired: false, message: 'Hotel not paired yet' });
    }

    const currentHotel = existingHotels[0];
    const hotelRooms = db.select().from(rooms).where(eq(rooms.hotelId, currentHotel.id)).all();
    const hotelUsers = db.select().from(users).where(eq(users.hotelId, currentHotel.id)).all();

    return res.json({
      paired: true,
      hotel: currentHotel,
      stats: {
        roomCount: hotelRooms.length,
        staffCount: hotelUsers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching current hotel:', error);
    return res.status(500).json({ error: 'Failed to retrieve hotel profile' });
  }
});

// 3. Hotel Activation / Pairing (Called when pairing local hub with SaaS web registration)
app.post('/api/hotels/activate', (req, res) => {
  try {
    const {
      licenseKey,
      cloudTenantId,
      name,
      code,
      currency = 'USD',
      timeZone = 'UTC',
      address,
      phone,
      email,
      subscriptionTier = 'starter',
      subscriptionStatus = 'trialing',
      maxRooms = 30,
      ownerName,
      ownerEmail,
      ownerPin = '1234',
    } = req.body;

    if (!name || !code || !licenseKey || !ownerEmail) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, code, licenseKey, and ownerEmail are mandatory' 
      });
    }

    // Check if hotel already exists or create new one
    const existing = db.select().from(hotels).where(eq(hotels.code, code)).all();
    let hotelRecord;

    const hotelId = existing.length > 0 ? existing[0].id : randomUUID();

    if (existing.length > 0) {
      db.update(hotels)
        .set({
          name,
          licenseKey,
          cloudTenantId: cloudTenantId || existing[0].cloudTenantId,
          currency,
          timeZone,
          address,
          phone,
          email,
          subscriptionTier,
          subscriptionStatus,
          maxRooms,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(hotels.id, hotelId))
        .run();
      hotelRecord = db.select().from(hotels).where(eq(hotels.id, hotelId)).all()[0];
    } else {
      hotelRecord = {
        id: hotelId,
        name,
        code,
        currency,
        timeZone,
        address,
        phone,
        email,
        taxNumber: null,
        licenseKey,
        cloudTenantId: cloudTenantId || randomUUID(),
        subscriptionStatus,
        subscriptionTier,
        maxRooms,
        settingsJson: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        version: 1,
      };
      db.insert(hotels).values(hotelRecord).run();
    }

    // Ensure Owner User exists
    let owner = db.select().from(users).where(eq(users.hotelId, hotelId)).all().find(u => u.role === 'owner');
    if (!owner) {
      const ownerId = randomUUID();
      const newOwner = {
        id: ownerId,
        hotelId,
        name: ownerName || 'Property Owner',
        email: ownerEmail,
        phone: phone || null,
        passwordHash: null,
        pinCode: ownerPin,
        role: 'owner' as const,
        isActive: true,
        mustChangePin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        version: 1,
      };
      db.insert(users).values(newOwner).run();
      owner = newOwner;
    }

    // Record in Sync Journal
    db.insert(syncJournal).values({
      id: randomUUID(),
      hotelId,
      tableName: 'hotels',
      recordId: hotelId,
      operation: 'INSERT',
      payloadJson: JSON.stringify(hotelRecord),
      nodeId: 'HUB-SERVER-01',
      createdAt: new Date().toISOString(),
      syncedToCloud: true,
      syncedAt: new Date().toISOString(),
      retryCount: 0,
      lastError: null,
    }).run();

    broadcast({ type: 'HOTEL_ACTIVATED', payload: { hotel: hotelRecord, owner } });

    return res.json({
      success: true,
      message: 'Hotel successfully paired and activated on local hub',
      hotel: hotelRecord,
      owner,
    });
  } catch (error) {
    console.error('Error activating hotel:', error);
    return res.status(500).json({ error: 'Failed to activate hotel' });
  }
});

// 4. Staff Management: Get users
app.get('/api/users', (req, res) => {
  try {
    const hotelList = db.select().from(hotels).limit(1).all();
    if (!hotelList.length) {
      return res.json({ users: [] });
    }
    const staffList = db.select().from(users).where(eq(users.hotelId, hotelList[0].id)).all();
    return res.json({ users: staffList });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 5. Staff Management: Quick Onboarding for Floor Staff (Fast PIN)
app.post('/api/users/staff', (req, res) => {
  try {
    const { hotelId, name, role, email, phone, pinCode } = req.body;

    if (!hotelId || !name || !role) {
      return res.status(400).json({ error: 'Missing hotelId, name, or role' });
    }

    const newStaff = {
      id: randomUUID(),
      hotelId,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@internal.local`,
      phone: phone || null,
      passwordHash: null,
      pinCode: pinCode || Math.floor(1000 + Math.random() * 9000).toString(),
      role,
      isActive: true,
      mustChangePin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      version: 1,
    };

    db.insert(users).values(newStaff).run();

    // Log to sync journal
    db.insert(syncJournal).values({
      id: randomUUID(),
      hotelId,
      tableName: 'users',
      recordId: newStaff.id,
      operation: 'INSERT',
      payloadJson: JSON.stringify(newStaff),
      nodeId: 'HUB-SERVER-01',
      createdAt: new Date().toISOString(),
      syncedToCloud: false,
      retryCount: 0,
      lastError: null,
    }).run();

    broadcast({ type: 'STAFF_PROVISIONED', payload: newStaff });

    return res.status(201).json({
      success: true,
      user: newStaff,
    });
  } catch (error) {
    console.error('Error creating staff user:', error);
    return res.status(500).json({ error: 'Failed to create staff user' });
  }
});

// 6. User Invitations: Create invitation (Remote / Management track)
app.post('/api/invitations', (req, res) => {
  try {
    const { hotelId, email, role, invitedByUserId } = req.body;

    if (!hotelId || !email || !role) {
      return res.status(400).json({ error: 'Missing hotelId, email, or role' });
    }

    const invitation = {
      id: randomUUID(),
      hotelId,
      email,
      role,
      token: randomUUID(),
      invitedByUserId: invitedByUserId || null,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      acceptedAt: null,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      version: 1,
    };

    db.insert(userInvitations).values(invitation).run();

    return res.status(201).json({
      success: true,
      invitation,
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// 7. User Invitations: List
app.get('/api/invitations', (req, res) => {
  try {
    const hotelList = db.select().from(hotels).limit(1).all();
    if (!hotelList.length) {
      return res.json({ invitations: [] });
    }
    const invites = db.select()
      .from(userInvitations)
      .where(eq(userInvitations.hotelId, hotelList[0].id))
      .orderBy(desc(userInvitations.createdAt))
      .all();
    return res.json({ invitations: invites });
  } catch (error) {
    console.error('Error listing invitations:', error);
    return res.status(500).json({ error: 'Failed to list invitations' });
  }
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
