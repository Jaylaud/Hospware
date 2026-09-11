import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RoomStatus, UserRole } from '@hospware/core-domain';

export interface UserSession {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
}

export interface HubContextType {
  currentUser: UserSession;
  switchUser: (pin: string) => boolean;
  rooms: any[];
  reservations: any[];
  activeShift: any | null;
  overview: any | null;
  syncStatus: any | null;
  isConnected: boolean;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  updateRoomStatus: (roomId: string, nextStatus: RoomStatus, reason?: string) => Promise<boolean>;
  performWalkInCheckIn: (data: any) => Promise<any>;
  settleCheckout: (reservationId: string) => Promise<boolean>;
  openShift: (float: number) => Promise<boolean>;
  closeShiftBlindDrop: (countedCash: number, reason?: string) => Promise<any>;
  postPosOrder: (order: any) => Promise<any>;
  printFolioReceipt: (folioId: string) => Promise<string | null>;
}

const DEFAULT_USERS: UserSession[] = [
  { id: 'usr-1', fullName: 'Alice Johnson', username: 'admin', role: UserRole.OWNER },
  { id: 'usr-2', fullName: 'Kwame Mensah', username: 'reception', role: UserRole.FRONT_DESK },
  { id: 'usr-3', fullName: 'Abena Osei', username: 'housekeeping', role: UserRole.HOUSEKEEPER },
  { id: 'usr-4', fullName: 'Kofi Boateng', username: 'bar', role: UserRole.BAR_RESTAURANT_STAFF },
];

const PIN_MAP: Record<string, UserSession> = {
  '1234': DEFAULT_USERS[0],
  '2222': DEFAULT_USERS[1],
  '3333': DEFAULT_USERS[2],
  '4444': DEFAULT_USERS[3],
};

const HubContext = createContext<HubContextType | undefined>(undefined);

export const HubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession>(DEFAULT_USERS[1]); // Default to Front Desk
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [overview, setOverview] = useState<any | null>(null);
  const [syncStatus, setSyncStatus] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fast switch user by PIN
  const switchUser = (pin: string): boolean => {
    const user = PIN_MAP[pin];
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const refreshData = useCallback(async () => {
    try {
      const [roomsRes, resRes, shiftRes, overviewRes, syncRes] = await Promise.all([
        fetch('/api/rooms').then((r) => r.json()).catch(() => null),
        fetch('/api/reservations').then((r) => r.json()).catch(() => null),
        fetch('/api/shifts/active').then((r) => r.json()).catch(() => null),
        fetch('/api/system/overview').then((r) => r.json()).catch(() => null),
        fetch('/api/system/sync').then((r) => r.json()).catch(() => null),
      ]);

      if (roomsRes?.success) setRooms(roomsRes.data);
      if (resRes?.success) setReservations(resRes.data);
      if (shiftRes?.success) setActiveShift(shiftRes.activeShift);
      if (overviewRes?.success) setOverview(overviewRes.data);
      if (syncRes?.success) setSyncStatus(syncRes.data);
    } catch (err) {
      console.error('Error fetching hub data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect WebSocket for live LAN updates
  useEffect(() => {
    refreshData();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host || 'localhost:4321';
    const wsUrl = `${wsProtocol}//${wsHost}/ws`;

    let ws: WebSocket | null = null;
    let retryTimeout: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            console.log('⚡ LAN Event Received:', msg.event);

            if (msg.event === 'ROOM_STATUS_CHANGED') {
              setRooms((prev) =>
                prev.map((r) => (r.id === msg.data.id ? { ...r, status: msg.data.status, notes: msg.data.notes || r.notes } : r))
              );
            } else if (
              msg.event === 'RESERVATION_CREATED' ||
              msg.event === 'RESERVATION_CHECKED_OUT' ||
              msg.event === 'FOLIO_UPDATED' ||
              msg.event === 'SHIFT_OPENED' ||
              msg.event === 'SHIFT_CLOSED' ||
              msg.event === 'POS_ORDER_CREATED'
            ) {
              refreshData();
            }
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          retryTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch {
        setIsConnected(false);
        retryTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [refreshData]);

  // Update Room Status
  const updateRoomStatus = async (roomId: string, nextStatus: RoomStatus, reason?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextStatus,
          userRole: currentUser.role,
          userId: currentUser.id,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, status: nextStatus } : r)));
        refreshData();
        return true;
      }
      alert(data.error || 'Failed to update room status');
      return false;
    } catch {
      return false;
    }
  };

  // Walk-in Check-in
  const performWalkInCheckIn = async (data: any): Promise<any> => {
    const res = await fetch('/api/checkin/walk-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userId: currentUser.id }),
    });
    const json = await res.json();
    if (json.success) {
      await refreshData();
      return json.data;
    }
    throw new Error(json.error || 'Check-in failed');
  };

  // Checkout
  const settleCheckout = async (reservationId: string): Promise<boolean> => {
    const res = await fetch(`/api/checkout/${reservationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    });
    const json = await res.json();
    if (json.success) {
      await refreshData();
      return true;
    }
    alert(json.error || 'Checkout failed');
    return false;
  };

  // Open Shift
  const openShift = async (openingCashFloat: number): Promise<boolean> => {
    const res = await fetch('/api/shifts/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, openingCashFloat }),
    });
    const json = await res.json();
    if (json.success) {
      await refreshData();
      return true;
    }
    alert(json.error || 'Failed to open shift');
    return false;
  };

  // Blind Drop Shift Close
  const closeShiftBlindDrop = async (actualCountedCash: number, varianceReason?: string): Promise<any> => {
    if (!activeShift) return null;
    const res = await fetch('/api/shifts/blind-drop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shiftId: activeShift.id,
        actualCountedCash,
        varianceReason,
        userId: currentUser.id,
      }),
    });
    const json = await res.json();
    if (json.success) {
      await refreshData();
      return json.data;
    }
    throw new Error(json.error || 'Failed to close shift');
  };

  // Post POS order
  const postPosOrder = async (order: any): Promise<any> => {
    const res = await fetch('/api/pos/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...order, userId: currentUser.id, serverName: currentUser.fullName }),
    });
    const json = await res.json();
    if (json.success) {
      await refreshData();
      return json.data;
    }
    throw new Error(json.error || 'Failed to submit order');
  };

  // Print Folio Receipt
  const printFolioReceipt = async (folioId: string): Promise<string | null> => {
    const res = await fetch(`/api/folios/${folioId}/print-receipt`, {
      method: 'POST',
    });
    const json = await res.json();
    if (json.success) {
      return json.receiptBase64;
    }
    return null;
  };

  return (
    <HubContext.Provider
      value={{
        currentUser,
        switchUser,
        rooms,
        reservations,
        activeShift,
        overview,
        syncStatus,
        isConnected,
        isLoading,
        refreshData,
        updateRoomStatus,
        performWalkInCheckIn,
        settleCheckout,
        openShift,
        closeShiftBlindDrop,
        postPosOrder,
        printFolioReceipt,
      }}
    >
      {children}
    </HubContext.Provider>
  );
};

export const useHub = () => {
  const context = useContext(HubContext);
  if (!context) {
    throw new Error('useHub must be used within a HubProvider');
  }
  return context;
};
