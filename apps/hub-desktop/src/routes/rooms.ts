import { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { RoomStateMachine, RoomStatus, UserRole } from '@hospware/core-domain';
import { HubSyncEngine } from '../sync-engine';

export function registerRoomRoutes(
  server: FastifyInstance,
  sqlite: Database.Database,
  syncEngine: HubSyncEngine,
  broadcast: (event: string, data: any) => void
) {
  // GET all rooms
  server.get('/api/rooms', async (request, reply) => {
    const rooms = sqlite.prepare(`
      SELECT 
        r.id, r.property_id, r.room_number, r.floor, r.status, r.cleaning_priority, r.current_reservation_id, r.notes, r.updated_at,
        rt.id as room_type_id, rt.name as room_type_name, rt.code as room_type_code, rt.base_price, rt.amenities_json
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY r.floor ASC, r.room_number ASC
    `).all() as any[];

    const formatted = rooms.map((rm) => ({
      id: rm.id,
      propertyId: rm.property_id,
      roomNumber: rm.room_number,
      floor: rm.floor,
      status: rm.status,
      cleaningPriority: rm.cleaning_priority,
      currentReservationId: rm.current_reservation_id,
      notes: rm.notes,
      updatedAt: rm.updated_at,
      roomType: {
        id: rm.room_type_id,
        name: rm.room_type_name,
        code: rm.room_type_code,
        basePrice: rm.base_price,
        amenities: JSON.parse(rm.amenities_json || '[]'),
      },
    }));

    return reply.send({ success: true, count: formatted.length, data: formatted });
  });

  // PATCH room status
  server.patch('/api/rooms/:id/status', async (request: any, reply) => {
    const { id } = request.params;
    const { nextStatus, userRole = UserRole.FRONT_DESK, reason, userId = 'usr-1' } = request.body;

    const currentRoom = sqlite.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as any;
    if (!currentRoom) {
      return reply.status(404).send({ success: false, error: 'Room not found' });
    }

    const canTransition = RoomStateMachine.canTransition(
      currentRoom.status as RoomStatus,
      nextStatus as RoomStatus,
      userRole as UserRole
    );

    if (!canTransition) {
      return reply.status(400).send({
        success: false,
        error: `Cannot transition room ${currentRoom.room_number} from ${currentRoom.status} to ${nextStatus} with role ${userRole}`,
      });
    }

    const now = new Date().toISOString();
    sqlite.prepare(`
      UPDATE rooms
      SET status = ?, notes = COALESCE(?, notes), updated_at = ?
      WHERE id = ?
    `).run(nextStatus, reason || null, now, id);

    // Audit log
    sqlite.prepare(`
      INSERT INTO audit_logs (id, property_id, user_id, action, severity, metadata_json, created_at)
      VALUES (?, ?, ?, 'ROOM_STATUS_OVERRIDE', 'INFO', ?, ?)
    `).run(`audit-${Date.now()}`, currentRoom.property_id, userId, JSON.stringify({ roomId: id, from: currentRoom.status, to: nextStatus, reason }), now);

    // Record for cloud sync
    syncEngine.recordOutboxEvent('ROOM', id, 'UPDATE', { id, status: nextStatus, updatedAt: now });

    const updatedRoom = { ...currentRoom, status: nextStatus, updatedAt: now };

    // Broadcast WebSocket event to all connected LAN devices (e.g. housekeeping phones, front desk)
    broadcast('ROOM_STATUS_CHANGED', updatedRoom);

    return reply.send({ success: true, data: updatedRoom });
  });
}
