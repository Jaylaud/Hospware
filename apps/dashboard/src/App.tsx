import React, { useState, useEffect } from 'react';
import { Theme, Box, Flex, Text, Heading } from '@radix-ui/themes';
import {
  UtensilsCrossed,
  Sparkles,
  Receipt as ReceiptIcon,
  Clock,
  Printer,
  CheckCircle2,
  X,
  UserCheck,
  LogOut,
  Search,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Bell,
  Sun,
  Moon,
  LayoutGrid,
  Minimize2,
  Layers,
  Calendar,
  CalendarPlus,
  AlertTriangle
} from 'lucide-react';
import type { Room, RoomStatus } from '@hospware/types';
import { isSupabaseConfigured } from './supabase';

export interface ReservationEntry {
  id: string;
  bookingRef: string;
  guestName: string;
  phone: string;
  roomNumber: string;
  roomType: string;
  rate: number;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  totalAmount: number;
  depositPaid: number;
  paymentMethod: 'mobile_money' | 'card' | 'cash';
  source: 'WhatsApp' | 'Phone' | 'Direct Walk-In' | 'Booking.com' | 'Airbnb';
  notes?: string;
}

const getTodayIso = () => new Date().toISOString().split('T')[0];
const getOffsetIso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const INITIAL_ROOMS: (Partial<Room> & { typeName: string; rate: number; currentGuest?: string; posCharges?: number })[] = [
  { id: '101', roomNumber: '101', status: 'available', floor: '1', typeName: 'Standard King', rate: 350 },
  { id: '102', roomNumber: '102', status: 'occupied', floor: '1', typeName: 'Standard King', rate: 350, currentGuest: 'Kwesi Appiah', posCharges: 0 },
  { id: '103', roomNumber: '103', status: 'dirty', floor: '1', typeName: 'Deluxe Queen', rate: 450 },
  { id: '104', roomNumber: '104', status: 'reserved', floor: '1', typeName: 'Deluxe Queen', rate: 450, currentGuest: 'Nana Ama Ofori' },
  { id: '201', roomNumber: '201', status: 'occupied', floor: '2', typeName: 'Executive Suite', rate: 680, currentGuest: 'Akosua Mensah', posCharges: 0 },
  { id: '202', roomNumber: '202', status: 'cleaning', floor: '2', typeName: 'Standard Double', rate: 320 },
  { id: '203', roomNumber: '203', status: 'maintenance', floor: '2', typeName: 'Deluxe King', rate: 480 },
  { id: '204', roomNumber: '204', status: 'reserved', floor: '2', typeName: 'Executive Suite', rate: 680, currentGuest: 'Kofi Mensah' },
  { id: '301', roomNumber: '301', status: 'available', floor: '3', typeName: 'Penthouse View', rate: 950 },
  { id: '302', roomNumber: '302', status: 'occupied', floor: '3', typeName: 'Penthouse View', rate: 950, currentGuest: 'Yaw Boateng', posCharges: 0 },
  { id: '303', roomNumber: '303', status: 'dirty', floor: '3', typeName: 'Standard Double', rate: 320 },
  { id: '304', roomNumber: '304', status: 'available', floor: '3', typeName: 'Deluxe Queen', rate: 450 },
];

const INITIAL_RESERVATIONS: ReservationEntry[] = [
  {
    id: 'res-1',
    bookingRef: 'RES-2026-4102',
    guestName: 'Nana Ama Ofori',
    phone: '024 812 9045',
    roomNumber: '104',
    roomType: 'Deluxe Queen',
    rate: 450,
    checkInDate: getTodayIso(),
    checkOutDate: getOffsetIso(2),
    nights: 2,
    status: 'confirmed',
    paymentStatus: 'partially_paid',
    totalAmount: 990,
    depositPaid: 500,
    paymentMethod: 'mobile_money',
    source: 'WhatsApp',
    notes: 'Arriving around 3:00 PM. Paid GH₵ 500 MTN MoMo deposit.'
  },
  {
    id: 'res-2',
    bookingRef: 'RES-2026-4105',
    guestName: 'Kofi Mensah',
    phone: '054 331 7820',
    roomNumber: '204',
    roomType: 'Executive Suite',
    rate: 680,
    checkInDate: getTodayIso(),
    checkOutDate: getOffsetIso(3),
    nights: 3,
    status: 'confirmed',
    paymentStatus: 'paid',
    totalAmount: 2244,
    depositPaid: 2244,
    paymentMethod: 'card',
    source: 'Booking.com',
    notes: 'Pre-paid in full via Visa. Airport pickup requested.'
  },
  {
    id: 'res-3',
    bookingRef: 'RES-2026-4109',
    guestName: 'Dr. Esi Sutherland',
    phone: '020 904 1122',
    roomNumber: '301',
    roomType: 'Penthouse View',
    rate: 950,
    checkInDate: getOffsetIso(2),
    checkOutDate: getOffsetIso(4),
    nights: 2,
    status: 'confirmed',
    paymentStatus: 'unpaid',
    totalAmount: 2090,
    depositPaid: 0,
    paymentMethod: 'mobile_money',
    source: 'Phone',
    notes: 'VIP conference speaker. Will settle via MoMo on arrival.'
  },
  {
    id: 'res-4',
    bookingRef: 'RES-2026-4098',
    guestName: 'Kwesi Appiah',
    phone: '024 551 3309',
    roomNumber: '102',
    roomType: 'Standard King',
    rate: 350,
    checkInDate: getOffsetIso(-1),
    checkOutDate: getOffsetIso(1),
    nights: 2,
    status: 'checked_in',
    paymentStatus: 'paid',
    totalAmount: 770,
    depositPaid: 770,
    paymentMethod: 'mobile_money',
    source: 'Direct Walk-In'
  }
];

const GHANA_MENU_ITEMS = [
  { id: 'm1', name: 'Jollof Rice & Grilled Chicken', price: 65, category: 'Mains' },
  { id: 'm2', name: 'Banku & Charcoal Grilled Tilapia', price: 85, category: 'Local Specialties' },
  { id: 'm3', name: 'Fried Yam & Spicy Suya Beef', price: 55, category: 'Small Chops' },
  { id: 'm4', name: 'Club Premium Beer (Large)', price: 25, category: 'Beverages' },
  { id: 'm5', name: 'Fresh Pineapple & Ginger Juice', price: 22, category: 'Beverages' },
  { id: 'm6', name: 'Espresso / Americano', price: 18, category: 'Coffee' },
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('hospware_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });
  const [activeNav, setActiveNav] = useState<'rooms' | 'reservations' | 'pos' | 'housekeeping' | 'billing'>(() => {
    const params = new URLSearchParams(window.location.search);
    const mod = params.get('module');
    if (mod === 'rooms' || mod === 'reservations' || mod === 'pos' || mod === 'housekeeping' || mod === 'billing') {
      return mod;
    }
    return 'rooms';
  });
  const [rooms, setRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('hospware_rooms_state_v2');
      if (saved) return JSON.parse(saved) as typeof INITIAL_ROOMS;
    } catch {
      // ignore storage errors
    }
    return INITIAL_ROOMS;
  });
  const [reservations, setReservations] = useState<ReservationEntry[]>(() => {
    try {
      const saved = localStorage.getItem('hospware_reservations_state_v1');
      if (saved) return JSON.parse(saved) as ReservationEntry[];
    } catch {
      // ignore storage errors
    }
    return INITIAL_RESERVATIONS;
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [compactView, setCompactView] = useState<boolean>(false);
  const [reservationFilter, setReservationFilter] = useState<'all' | 'arriving_today' | 'upcoming' | 'checked_in' | 'cancelled'>('all');
  const [reservationSearch, setReservationSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [chartRange, setChartRange] = useState<'12m' | '30d' | '1w'>('30d');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('hospware_rooms_state_v2', JSON.stringify(rooms));
    } catch {
      // ignore storage errors
    }
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.setItem('hospware_reservations_state_v1', JSON.stringify(reservations));
    } catch {
      // ignore storage errors
    }
  }, [reservations]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('hospware_theme', next);
      return next;
    });
  };

  // Restaurant POS State
  const [cartItems, setCartItems] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [posRoomTarget, setPosRoomTarget] = useState('102');
  const [posSuccessToast, setPosSuccessToast] = useState<string | null>(null);

  // Modal States
  const [selectedRoom, setSelectedRoom] = useState<typeof INITIAL_ROOMS[0] | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<ReservationEntry | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [arrivalPaymentMethod, setArrivalPaymentMethod] = useState<'cash' | 'card' | 'mobile_money'>('mobile_money');

  // Check-In Form
  const [checkInForm, setCheckInForm] = useState({
    guestName: '',
    phone: '',
    nights: 2,
    paymentMethod: 'card' as 'cash' | 'card' | 'mobile_money',
    payNow: true,
  });

  // New Reservation Form
  const [newReservationForm, setNewReservationForm] = useState({
    guestName: '',
    phone: '',
    roomNumber: '101',
    checkInDate: getTodayIso(),
    nights: 2,
    source: 'Phone' as ReservationEntry['source'],
    depositPaid: 0,
    paymentMethod: 'mobile_money' as 'cash' | 'card' | 'mobile_money',
    notes: '',
  });

  // Current Printable Receipt Data
  const [receiptData, setReceiptData] = useState<{
    receiptNumber: string;
    hotelName: string;
    address: string;
    guestName: string;
    roomNumber: string;
    description: string;
    subtotal: number;
    tax: number;
    total: number;
    paid: number;
    paymentMethod: string;
    issuedAt: string;
    cashier: string;
    depositCredited?: number;
    balanceRemaining?: number;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusClass = (status?: RoomStatus) => {
    switch (status) {
      case 'available': return 'available';
      case 'reserved': return 'reserved';
      case 'occupied': return 'occupied';
      case 'dirty': return 'dirty';
      case 'cleaning': return 'dirty';
      case 'maintenance': return 'maintenance';
      default: return 'available';
    }
  };

  const openNewReservationForRoom = (roomNumber?: string) => {
    const defaultRoom = roomNumber || rooms.find(r => r.status === 'available')?.roomNumber || '101';
    setNewReservationForm({
      guestName: '',
      phone: '',
      roomNumber: defaultRoom,
      checkInDate: getTodayIso(),
      nights: 2,
      source: 'Phone',
      depositPaid: 0,
      paymentMethod: 'mobile_money',
      notes: '',
    });
    setShowCheckInModal(false);
    setShowNewReservationModal(true);
  };

  const handleRoomClick = (room: typeof INITIAL_ROOMS[0]) => {
    setSelectedRoom(room);
    if (room.status === 'available') {
      setCheckInForm({
        guestName: '',
        phone: '',
        nights: 2,
        paymentMethod: 'card',
        payNow: true,
      });
      setShowCheckInModal(true);
    } else if (room.status === 'reserved') {
      const existingRes: ReservationEntry = reservations.find(
        res => res.roomNumber === room.roomNumber && res.status === 'confirmed'
      ) || {
        id: `res-temp-${room.roomNumber}`,
        bookingRef: `RES-2026-${room.roomNumber}`,
        guestName: room.currentGuest || 'Reserved Guest',
        phone: '024 000 0000',
        roomNumber: room.roomNumber || '104',
        roomType: room.typeName,
        rate: room.rate,
        checkInDate: getTodayIso(),
        checkOutDate: getOffsetIso(2),
        nights: 2,
        status: 'confirmed',
        paymentStatus: 'partially_paid',
        totalAmount: Math.round(room.rate * 2 * 1.1),
        depositPaid: room.rate,
        paymentMethod: 'mobile_money',
        source: 'Phone',
        notes: 'Reserved arrival on room matrix',
      };
      setSelectedReservation(existingRes);
      setArrivalPaymentMethod('mobile_money');
      setShowArrivalModal(true);
    } else if (room.status === 'occupied') {
      setShowPaymentModal(true);
    }
  };

  // Create a new reservation & optionally print deposit receipt
  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReservationForm.guestName) return;

    const targetRoom = rooms.find(r => r.roomNumber === newReservationForm.roomNumber) || rooms[0];
    const subtotal = targetRoom.rate * newReservationForm.nights;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    const deposit = Math.min(Math.max(0, Number(newReservationForm.depositPaid) || 0), total);

    const checkInObj = new Date(newReservationForm.checkInDate + 'T00:00:00');
    const checkOutObj = new Date(checkInObj);
    checkOutObj.setDate(checkOutObj.getDate() + newReservationForm.nights);
    const checkOutIso = checkOutObj.toISOString().split('T')[0];

    const resNum = `RES-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry: ReservationEntry = {
      id: `res-${Date.now()}`,
      bookingRef: resNum,
      guestName: newReservationForm.guestName,
      phone: newReservationForm.phone || '024 000 0000',
      roomNumber: targetRoom.roomNumber || '101',
      roomType: targetRoom.typeName,
      rate: targetRoom.rate,
      checkInDate: newReservationForm.checkInDate,
      checkOutDate: checkOutIso,
      nights: newReservationForm.nights,
      status: 'confirmed',
      paymentStatus: deposit >= total ? 'paid' : deposit > 0 ? 'partially_paid' : 'unpaid',
      totalAmount: total,
      depositPaid: deposit,
      paymentMethod: newReservationForm.paymentMethod,
      source: newReservationForm.source,
      notes: newReservationForm.notes || undefined,
    };

    setReservations(prev => [newEntry, ...prev]);

    // If arriving today (or earlier) and room is available, hold the room as 'reserved'
    if (newReservationForm.checkInDate <= getTodayIso() && targetRoom.status === 'available') {
      setRooms(prev => prev.map(r =>
        r.roomNumber === targetRoom.roomNumber
          ? { ...r, status: 'reserved' as RoomStatus, currentGuest: newReservationForm.guestName }
          : r
      ));
    }

    setShowNewReservationModal(false);

    if (deposit > 0) {
      setReceiptData({
        receiptNumber: `DEP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        hotelName: 'The Grand Azure Resort',
        address: 'Ocean Drive 402, Miami Beach, FL',
        guestName: newEntry.guestName,
        roomNumber: newEntry.roomNumber,
        description: `Reservation Deposit (${newEntry.bookingRef} • ${newEntry.nights} Nights)`,
        subtotal,
        tax,
        total,
        paid: deposit,
        paymentMethod: newReservationForm.paymentMethod.toUpperCase(),
        issuedAt: new Date().toLocaleString(),
        cashier: 'Caroline A. (Desk 01)',
        balanceRemaining: Math.max(0, total - deposit),
      });
      setShowReceiptModal(true);
    }
  };

  // Convert a confirmed reservation into an active occupied stay
  const handlePerformArrivalCheckIn = (resToCheckIn?: ReservationEntry) => {
    const targetRes = resToCheckIn || selectedReservation;
    if (!targetRes) return;

    const subtotal = targetRes.rate * targetRes.nights;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    const balanceCollected = Math.max(0, total - targetRes.depositPaid);
    const receiptNum = `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    setReservations(prev => prev.map(res =>
      res.id === targetRes.id
        ? { ...res, status: 'checked_in', paymentStatus: 'paid', depositPaid: total }
        : res
    ));

    setRooms(prev => prev.map(r =>
      r.roomNumber === targetRes.roomNumber
        ? { ...r, status: 'occupied' as RoomStatus, currentGuest: targetRes.guestName }
        : r
    ));

    setReceiptData({
      receiptNumber: receiptNum,
      hotelName: 'The Grand Azure Resort',
      address: 'Ocean Drive 402, Miami Beach, FL',
      guestName: targetRes.guestName,
      roomNumber: targetRes.roomNumber,
      description: `${targetRes.roomType} (${targetRes.nights} Nights • ${targetRes.bookingRef})`,
      subtotal,
      tax,
      total,
      paid: balanceCollected,
      paymentMethod: arrivalPaymentMethod.toUpperCase(),
      issuedAt: new Date().toLocaleString(),
      cashier: 'Caroline A. (Desk 01)',
      depositCredited: targetRes.depositPaid,
      balanceRemaining: 0,
    });

    setShowArrivalModal(false);
    setShowReceiptModal(true);
  };

  // Cancel a reservation & release held room if status is 'reserved'
  const handleCancelReservation = (res: ReservationEntry) => {
    setReservations(prev => prev.map(item =>
      item.id === res.id ? { ...item, status: 'cancelled' } : item
    ));
    setRooms(prev => prev.map(r =>
      r.roomNumber === res.roomNumber && r.status === 'reserved'
        ? { ...r, status: 'available' as RoomStatus, currentGuest: undefined }
        : r
    ));
    setShowArrivalModal(false);
  };

  // Check-in guest & generate receipt
  const handlePerformCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !checkInForm.guestName) return;

    const subtotal = selectedRoom.rate * checkInForm.nights;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    const receiptNum = `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update room state
    setRooms(prev => prev.map(r => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          status: 'occupied' as RoomStatus,
          currentGuest: checkInForm.guestName
        };
      }
      return r;
    }));

    // Create receipt
    const newReceipt = {
      receiptNumber: receiptNum,
      hotelName: 'The Grand Azure Resort',
      address: 'Ocean Drive 402, Miami Beach, FL',
      guestName: checkInForm.guestName,
      roomNumber: selectedRoom.roomNumber || '',
      description: `${selectedRoom.typeName} (${checkInForm.nights} Nights)`,
      subtotal,
      tax,
      total,
      paid: checkInForm.payNow ? total : 0,
      paymentMethod: checkInForm.paymentMethod.toUpperCase(),
      issuedAt: new Date().toLocaleString(),
      cashier: 'Caroline A. (Desk 01)',
    };

    setReceiptData(newReceipt);
    setShowCheckInModal(false);
    setShowReceiptModal(true);
  };

  // Check-out guest
  const handlePerformCheckOut = () => {
    if (!selectedRoom) return;
    setRooms(prev => prev.map(r => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          status: 'dirty' as RoomStatus,
          currentGuest: undefined
        };
      }
      return r;
    }));
    setShowPaymentModal(false);
    setSelectedRoom(null);
  };

  // Quick mark clean
  const handleMarkRoomClean = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        return { ...r, status: 'available' as RoomStatus };
      }
      return r;
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const availableCount = rooms.filter(r => r.status === 'available').length;
  const reservedCount = rooms.filter(r => r.status === 'reserved').length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const dirtyCount = rooms.filter(r => r.status === 'dirty' || r.status === 'cleaning').length;
  const maintenanceCount = rooms.filter(r => r.status === 'maintenance').length;
  const occupancyPercentage = Math.round((occupiedCount / rooms.length) * 100);

  const todayIso = getTodayIso();
  const arrivingTodayCount = reservations.filter(r => r.status === 'confirmed' && r.checkInDate <= todayIso).length;
  const upcomingCount = reservations.filter(r => r.status === 'confirmed' && r.checkInDate > todayIso).length;
  const checkedInResCount = reservations.filter(r => r.status === 'checked_in').length;
  const depositsHeldTotal = reservations
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + (r.depositPaid || 0), 0);

  const filteredReservations = reservations
    .filter(r => {
      if (reservationFilter === 'arriving_today') return r.status === 'confirmed' && r.checkInDate <= todayIso;
      if (reservationFilter === 'upcoming') return r.status === 'confirmed' && r.checkInDate > todayIso;
      if (reservationFilter === 'checked_in') return r.status === 'checked_in';
      if (reservationFilter === 'cancelled') return r.status === 'cancelled';
      return true;
    })
    .filter(r =>
      !reservationSearch ||
      r.guestName.toLowerCase().includes(reservationSearch.toLowerCase()) ||
      r.roomNumber.includes(reservationSearch) ||
      r.bookingRef.toLowerCase().includes(reservationSearch.toLowerCase()) ||
      r.phone.includes(reservationSearch)
    );

  const filteredRooms = rooms
    .filter(r => filterStatus === 'all' || r.status === filterStatus)
    .filter(r => !searchQuery || r.roomNumber?.includes(searchQuery) || r.currentGuest?.toLowerCase().includes(searchQuery.toLowerCase()));

  const groupedFloors = Array.from(new Set(filteredRooms.map(r => r.floor || '1'))).sort(
    (a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0)
  );

  return (
    <Theme appearance={theme} accentColor="indigo" grayColor="slate" radius="large" scaling="100%">
      <div className="dashboard-shell" data-theme={theme}>
        {/* ===================================================================== */}
        {/* TOP HEADER: BRAND + CAPSULE NAV + CONTROLS                            */}
        {/* ===================================================================== */}
        <header className="app-header">
          <div className="app-header-container">
            <div className="brand-area" onClick={() => setActiveNav('rooms')} style={{ cursor: 'pointer' }}>
              <div>
                <img
                  src="/hospware-logo.png"
                  alt="Hospware"
                  className="brand-logo-img"
                />
                <div className="brand-tag">Premises Hub • Terminal 01</div>
              </div>
            </div>

            {/* Floating Capsule Nav */}
            <nav className="capsule-nav-container">
              <button
                className={`capsule-nav-tab ${activeNav === 'rooms' ? 'active' : ''}`}
                onClick={() => setActiveNav('rooms')}
              >
                Front Desk
              </button>
              <button
                className={`capsule-nav-tab ${activeNav === 'reservations' ? 'active' : ''}`}
                onClick={() => setActiveNav('reservations')}
              >
                Reservations {arrivingTodayCount > 0 ? `(${arrivingTodayCount})` : ''}
              </button>
              <button
                className={`capsule-nav-tab ${activeNav === 'pos' ? 'active' : ''}`}
                onClick={() => setActiveNav('pos')}
              >
                POS & Dining
              </button>
              <button
                className={`capsule-nav-tab ${activeNav === 'housekeeping' ? 'active' : ''}`}
                onClick={() => setActiveNav('housekeeping')}
              >
                Housekeeping
              </button>
              <button
                className={`capsule-nav-tab ${activeNav === 'billing' ? 'active' : ''}`}
                onClick={() => setActiveNav('billing')}
              >
                Folios
              </button>
            </nav>

            {/* Right Action Icons & Attendant Badge */}
            <div className="header-actions">
              {/* Live Clock & Supabase Sync Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--hw-bg-surface)',
                border: '1px solid var(--hw-border)',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 12px',
                fontSize: '0.78rem',
                color: 'var(--hw-text-secondary)'
              }}>
                <Clock size={13} color="var(--hw-text-muted)" />
                <span style={{ fontWeight: 600, color: 'var(--hw-text-primary)' }}>{currentTime}</span>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isSupabaseConfigured() ? '#10b981' : '#38bdf8',
                  marginLeft: '4px',
                  boxShadow: `0 0 6px ${isSupabaseConfigured() ? '#10b981' : '#38bdf8'}`
                }} title={isSupabaseConfigured() ? 'Supabase Live' : 'Local Terminal Synced'}></span>
              </div>

              <button className="circle-btn" title="Search room or reservation" onClick={() => setActiveNav('reservations')}>
                <Search size={17} />
              </button>

              <button className="circle-btn" title="Notifications">
                <Bell size={17} />
                <span className="badge-counter"></span>
              </button>

              {/* Theme Toggle Button */}
              <button
                className="circle-btn"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <div className="avatar-chip">
                <div className="avatar-photo">CA</div>
                <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '4px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--hw-text-primary)', lineHeight: 1.1 }}>Caroline A.</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--hw-text-secondary)' }}>Front Desk Lead</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* MAIN CONTENT CANVAS                                                   */}
        {/* ===================================================================== */}
        <main className="dashboard-main-container">

          {/* =================================================================== */}
          {/* METRICS STRIP: % OCCUPIED, NUMBER AVAILABLE & LARGE DISPLAY NUMBERS */}
          {/* =================================================================== */}
          <div className="welcome-metrics-strip">
            {/* First line pills: % occupied & number available */}
            <div className="kpi-pills-row">
              <span className="kpi-pill pink">
                {occupancyPercentage}% Occupied
              </span>
              <span className="kpi-pill white">
                {availableCount} Available
              </span>
              <span
                className="kpi-pill white"
                style={{ cursor: 'pointer', borderColor: 'rgba(139, 92, 246, 0.45)', color: '#c4b5fd', background: 'rgba(139, 92, 246, 0.14)' }}
                onClick={() => setActiveNav('reservations')}
              >
                {reservedCount} Reserved Today
              </span>
            </div>

            {/* Large display numbers with trend chips */}
            <div className="top-stats-container">
              <div className="stat-metric-col">
                <div className="stat-metric-row">
                  <span className="stat-trend-chip green">
                    <TrendingUp size={14} />
                  </span>
                  <span className="stat-metric-number">{availableCount}</span>
                </div>
                <span className="stat-metric-label">Available rooms</span>
              </div>

              <div className="stat-metric-col">
                <div className="stat-metric-row">
                  <span className="stat-trend-chip green">
                    <TrendingUp size={14} />
                  </span>
                  <span className="stat-metric-number">{occupiedCount}</span>
                </div>
                <span className="stat-metric-label">Occupied today</span>
              </div>

              <div className="stat-metric-col" style={{ cursor: 'pointer' }} onClick={() => setActiveNav('reservations')}>
                <div className="stat-metric-row">
                  <span className="stat-trend-chip green" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }}>
                    <Calendar size={14} />
                  </span>
                  <span className="stat-metric-number">{arrivingTodayCount}</span>
                </div>
                <span className="stat-metric-label">Arrivals due</span>
              </div>

              <div className="stat-metric-col">
                <div className="stat-metric-row">
                  <span className="stat-trend-chip red">
                    <TrendingDown size={14} />
                  </span>
                  <span className="stat-metric-number">{dirtyCount}</span>
                </div>
                <span className="stat-metric-label">Turnover pending</span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* VIEW: FRONT DESK & ROOM MATRIX (PRIMARY MAIN CONTENT)               */}
          {/* =================================================================== */}
          {activeNav === 'rooms' && (
            <Flex direction="column" gap="5">
              {/* ROW 1 (FIRST THING ON PAGE): PREMISES ROOM MATRIX & TERMINAL PULSE */}
              <div className="room-matrix-pulse-grid">

                {/* Main Box: Premises Room Matrix */}
                <Box className="hw-box-container">
                  <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
                    <div>
                      <Heading size="4" style={{ color: 'var(--hw-text-primary)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Premises Room Matrix
                      </Heading>
                      <Text size="2" style={{ color: 'var(--hw-text-secondary)' }}>
                        Live room availability, reserved arrivals, check-in, folios, and turnover
                      </Text>
                    </div>

                    {/* Search and Filters */}
                    <Flex align="center" gap="2" wrap="wrap">
                      <div style={{ position: 'relative', minWidth: '185px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--hw-text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Search room or guest..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            padding: '0.45rem 0.85rem 0.45rem 2.1rem',
                            background: 'var(--hw-input-bg)',
                            border: '1px solid var(--hw-border)',
                            borderRadius: '9999px',
                            color: 'var(--hw-input-color)',
                            fontSize: '0.8rem',
                            width: '100%',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div className="filter-pills-bar">
                        {['all', 'available', 'reserved', 'occupied', 'dirty'].map(f => (
                          <button
                            key={f}
                            className={`filter-pill-btn ${filterStatus === f ? 'active' : ''}`}
                            onClick={() => setFilterStatus(f)}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        className={`compact-toggle-btn ${compactView ? 'active' : ''}`}
                        onClick={() => setCompactView(prev => !prev)}
                        title={compactView ? 'Switch to standard room cards' : 'Switch to compact room view'}
                      >
                        {compactView ? <LayoutGrid size={13} /> : <Minimize2 size={13} />}
                        <span>{compactView ? 'Standard View' : 'Compact View'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-hw-primary"
                        style={{ padding: '0.42rem 0.9rem', fontSize: '0.76rem' }}
                        onClick={() => openNewReservationForRoom()}
                      >
                        <CalendarPlus size={14} />
                        <span>Reserve Room</span>
                      </button>
                    </Flex>
                  </Flex>

                  <div className={`floors-matrix-stack ${compactView ? 'compact' : ''}`}>
                    {groupedFloors.map((floor) => {
                      const floorRooms = filteredRooms.filter(r => (r.floor || '1') === floor);
                      const floorAvailable = floorRooms.filter(r => r.status === 'available').length;
                      const floorReserved = floorRooms.filter(r => r.status === 'reserved').length;
                      return (
                        <div key={floor} className="floor-section-block">
                          <div className="floor-section-header">
                            <div className="floor-title-pill">
                              <Layers size={13} />
                              <span>Floor {floor}</span>
                            </div>
                            <span className="floor-meta-text">
                              {floorRooms.length} {floorRooms.length === 1 ? 'Room' : 'Rooms'} • {floorAvailable} Available{floorReserved > 0 ? ` • ${floorReserved} Reserved` : ''}
                            </span>
                          </div>

                          <div className={`rooms-grid ${compactView ? 'compact' : ''}`}>
                            {floorRooms.map((room) => (
                              <div
                                key={room.id}
                                className={`hw-room-card ${compactView ? `compact ${getStatusClass(room.status as RoomStatus)}` : ''}`}
                                onClick={() => handleRoomClick(room)}
                              >
                                <div>
                                  <div className="room-badge-top-row">
                                    <span className={`room-status-badge ${getStatusClass(room.status as RoomStatus)}`}>
                                      {room.status}
                                    </span>
                                  </div>

                                  <div className="hw-room-number">Room {room.roomNumber}</div>
                                  <div className="hw-room-type">
                                    {compactView ? room.typeName : `${room.typeName} • Floor ${room.floor}`}
                                  </div>
                                </div>

                                <div className="hw-room-card-footer">
                                  <Flex justify="between" align="center">
                                    <span className="hw-room-rate">
                                      GH₵ {room.rate}
                                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>/nt</span>
                                    </span>

                                    {room.status === 'available' && (
                                      <span style={{ fontSize: compactView ? '0.68rem' : '0.75rem', color: '#34d399', fontWeight: 600 }}>
                                        + Check-In
                                      </span>
                                    )}
                                    {room.status === 'reserved' && (
                                      <span style={{ fontSize: compactView ? '0.68rem' : '0.75rem', color: '#c4b5fd', fontWeight: 600 }}>
                                        {compactView ? (room.currentGuest?.split(' ')[0] || 'Arriving') : `${room.currentGuest?.split(' ')[0] || 'Guest'} → Check-In`}
                                      </span>
                                    )}
                                    {room.status === 'occupied' && (
                                      <span style={{ fontSize: compactView ? '0.68rem' : '0.75rem', color: '#60a5fa', fontWeight: 600 }}>
                                        {room.currentGuest?.split(' ')[0]}
                                      </span>
                                    )}
                                    {room.status === 'dirty' && (
                                      <button
                                        onClick={(e) => handleMarkRoomClean(room.id!, e)}
                                        style={{
                                          background: 'rgba(255,46,126,0.15)',
                                          border: '1px solid rgba(255,46,126,0.3)',
                                          color: '#ff669d',
                                          borderRadius: '9999px',
                                          padding: compactView ? '1px 6px' : '2px 8px',
                                          fontSize: compactView ? '0.64rem' : '0.7rem',
                                          fontWeight: 600,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {compactView ? 'Clean' : 'Mark Clean'}
                                      </button>
                                    )}
                                  </Flex>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Box>

                {/* Standout Terminal Pulse Box */}
                <Box className="hw-box-electric-blue">
                  <div>
                    <Flex justify="between" align="center" mb="3">
                      <Heading size="3" style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                        Terminal Pulse
                      </Heading>
                      <button className="arrow-circle-btn" onClick={() => setActiveNav('reservations')} title="View Reservations & Arrivals">
                        <ArrowUpRight size={18} />
                      </button>
                    </Flex>

                    <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.5, display: 'block', marginBottom: '1.75rem' }}>
                      Realtime sync ensures local room locks and reservations remain instantly available offline and online.
                    </Text>
                  </div>

                  <Flex direction="column" gap="2">
                    <div
                      className="floating-sub-card"
                      onClick={() => {
                        const avail = rooms.find(r => r.status === 'available');
                        if (avail) handleRoomClick(avail);
                      }}
                    >
                      <span>Instant Check-In</span>
                      <span className="floating-badge-black">Room 101</span>
                    </div>

                    <div
                      className="floating-sub-card"
                      onClick={() => setActiveNav('reservations')}
                    >
                      <span>Today&apos;s Arrivals</span>
                      <span className="floating-badge-black">{arrivingTodayCount} Reserved</span>
                    </div>

                    <div
                      className="floating-sub-card"
                      onClick={() => setActiveNav('pos')}
                    >
                      <span>Bar & Dining POS</span>
                      <span className="floating-badge-black">Online</span>
                    </div>
                  </Flex>
                </Box>
              </div>

              {/* ROW 2: INCIDENT & ACTIVITY GRAPH + SUMMARY + STATISTICS */}
              <div className="dashboard-grid-secondary">

                {/* Activity & Rhythm Graph */}
                <Box className="hw-box-container">
                  <Flex justify="between" align="center" mb="3" wrap="wrap" gap="3">
                    <div>
                      <Heading size="3" style={{ color: 'var(--hw-text-primary)', fontWeight: 700 }}>
                        Incident & Room Activity
                      </Heading>
                      <Text size="1" style={{ color: 'var(--hw-text-secondary)' }}>
                        Guest volume and reservation rhythm
                      </Text>
                    </div>

                    <div className="filter-pills-bar">
                      <button
                        className={`filter-pill-btn ${chartRange === '12m' ? 'active' : ''}`}
                        onClick={() => setChartRange('12m')}
                      >
                        12 months
                      </button>
                      <button
                        className={`filter-pill-btn ${chartRange === '30d' ? 'active' : ''}`}
                        onClick={() => setChartRange('30d')}
                      >
                        30 days
                      </button>
                      <button
                        className={`filter-pill-btn ${chartRange === '1w' ? 'active' : ''}`}
                        onClick={() => setChartRange('1w')}
                      >
                        1 week
                      </button>
                    </div>
                  </Flex>

                  <div className="chart-container-card">
                    <svg viewBox="0 0 700 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1d68ff" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#1d68ff" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="pinkGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff2e7e" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#ff2e7e" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      <line x1="40" y1="30" x2="680" y2="30" stroke="var(--hw-chart-grid)" strokeDasharray="4 4" />
                      <line x1="40" y1="75" x2="680" y2="75" stroke="var(--hw-chart-grid)" strokeDasharray="4 4" />
                      <line x1="40" y1="120" x2="680" y2="120" stroke="var(--hw-chart-grid)" strokeDasharray="4 4" />

                      <text x="15" y="34" fill="var(--hw-chart-label)" fontSize="10">400</text>
                      <text x="15" y="79" fill="var(--hw-chart-label)" fontSize="10">300</text>
                      <text x="15" y="124" fill="var(--hw-chart-label)" fontSize="10">200</text>

                      <path
                        d="M 60,115 C 120,125 160,85 220,115 C 280,140 310,95 360,95 C 410,95 440,125 490,110 C 540,95 590,115 650,125"
                        fill="none"
                        stroke="#ff2e7e"
                        strokeWidth="2.5"
                      />

                      <path
                        d="M 60,65 C 130,60 170,95 240,95 C 290,95 320,50 355,42 C 390,35 430,95 480,75 C 530,55 580,70 650,65"
                        fill="none"
                        stroke="#1d68ff"
                        strokeWidth="2.5"
                      />

                      <circle cx="355" cy="42" r="5" fill="#1d68ff" stroke="#ffffff" strokeWidth="2" filter="drop-shadow(0 0 8px #1d68ff)" />

                      <g transform="translate(315, 0)">
                        <rect x="0" y="0" width="85" height="32" rx="6" fill="var(--hw-chart-tooltip-bg)" stroke="var(--hw-border)" />
                        <text x="42" y="13" textAnchor="middle" fill="var(--hw-text-secondary)" fontSize="9">7 September</text>
                        <text x="42" y="26" textAnchor="middle" fill="var(--hw-chart-tooltip-text)" fontSize="10" fontWeight="700">318 Check-ins</text>
                      </g>

                      <text x="60" y="150" fill="var(--hw-chart-label)" fontSize="10">24 Aug</text>
                      <text x="180" y="150" fill="var(--hw-chart-label)" fontSize="10">31 Aug</text>
                      <text x="330" y="150" fill="var(--hw-chart-label)" fontSize="10">7 Sept</text>
                      <text x="470" y="150" fill="var(--hw-chart-label)" fontSize="10">14 Sept</text>
                      <text x="580" y="150" fill="var(--hw-chart-label)" fontSize="10">21 Sept</text>
                    </svg>
                  </div>
                </Box>

                {/* Summary Box */}
                <Box className="hw-box-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <Heading size="3" style={{ color: 'var(--hw-text-primary)', marginBottom: '1.1rem', fontWeight: 700 }}>
                      Summary
                    </Heading>

                    <div className="summary-item-row">
                      <div className="summary-label-group">
                        <span className="dot-indicator" style={{ backgroundColor: '#1d68ff' }}></span>
                        <span>Available</span>
                      </div>
                      <span className="summary-pill-count">{availableCount}</span>
                    </div>

                    <div className="summary-item-row" style={{ cursor: 'pointer' }} onClick={() => setActiveNav('reservations')}>
                      <div className="summary-label-group">
                        <span className="dot-indicator" style={{ backgroundColor: '#8b5cf6' }}></span>
                        <span>Reserved / Arrivals</span>
                      </div>
                      <span className="summary-pill-count">{reservedCount}</span>
                    </div>

                    <div className="summary-item-row">
                      <div className="summary-label-group">
                        <span className="dot-indicator" style={{ backgroundColor: '#10b981' }}></span>
                        <span>Occupied</span>
                      </div>
                      <span className="summary-pill-count">{occupiedCount}</span>
                    </div>

                    <div className="summary-item-row">
                      <div className="summary-label-group">
                        <span className="dot-indicator" style={{ backgroundColor: '#ff2e7e' }}></span>
                        <span>Housekeeping</span>
                      </div>
                      <span className="summary-pill-count">{dirtyCount}</span>
                    </div>

                    <div className="summary-item-row">
                      <div className="summary-label-group">
                        <span className="dot-indicator" style={{ backgroundColor: '#f59e0b' }}></span>
                        <span>Maintenance</span>
                      </div>
                      <span className="summary-pill-count">{maintenanceCount}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--hw-text-muted)', lineHeight: 1.4, marginTop: '1rem' }}>
                    {arrivingTodayCount} confirmed {arrivingTodayCount === 1 ? 'arrival' : 'arrivals'} expected today ({upcomingCount} upcoming).
                  </div>
                </Box>

                {/* Statistics & Occupancy Distribution Box */}
                <Box className="hw-box-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Flex justify="between" align="center">
                    <Heading size="3" style={{ color: 'var(--hw-text-primary)', fontWeight: 700 }}>
                      Statistics
                    </Heading>
                    <button className="arrow-circle-btn dark" title="View Detailed Breakdown">
                      <ArrowUpRight size={16} />
                    </button>
                  </Flex>

                  <div className="donut-circle-container">
                    <div className="donut-outer-pink">
                      <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{occupancyPercentage}%</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>Occupied</span>
                    </div>

                    <div className="donut-bubble-blue">
                      <span style={{ fontSize: '1rem', fontWeight: 800 }}>{Math.round((availableCount / rooms.length) * 100)}%</span>
                      <span style={{ fontSize: '0.62rem' }}>Available</span>
                    </div>

                    <div className="donut-bubble-slate">
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{Math.round((dirtyCount / rooms.length) * 100)}%</span>
                      <span style={{ fontSize: '0.55rem' }}>Turnover</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--hw-border)', paddingTop: '0.75rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--hw-text-primary)' }}>{rooms.length}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--hw-text-muted)' }}>Keys</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>{availableCount}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--hw-text-muted)' }}>Ready</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#a78bfa' }}>{reservedCount}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--hw-text-muted)' }}>Reserved</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ff2e7e' }}>GH₵ 520</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--hw-text-muted)' }}>ADR</div>
                    </div>
                  </div>
                </Box>
              </div>

              {/* ROW 3: ACTIVE FOLIOS & DESK ASSISTANT */}
              <div className="dashboard-grid-bottom">

                {/* Active Folios Box */}
                <Box className="hw-box-container">
                  <Flex justify="between" align="center" mb="3">
                    <div>
                      <Heading size="3" style={{ color: 'var(--hw-text-primary)', fontWeight: 700 }}>
                        Active Folios & Arrivals
                      </Heading>
                      <Text size="1" style={{ color: 'var(--hw-text-secondary)' }}>
                        Today&apos;s reserved arrivals, in-house guests, and pending turnover
                      </Text>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => setActiveNav('reservations')}
                        style={{ fontSize: '0.75rem', color: '#c4b5fd', background: 'rgba(139, 92, 246, 0.14)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(139, 92, 246, 0.35)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        View All Reservations →
                      </button>
                    </div>
                  </Flex>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.85rem' }}>
                    {rooms.filter(r => r.status === 'reserved').map(room => {
                      const matchingRes = reservations.find(res => res.roomNumber === room.roomNumber && res.status === 'confirmed');
                      return (
                        <div
                          key={room.id}
                          className="folio-card-item"
                          onClick={() => handleRoomClick(room)}
                        >
                          <Flex justify="between" align="center">
                            <span className="folio-status-badge purple">
                              Arriving Today
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--hw-text-muted)' }}>
                              Rm {room.roomNumber}
                            </span>
                          </Flex>

                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--hw-text-primary)' }}>
                              {room.currentGuest || matchingRes?.guestName || 'Reserved Guest'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--hw-text-secondary)', marginTop: '2px' }}>
                              {room.typeName} • GH₵ {room.rate}/nt
                            </div>
                          </div>

                          <Flex justify="between" align="center" pt="2" style={{ borderTop: '1px solid var(--hw-border)' }}>
                            <span style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 600 }}>
                              {matchingRes && matchingRes.depositPaid > 0 ? `Dep: GH₵ ${matchingRes.depositPaid}` : 'Unpaid Hold'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>Tap to Check-In</span>
                          </Flex>
                        </div>
                      );
                    })}

                    {rooms.filter(r => r.status === 'occupied').map(room => (
                      <div
                        key={room.id}
                        className="folio-card-item"
                        onClick={() => handleRoomClick(room)}
                      >
                        <Flex justify="between" align="center">
                          <span className="folio-status-badge white">
                            Occupied
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--hw-text-muted)' }}>
                            Rm {room.roomNumber}
                          </span>
                        </Flex>

                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--hw-text-primary)' }}>
                            {room.currentGuest || 'Registered Guest'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--hw-text-secondary)', marginTop: '2px' }}>
                            {room.typeName} • GH₵ {room.rate}/nt
                          </div>
                        </div>

                        <Flex justify="between" align="center" pt="2" style={{ borderTop: '1px solid var(--hw-border)' }}>
                          <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Paid In Full</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--hw-text-muted)' }}>Tap for folio</span>
                        </Flex>
                      </div>
                    ))}

                    {rooms.filter(r => r.status === 'dirty').slice(0, 1).map(room => (
                      <div
                        key={room.id}
                        className="folio-card-item"
                        onClick={(e) => handleMarkRoomClean(room.id!, e)}
                      >
                        <Flex justify="between" align="center">
                          <span className="folio-status-badge pink">
                            Turnover
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--hw-text-muted)' }}>
                            Rm {room.roomNumber}
                          </span>
                        </Flex>

                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--hw-text-primary)' }}>
                            Housekeeping Needed
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--hw-text-secondary)', marginTop: '2px' }}>
                            Floor {room.floor} • Ready for inspection
                          </div>
                        </div>

                        <Flex justify="between" align="center" pt="2" style={{ borderTop: '1px solid var(--hw-border)' }}>
                          <span style={{ fontSize: '0.72rem', color: '#fb7185', fontWeight: 600 }}>Needs Service</span>
                          <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Tap to mark clean</span>
                        </Flex>
                      </div>
                    ))}
                  </div>
                </Box>

                {/* Desk Assistant Box */}
                <Box className="hw-box-container desk-assistant-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <Heading size="3" style={{ color: 'var(--hw-text-primary)', fontWeight: 700 }}>
                      Hi, Caroline 👋
                    </Heading>
                    <Text size="1" style={{ color: 'var(--hw-text-secondary)', marginTop: '2px', display: 'block' }}>
                      How can I help you today?
                    </Text>

                    <div className="action-grid-2x2">
                      <button
                        className="quick-action-pill-btn"
                        onClick={() => {
                          const avail = rooms.find(r => r.status === 'available');
                          if (avail) handleRoomClick(avail);
                        }}
                      >
                        <UserCheck size={16} color="#38bdf8" />
                        <span>Walk-In Check-In</span>
                      </button>

                      <button
                        className="quick-action-pill-btn"
                        onClick={() => openNewReservationForRoom()}
                      >
                        <CalendarPlus size={16} color="#a855f7" />
                        <span>Reserve Room</span>
                      </button>

                      <button
                        className="quick-action-pill-btn"
                        onClick={() => setActiveNav('pos')}
                      >
                        <UtensilsCrossed size={16} color="#ff2e7e" />
                        <span>Order Food/POS</span>
                      </button>

                      <button
                        className="quick-action-pill-btn"
                        onClick={() => setActiveNav('billing')}
                      >
                        <ReceiptIcon size={16} color="#34d399" />
                        <span>Print Folios</span>
                      </button>
                    </div>
                  </div>

                  <div className="prompt-bar-container" onClick={() => setActiveNav('reservations')} style={{ cursor: 'pointer' }}>
                    <span>View {arrivingTodayCount} arriving reservations today...</span>
                    <Sparkles size={15} color="#818cf8" />
                  </div>
                </Box>
              </div>
            </Flex>
          )}

          {/* =================================================================== */}
          {/* VIEW: RESERVATIONS & ARRIVALS DESK                                  */}
          {/* =================================================================== */}
          {activeNav === 'reservations' && (
            <Box className="hw-box-container">
              <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
                <div>
                  <Heading size="4" style={{ color: 'var(--hw-text-primary)', fontWeight: 800 }}>
                    Reservations & Arrivals Desk
                  </Heading>
                  <Text size="2" style={{ color: 'var(--hw-text-secondary)' }}>
                    Manage advance bookings, OTA/corporate holds, MoMo deposits, and 1-click guest arrival check-in
                  </Text>
                </div>

                <Flex align="center" gap="2" wrap="wrap">
                  <button
                    type="button"
                    className="btn-hw-primary"
                    onClick={() => openNewReservationForRoom()}
                  >
                    <CalendarPlus size={16} /> New Reservation
                  </button>
                </Flex>
              </Flex>

              {/* Reservations KPI Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="hw-box-subtle" style={{ padding: '1rem 1.2rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hw-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Arriving Today ({todayIso})
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#c4b5fd', marginTop: '0.25rem' }}>
                    {arrivingTodayCount} {arrivingTodayCount === 1 ? 'Booking' : 'Bookings'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hw-text-muted)', marginTop: '0.15rem' }}>
                    Rooms locked as Reserved on matrix
                  </div>
                </div>

                <div className="hw-box-subtle" style={{ padding: '1rem 1.2rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hw-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Confirmed Upcoming
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
                    {upcomingCount} {upcomingCount === 1 ? 'Booking' : 'Bookings'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hw-text-muted)', marginTop: '0.15rem' }}>
                    Future check-in dates scheduled
                  </div>
                </div>

                <div className="hw-box-subtle" style={{ padding: '1rem 1.2rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hw-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Advance Deposits Held
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                    GH₵ {depositsHeldTotal}.00
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hw-text-muted)', marginTop: '0.15rem' }}>
                    Credited automatically at check-in
                  </div>
                </div>

                <div className="hw-box-subtle" style={{ padding: '1rem 1.2rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hw-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Converted to Checked-In
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--hw-text-primary)', marginTop: '0.25rem' }}>
                    {checkedInResCount} {checkedInResCount === 1 ? 'Stay' : 'Stays'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hw-text-muted)', marginTop: '0.15rem' }}>
                    Active in-house guest folios
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
                <div className="filter-pills-bar">
                  {[
                    { id: 'all', label: 'All Bookings' },
                    { id: 'arriving_today', label: `Arriving Today (${arrivingTodayCount})` },
                    { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
                    { id: 'checked_in', label: 'Checked-In' },
                    { id: 'cancelled', label: 'Cancelled' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      className={`filter-pill-btn ${reservationFilter === tab.id ? 'active' : ''}`}
                      onClick={() => setReservationFilter(tab.id as any)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--hw-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search guest, RES-#, phone, or room..."
                    value={reservationSearch}
                    onChange={(e) => setReservationSearch(e.target.value)}
                    style={{
                      padding: '0.45rem 0.85rem 0.45rem 2.1rem',
                      background: 'var(--hw-input-bg)',
                      border: '1px solid var(--hw-border)',
                      borderRadius: '9999px',
                      color: 'var(--hw-input-color)',
                      fontSize: '0.8rem',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>
              </Flex>

              {/* Reservations Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1rem' }}>
                {filteredReservations.map(res => {
                  const subtotal = res.rate * res.nights;
                  const tax = Math.round(subtotal * 0.1);
                  const total = subtotal + tax;
                  const balanceDue = Math.max(0, total - res.depositPaid);
                  const isToday = res.checkInDate <= todayIso && res.status === 'confirmed';

                  return (
                    <div
                      key={res.id}
                      className="hw-box-subtle"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderColor: isToday ? 'rgba(139, 92, 246, 0.45)' : undefined
                      }}
                    >
                      <div>
                        <Flex justify="between" align="center" mb="2">
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.03em' }}>
                            {res.bookingRef} • {res.source}
                          </span>
                          <span
                            className={`room-status-badge ${res.status === 'confirmed'
                                ? 'reserved'
                                : res.status === 'checked_in'
                                  ? 'occupied'
                                  : 'dirty'
                              }`}
                          >
                            {res.status === 'confirmed'
                              ? isToday
                                ? 'Arriving Today'
                                : 'Confirmed'
                              : res.status === 'checked_in'
                                ? 'Checked In'
                                : 'Cancelled'}
                          </span>
                        </Flex>

                        <Flex justify="between" align="start" mb="2">
                          <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--hw-text-primary)' }}>
                              {res.guestName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--hw-text-secondary)' }}>
                              Tel: {res.phone}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--hw-text-primary)' }}>
                              Room {res.roomNumber}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--hw-text-secondary)' }}>
                              {res.roomType}
                            </div>
                          </div>
                        </Flex>

                        <div style={{
                          background: 'var(--hw-bg-surface)',
                          border: '1px solid var(--hw-border)',
                          borderRadius: '10px',
                          padding: '0.65rem 0.8rem',
                          marginTop: '0.5rem',
                          fontSize: '0.78rem'
                        }}>
                          <Flex justify="between" mb="1">
                            <span style={{ color: 'var(--hw-text-secondary)' }}>Check-In → Check-Out:</span>
                            <span style={{ fontWeight: 700, color: 'var(--hw-text-primary)' }}>
                              {res.checkInDate} → {res.checkOutDate} ({res.nights} {res.nights === 1 ? 'nt' : 'nts'})
                            </span>
                          </Flex>
                          <Flex justify="between" mb="1">
                            <span style={{ color: 'var(--hw-text-secondary)' }}>Total Stay (incl. 10% Tax):</span>
                            <span style={{ fontWeight: 700, color: 'var(--hw-text-primary)' }}>GH₵ {total}.00</span>
                          </Flex>
                          <Flex justify="between">
                            <span style={{ color: 'var(--hw-text-secondary)' }}>Deposit Paid / Balance Due:</span>
                            <span>
                              <strong style={{ color: '#34d399' }}>GH₵ {res.depositPaid}.00</strong>
                              {' / '}
                              <strong style={{ color: balanceDue > 0 ? '#fbbf24' : '#34d399' }}>GH₵ {balanceDue}.00</strong>
                            </span>
                          </Flex>
                        </div>

                        {res.notes && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--hw-text-muted)', marginTop: '0.55rem', fontStyle: 'italic' }}>
                            Note: &ldquo;{res.notes}&rdquo;
                          </div>
                        )}
                      </div>

                      <Flex gap="2" mt="3" pt="3" wrap="wrap" style={{ borderTop: '1px solid var(--hw-border)' }}>
                        {res.status === 'confirmed' && (
                          <>
                            <button
                              type="button"
                              className="btn-hw-primary"
                              style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                              onClick={() => {
                                setSelectedReservation(res);
                                setArrivalPaymentMethod('mobile_money');
                                setShowArrivalModal(true);
                              }}
                            >
                              <UserCheck size={14} /> Check-In Guest
                            </button>

                            {res.depositPaid > 0 && (
                              <button
                                type="button"
                                className="btn-hw-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.45rem 0.7rem' }}
                                onClick={() => {
                                  setReceiptData({
                                    receiptNumber: `DEP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                                    hotelName: 'The Grand Azure Resort',
                                    address: 'Ocean Drive 402, Miami Beach, FL',
                                    guestName: res.guestName,
                                    roomNumber: res.roomNumber,
                                    description: `Reservation Deposit (${res.bookingRef} • ${res.nights} Nights)`,
                                    subtotal,
                                    tax,
                                    total,
                                    paid: res.depositPaid,
                                    paymentMethod: 'MOMO / ADVANCE',
                                    issuedAt: new Date().toLocaleString(),
                                    cashier: 'Caroline A. (Desk 01)',
                                    balanceRemaining: balanceDue,
                                  });
                                  setShowReceiptModal(true);
                                }}
                                title="Print 80mm Advance Deposit Slip"
                              >
                                <Printer size={14} /> Deposit Slip
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn-hw-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.45rem 0.7rem', color: '#ff669d', borderColor: 'rgba(255,46,126,0.3)' }}
                              onClick={() => handleCancelReservation(res)}
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {res.status === 'checked_in' && (
                          <span style={{ fontSize: '0.76rem', color: '#34d399', fontWeight: 600 }}>
                            ✓ Checked into Room {res.roomNumber} — Active Folio
                          </span>
                        )}

                        {res.status === 'cancelled' && (
                          <span style={{ fontSize: '0.76rem', color: 'var(--hw-text-muted)' }}>
                            Booking cancelled — Room hold released
                          </span>
                        )}
                      </Flex>
                    </div>
                  );
                })}
              </div>
            </Box>
          )}

          {/* =================================================================== */}
          {/* VIEW: RESTAURANT & BAR POS                                          */}
          {/* =================================================================== */}
          {activeNav === 'pos' && (
            <Box className="hw-box-container">
              <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
                <div>
                  <Heading size="4" style={{ color: 'var(--hw-text-primary)', fontWeight: 800 }}>
                    Restaurant & Bar POS Workstation
                  </Heading>
                  <Text size="2" style={{ color: 'var(--hw-text-secondary)' }}>
                    Take food & beverage orders, print thermal kitchen tickets, and post directly to room folios
                  </Text>
                </div>

                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span> Module Active
                </span>
              </Flex>

              {posSuccessToast && (
                <Box mb="4" p="3" style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', borderRadius: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle2 size={18} color="#34d399" />
                  <span>{posSuccessToast}</span>
                </Box>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '1.5rem' }}>
                {/* Menu Items Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  {GHANA_MENU_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCartItems(prev => {
                          const existing = prev.find(i => i.id === item.id);
                          if (existing) {
                            return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
                          }
                          return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
                        });
                      }}
                      style={{
                        background: 'var(--hw-card-subtle-bg)',
                        border: '1px solid var(--hw-border)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                          {item.category}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--hw-text-primary)', marginBottom: '0.75rem' }}>
                          {item.name}
                        </div>
                      </div>

                      <Flex justify="between" align="center" pt="2" style={{ borderTop: '1px solid var(--hw-border)' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                          GH₵ {item.price}.00
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--hw-text-secondary)', background: 'var(--hw-bg-subtle-hover)', padding: '3px 8px', borderRadius: '9999px' }}>
                          + Add
                        </span>
                      </Flex>
                    </div>
                  ))}
                </div>

                {/* Active Order Ticket Pad */}
                <Box className="hw-box-subtle" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                  <Heading size="3" style={{ color: 'var(--hw-text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--hw-border)', paddingBottom: '0.75rem' }}>
                    Active Order Pad
                  </Heading>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Charge to Room Folio</label>
                    <select
                      className="hw-select"
                      value={posRoomTarget}
                      onChange={(e) => setPosRoomTarget(e.target.value)}
                    >
                      <option value="102">Room 102 - Kwesi Appiah (Occupied)</option>
                      <option value="201">Room 201 - Akosua Mensah (Occupied)</option>
                      <option value="302">Room 302 - Yaw Boateng (Occupied)</option>
                      <option value="cash">Walk-in Guest (Direct Cash/MoMo)</option>
                    </select>
                  </div>

                  {cartItems.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--hw-text-muted)', fontSize: '0.88rem' }}>
                      No items in ticket yet. Tap any Ghanaian specialty on the left to add.
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1.5rem' }}>
                      {cartItems.map((c) => (
                        <Flex key={c.id} justify="between" align="center" py="2" style={{ borderBottom: '1px dashed var(--hw-border)' }}>
                          <div>
                            <span style={{ color: 'var(--hw-text-primary)', fontWeight: 500 }}>{c.name}</span> <span style={{ color: 'var(--hw-text-muted)' }}>×{c.qty}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--hw-text-primary)' }}>GH₵ {c.price * c.qty}.00</span>
                        </Flex>
                      ))}

                      <Flex justify="between" align="center" pt="3" mt="3" style={{ borderTop: '2px solid var(--hw-border)', fontWeight: 800 }}>
                        <span style={{ fontSize: '1.1rem', color: 'var(--hw-text-primary)' }}>Ticket Total:</span>
                        <span style={{ fontSize: '1.25rem', color: '#34d399' }}>
                          GH₵ {cartItems.reduce((sum, i) => sum + i.price * i.qty, 0)}.00
                        </span>
                      </Flex>
                    </div>
                  )}

                  <Flex direction="column" gap="2" mt="auto">
                    <button
                      className="btn-hw-primary"
                      disabled={cartItems.length === 0}
                      style={{ justifyContent: 'center' }}
                      onClick={() => {
                        const orderTotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
                        if (posRoomTarget !== 'cash') {
                          setRooms(prev =>
                            prev.map(r =>
                              r.roomNumber === posRoomTarget
                                ? { ...r, posCharges: (r.posCharges || 0) + orderTotal }
                                : r
                            )
                          );
                        }
                        setPosSuccessToast(
                          posRoomTarget === 'cash'
                            ? `Walk-in order (GH₵ ${orderTotal}.00) paid and transmitted to kitchen printer!`
                            : `Order (GH₵ ${orderTotal}.00) charged to Room ${posRoomTarget} folio and transmitted to kitchen printer!`
                        );
                        setCartItems([]);
                        setTimeout(() => setPosSuccessToast(null), 4000);
                      }}
                    >
                      <Printer size={16} /> Print Kitchen Ticket & Charge Room
                    </button>
                    {cartItems.length > 0 && (
                      <button
                        className="btn-hw-secondary"
                        style={{ justifyContent: 'center', fontSize: '0.8rem' }}
                        onClick={() => setCartItems([])}
                      >
                        Clear Ticket
                      </button>
                    )}
                  </Flex>
                </Box>
              </div>
            </Box>
          )}

          {/* =================================================================== */}
          {/* VIEW: HOUSEKEEPING MODULE                                           */}
          {/* =================================================================== */}
          {activeNav === 'housekeeping' && (
            <Box className="hw-box-container">
              <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
                <div>
                  <Heading size="4" style={{ color: 'var(--hw-text-primary)', fontWeight: 800 }}>
                    Housekeeping & Inspection Task Board
                  </Heading>
                  <Text size="2" style={{ color: 'var(--hw-text-secondary)' }}>
                    Real-time room turnover status, housekeeper assignments, and cleanliness audits
                  </Text>
                </div>

                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span> Live Sync
                </span>
              </Flex>

              <div className="rooms-grid">
                {rooms.map(room => (
                  <div key={room.id} className="hw-room-card">
                    <div>
                      <Flex justify="between" align="start" mb="2">
                        <span className="hw-room-number">Room {room.roomNumber}</span>
                        <span className={`room-status-badge ${getStatusClass(room.status as RoomStatus)}`}>
                          {room.status}
                        </span>
                      </Flex>
                      <div className="hw-room-type">Floor {room.floor} • {room.typeName}</div>
                    </div>

                    <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button
                        onClick={(e) => handleMarkRoomClean(room.id!, e)}
                        className="btn-hw-secondary"
                        style={{ width: '100%', fontSize: '0.78rem', justifyContent: 'center' }}
                      >
                        <CheckCircle2 size={14} color="#34d399" /> Update Status to Clean
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Box>
          )}

          {/* =================================================================== */}
          {/* VIEW: FOLIOS & BILLING                                              */}
          {/* =================================================================== */}
          {activeNav === 'billing' && (
            <Box className="hw-box-container">
              <Flex justify="between" align="center" mb="4">
                <div>
                  <Heading size="4" style={{ color: 'var(--hw-text-primary)', fontWeight: 800 }}>
                    Guest Folios & Thermal Receipts
                  </Heading>
                  <Text size="2" style={{ color: 'var(--hw-text-secondary)' }}>
                    Audit past check-in payments, reprint guest slips, and balance cashier register
                  </Text>
                </div>

                <button
                  className="btn-hw-primary"
                  onClick={() => {
                    setReceiptData({
                      receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                      hotelName: 'The Grand Azure Resort',
                      address: 'Ocean Drive 402, Miami Beach, FL',
                      guestName: 'Kwesi Appiah',
                      roomNumber: '102',
                      description: 'Standard King (2 Nights) + Mini Bar',
                      subtotal: 700,
                      tax: 70,
                      total: 770,
                      paid: 770,
                      paymentMethod: 'CARD / VISA',
                      issuedAt: new Date().toLocaleString(),
                      cashier: 'Caroline A. (Desk 01)',
                    });
                    setShowReceiptModal(true);
                  }}
                >
                  <Printer size={16} /> Sample 80mm Print Receipt
                </button>
              </Flex>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {rooms.filter(r => r.status === 'occupied').map(room => (
                  <div key={room.id} className="hw-box-subtle">
                    <Flex justify="between" align="start" mb="2">
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--hw-text-primary)' }}>Room {room.roomNumber}</span>
                      <span className="room-status-badge occupied">Paid In Full</span>
                    </Flex>
                    <div style={{ fontSize: '0.85rem', color: 'var(--hw-text-secondary)', fontWeight: 600 }}>Guest: {room.currentGuest}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--hw-text-secondary)', marginTop: '4px' }}>
                      {room.typeName} • GH₵ {room.rate * 2 + (room.posCharges || 0)}.00 total folio
                      {room.posCharges ? ` (incl. GH₵ ${room.posCharges} POS)` : ''}
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button
                        className="btn-hw-secondary"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
                        onClick={() => {
                          const sub = (room.rate || 350) * 2 + (room.posCharges || 0);
                          setReceiptData({
                            receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                            hotelName: 'The Grand Azure Resort',
                            address: 'Ocean Drive 402, Miami Beach, FL',
                            guestName: room.currentGuest || 'Guest',
                            roomNumber: room.roomNumber || '',
                            description: `${room.typeName} Stay${room.posCharges ? ' + Bar/Dining POS' : ''}`,
                            subtotal: sub,
                            tax: Math.round(sub * 0.1),
                            total: Math.round(sub * 1.1),
                            paid: Math.round(sub * 1.1),
                            paymentMethod: 'MOBILE MONEY',
                            issuedAt: new Date().toLocaleString(),
                            cashier: 'Caroline A. (Desk 01)',
                          });
                          setShowReceiptModal(true);
                        }}
                      >
                        <Printer size={14} /> Reprint Thermal Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Box>
          )}
        </main>

        {/* ===================================================================== */}
        {/* MODAL 1: CHECK-IN GUEST & COLLECT PAYMENT                             */}
        {/* ===================================================================== */}
        {showCheckInModal && selectedRoom && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <div>
                  <Heading size="3" style={{ color: 'var(--hw-text-primary)', fontWeight: 800 }}>
                    Check-In Guest • Room {selectedRoom.roomNumber}
                  </Heading>
                  <Text size="2" style={{ color: 'var(--hw-text-secondary)', marginTop: '2px', display: 'block' }}>
                    {selectedRoom.typeName} — GH₵ {selectedRoom.rate}/night
                  </Text>
                </div>
                <button className="circle-btn" onClick={() => setShowCheckInModal(false)}>
                  <X size={18} />
                </button>
              </div>

              {/* Upcoming reservation conflict warning */}
              {(() => {
                const upcomingConflict = reservations.find(
                  r => r.roomNumber === selectedRoom.roomNumber && r.status === 'confirmed'
                );
                if (!upcomingConflict) return null;
                return (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.14)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '12px',
                    padding: '0.75rem 0.9rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    fontSize: '0.78rem',
                    color: '#fcd34d'
                  }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Upcoming Reservation Notice:</strong> Room {selectedRoom.roomNumber} is reserved for{' '}
                      <strong>{upcomingConflict.guestName}</strong> arriving on <strong>{upcomingConflict.checkInDate}</strong> ({upcomingConflict.nights} nights). Ensure walk-in stay does not overlap.
                    </div>
                  </div>
                );
              })()}

              <form onSubmit={handlePerformCheckIn}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Guest Full Name</label>
                  <input
                    type="text"
                    required
                    className="hw-input"
                    placeholder="e.g. Kwame Antwi"
                    value={checkInForm.guestName}
                    onChange={(e) => setCheckInForm(prev => ({ ...prev, guestName: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Phone / WhatsApp Contact</label>
                  <input
                    type="tel"
                    className="hw-input"
                    placeholder="024 123 4567"
                    value={checkInForm.phone}
                    onChange={(e) => setCheckInForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Length of Stay (Nights)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="hw-input"
                    value={checkInForm.nights}
                    onChange={(e) => setCheckInForm(prev => ({ ...prev, nights: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Payment Method</label>
                  <select
                    className="hw-select"
                    value={checkInForm.paymentMethod}
                    onChange={(e) => setCheckInForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  >
                    <option value="card">Credit / Debit Card</option>
                    <option value="mobile_money">MTN Mobile Money / Telecel Cash</option>
                    <option value="cash">Cash Payment (GH₵)</option>
                  </select>
                </div>

                {/* Total Calculation Box */}
                <Box className="hw-box-subtle" mb="4">
                  <Flex justify="between" mb="1" style={{ fontSize: '0.88rem', color: 'var(--hw-text-secondary)' }}>
                    <span>Room Charge ({checkInForm.nights} nights):</span>
                    <span>GH₵ {selectedRoom.rate * checkInForm.nights}.00</span>
                  </Flex>
                  <Flex justify="between" mb="2" style={{ fontSize: '0.88rem', color: 'var(--hw-text-muted)' }}>
                    <span>Tourism Levy / Tax (10%):</span>
                    <span>GH₵ {Math.round(selectedRoom.rate * checkInForm.nights * 0.1)}.00</span>
                  </Flex>
                  <Flex justify="between" pt="2" style={{ borderTop: '1px solid var(--hw-border)', fontWeight: 800, fontSize: '1.1rem' }}>
                    <span style={{ color: 'var(--hw-text-primary)' }}>Total Amount:</span>
                    <span style={{ color: '#34d399' }}>
                      GH₵ {Math.round(selectedRoom.rate * checkInForm.nights * 1.1)}.00
                    </span>
                  </Flex>
                </Box>

                <Flex justify="between" align="center" gap="2" wrap="wrap">
                  <button
                    type="button"
                    className="btn-hw-secondary"
                    style={{ fontSize: '0.78rem', borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c4b5fd' }}
                    onClick={() => openNewReservationForRoom(selectedRoom.roomNumber)}
                  >
                    <CalendarPlus size={14} /> Reserve for Future Date
                  </button>
                  <Flex gap="2">
                    <button type="button" className="btn-hw-secondary" onClick={() => setShowCheckInModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-hw-primary">
                      <UserCheck size={16} /> Complete Check-In & Print Receipt
                    </button>
                  </Flex>
                </Flex>
              </form>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL 2: OCCUPIED ROOM FOLIO & CHECK-OUT                              */}
        {/* ===================================================================== */}
        {showPaymentModal && selectedRoom && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <div>
                  <Heading size="3" style={{ color: 'var(--hw-text-primary)', fontWeight: 800 }}>
                    Room {selectedRoom.roomNumber} • Folio Management
                  </Heading>
                  <Text size="2" style={{ color: 'var(--hw-text-secondary)', marginTop: '2px', display: 'block' }}>
                    Guest: <strong style={{ color: 'var(--hw-text-primary)' }}>{selectedRoom.currentGuest}</strong>
                  </Text>
                </div>
                <button className="circle-btn" onClick={() => setShowPaymentModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <Box className="hw-box-subtle" mb="4">
                <Flex justify="between" mb="2" style={{ fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--hw-text-secondary)' }}>Room Category:</span>
                  <span style={{ fontWeight: 600, color: 'var(--hw-text-primary)' }}>{selectedRoom.typeName}</span>
                </Flex>
                <Flex justify="between" mb="2" style={{ fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--hw-text-secondary)' }}>Daily Rate:</span>
                  <span style={{ color: 'var(--hw-text-primary)' }}>GH₵ {selectedRoom.rate}.00 / night</span>
                </Flex>
                <Flex justify="between" mb="2" style={{ fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--hw-text-secondary)' }}>Restaurant & Bar POS Charges:</span>
                  <span style={{ color: 'var(--hw-text-primary)', fontWeight: 600 }}>GH₵ {selectedRoom.posCharges || 0}.00</span>
                </Flex>
                <Flex justify="between" style={{ fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--hw-text-secondary)' }}>Folio Status:</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>Paid In Full</span>
                </Flex>
              </Box>

              <Flex direction="column" gap="2">
                <button
                  className="btn-hw-primary"
                  style={{ justifyContent: 'center' }}
                  onClick={() => {
                    const sub = selectedRoom.rate * 2 + (selectedRoom.posCharges || 0);
                    setReceiptData({
                      receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                      hotelName: 'The Grand Azure Resort',
                      address: 'Ocean Drive 402, Miami Beach, FL',
                      guestName: selectedRoom.currentGuest || 'Guest',
                      roomNumber: selectedRoom.roomNumber || '',
                      description: `${selectedRoom.typeName} Stay${selectedRoom.posCharges ? ' + Bar/Dining POS' : ''}`,
                      subtotal: sub,
                      tax: Math.round(sub * 0.1),
                      total: Math.round(sub * 1.1),
                      paid: Math.round(sub * 1.1),
                      paymentMethod: 'CARD / VISA',
                      issuedAt: new Date().toLocaleString(),
                      cashier: 'Caroline A. (Desk 01)',
                    });
                    setShowPaymentModal(false);
                    setShowReceiptModal(true);
                  }}
                >
                  <Printer size={16} /> Re-Print Guest Receipt
                </button>

                <button
                  className="btn-hw-secondary"
                  style={{ justifyContent: 'center', borderColor: 'rgba(255, 46, 126, 0.4)', color: '#ff669d' }}
                  onClick={handlePerformCheckOut}
                >
                  <LogOut size={16} /> Complete Guest Check-Out
                </button>
              </Flex>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL 3: 80mm THERMAL RECEIPT SLIP & PRINT PREVIEW                    */}
        {/* ===================================================================== */}
        {showReceiptModal && receiptData && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: '440px' }}>
              <div className="modal-header">
                <Heading size="3" style={{ color: 'var(--hw-text-primary)', fontWeight: 700 }}>
                  Receipt Generated
                </Heading>
                <button className="circle-btn" onClick={() => setShowReceiptModal(false)}>
                  <X size={18} />
                </button>
              </div>

              {/* Printable 80mm thermal slip */}
              <div id="printable-receipt" className="receipt-paper">
                <div className="receipt-header">
                  <div className="receipt-hotel-name">{receiptData.hotelName}</div>
                  <div className="receipt-subtitle">{receiptData.address}</div>
                  <div className="receipt-subtitle">Tel: +233 24 555 0199</div>
                  <div className="receipt-divider"></div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>GUEST PAYMENT RECEIPT</div>
                  <div style={{ fontSize: '0.75rem' }}>Receipt #: {receiptData.receiptNumber}</div>
                  <div style={{ fontSize: '0.75rem' }}>Date: {receiptData.issuedAt}</div>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-row">
                  <span>Guest:</span>
                  <span>{receiptData.guestName}</span>
                </div>
                <div className="receipt-row">
                  <span>Room:</span>
                  <span>Room {receiptData.roomNumber}</span>
                </div>
                <div className="receipt-row">
                  <span>Cashier:</span>
                  <span>{receiptData.cashier}</span>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-row">
                  <span>{receiptData.description}</span>
                  <span>GH₵ {receiptData.subtotal}.00</span>
                </div>
                <div className="receipt-row">
                  <span>Tourism Levy (10%)</span>
                  <span>GH₵ {receiptData.tax}.00</span>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-row bold">
                  <span>TOTAL STAY:</span>
                  <span>GH₵ {receiptData.total}.00</span>
                </div>
                {receiptData.depositCredited !== undefined && receiptData.depositCredited > 0 && (
                  <div className="receipt-row">
                    <span>ADVANCE DEPOSIT CREDITED:</span>
                    <span>-GH₵ {receiptData.depositCredited}.00</span>
                  </div>
                )}
                <div className="receipt-row bold">
                  <span>PAID ({receiptData.paymentMethod}):</span>
                  <span>GH₵ {receiptData.paid}.00</span>
                </div>
                <div className="receipt-row">
                  <span>BALANCE DUE:</span>
                  <span>GH₵ {receiptData.balanceRemaining ?? 0}.00</span>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-footer">
                  <div>Thank you for staying with us!</div>
                  <div style={{ marginTop: '0.2rem' }}>Please retain this receipt for your records.</div>
                  <div style={{ marginTop: '0.55rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>Powered by</span>
                    <img src="/hospware-logo.png" alt="Hospware" style={{ height: '14px', width: 'auto', objectFit: 'contain' }} />
                  </div>
                  <div style={{ marginTop: '0.4rem', letterSpacing: '0.2em' }}>* * * * * * * *</div>
                </div>
              </div>

              {/* Print action buttons */}
              <Flex justify="end" gap="3" mt="4">
                <button className="btn-hw-secondary" onClick={() => setShowReceiptModal(false)}>
                  Done
                </button>
                <button className="btn-hw-primary" onClick={handlePrint}>
                  <Printer size={16} /> Print Receipt (80mm)
                </button>
              </Flex>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL 4: CREATE NEW RESERVATION & COLLECT DEPOSIT                     */}
        {/* ===================================================================== */}
        {showNewReservationModal && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: '520px' }}>
              <div className="modal-header">
                <div>
                  <Heading size="3" style={{ color: 'var(--hw-text-primary)', fontWeight: 800 }}>
                    Create Room Reservation
                  </Heading>
                  <Text size="2" style={{ color: 'var(--hw-text-secondary)', marginTop: '2px', display: 'block' }}>
                    Hold a room for today or a future check-in date and record advance deposit
                  </Text>
                </div>
                <button className="circle-btn" onClick={() => setShowNewReservationModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateReservation}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label className="form-label">Guest Full Name</label>
                    <input
                      type="text"
                      required
                      className="hw-input"
                      placeholder="e.g. Nana Ama Ofori"
                      value={newReservationForm.guestName}
                      onChange={(e) => setNewReservationForm(prev => ({ ...prev, guestName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      className="hw-input"
                      placeholder="024 812 3344"
                      value={newReservationForm.phone}
                      onChange={(e) => setNewReservationForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label className="form-label">Select Room</label>
                    <select
                      className="hw-select"
                      value={newReservationForm.roomNumber}
                      onChange={(e) => setNewReservationForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                    >
                      {rooms.map(r => (
                        <option key={r.id} value={r.roomNumber}>
                          Room {r.roomNumber} • {r.typeName} (GH₵ {r.rate}/nt) [{r.status}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Booking Source</label>
                    <select
                      className="hw-select"
                      value={newReservationForm.source}
                      onChange={(e) => setNewReservationForm(prev => ({ ...prev, source: e.target.value as ReservationEntry['source'] }))}
                    >
                      <option value="Phone">Phone</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Direct Walk-In">Direct Walk-In</option>
                      <option value="Booking.com">Booking.com</option>
                      <option value="Airbnb">Airbnb</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label className="form-label">Check-In Date</label>
                    <input
                      type="date"
                      required
                      className="hw-input"
                      value={newReservationForm.checkInDate}
                      onChange={(e) => setNewReservationForm(prev => ({ ...prev, checkInDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Length of Stay (Nights)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      className="hw-input"
                      value={newReservationForm.nights}
                      onChange={(e) => setNewReservationForm(prev => ({ ...prev, nights: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label className="form-label">Advance Deposit Paid (GH₵)</label>
                    <input
                      type="number"
                      min="0"
                      className="hw-input"
                      placeholder="0"
                      value={newReservationForm.depositPaid}
                      onChange={(e) => setNewReservationForm(prev => ({ ...prev, depositPaid: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Deposit Payment Method</label>
                    <select
                      className="hw-select"
                      value={newReservationForm.paymentMethod}
                      onChange={(e) => setNewReservationForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                    >
                      <option value="mobile_money">MTN MoMo / Telecel Cash</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="cash">Cash at Front Desk</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Special Requests / Arrival Notes</label>
                  <input
                    type="text"
                    className="hw-input"
                    placeholder="e.g. Airport pickup requested, late arrival 8 PM"
                    value={newReservationForm.notes}
                    onChange={(e) => setNewReservationForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                {(() => {
                  const chosenRoom = rooms.find(r => r.roomNumber === newReservationForm.roomNumber) || rooms[0];
                  const sub = chosenRoom.rate * newReservationForm.nights;
                  const tax = Math.round(sub * 0.1);
                  const tot = sub + tax;
                  const dep = Math.min(Math.max(0, Number(newReservationForm.depositPaid) || 0), tot);
                  const bal = Math.max(0, tot - dep);
                  return (
                    <Box className="hw-box-subtle" mb="4">
                      <Flex justify="between" mb="1" style={{ fontSize: '0.84rem', color: 'var(--hw-text-secondary)' }}>
                        <span>Estimated Stay ({newReservationForm.nights} nights + 10% Levy):</span>
                        <span style={{ fontWeight: 700, color: 'var(--hw-text-primary)' }}>GH₵ {tot}.00</span>
                      </Flex>
                      <Flex justify="between" mb="1" style={{ fontSize: '0.84rem', color: '#34d399' }}>
                        <span>Advance Deposit Collected Now:</span>
                        <span style={{ fontWeight: 700 }}>GH₵ {dep}.00</span>
                      </Flex>
                      <Flex justify="between" pt="2" style={{ borderTop: '1px solid var(--hw-border)', fontWeight: 800, fontSize: '0.98rem' }}>
                        <span style={{ color: 'var(--hw-text-primary)' }}>Balance Due at Check-In:</span>
                        <span style={{ color: '#fbbf24' }}>GH₵ {bal}.00</span>
                      </Flex>
                    </Box>
                  );
                })()}

                <Flex justify="end" gap="3">
                  <button type="button" className="btn-hw-secondary" onClick={() => setShowNewReservationModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-hw-primary">
                    <CalendarPlus size={16} /> Confirm Reservation{newReservationForm.depositPaid > 0 ? ' & Print Deposit Slip' : ''}
                  </button>
                </Flex>
              </form>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL 5: RESERVED GUEST ARRIVAL CHECK-IN                              */}
        {/* ===================================================================== */}
        {showArrivalModal && selectedReservation && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <div>
                  <Heading size="3" style={{ color: 'var(--hw-text-primary)', fontWeight: 800 }}>
                    Reserved Arrival Check-In • Rm {selectedReservation.roomNumber}
                  </Heading>
                  <Text size="2" style={{ color: '#c4b5fd', marginTop: '2px', display: 'block', fontWeight: 600 }}>
                    {selectedReservation.bookingRef} • {selectedReservation.source}
                  </Text>
                </div>
                <button className="circle-btn" onClick={() => setShowArrivalModal(false)}>
                  <X size={18} />
                </button>
              </div>

              {(() => {
                const sub = selectedReservation.rate * selectedReservation.nights;
                const tax = Math.round(sub * 0.1);
                const tot = sub + tax;
                const bal = Math.max(0, tot - selectedReservation.depositPaid);

                return (
                  <>
                    <Box className="hw-box-subtle" mb="4">
                      <Flex justify="between" mb="2" style={{ fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--hw-text-secondary)' }}>Arriving Guest:</span>
                        <span style={{ fontWeight: 800, color: 'var(--hw-text-primary)' }}>{selectedReservation.guestName}</span>
                      </Flex>
                      <Flex justify="between" mb="2" style={{ fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--hw-text-secondary)' }}>Phone Contact:</span>
                        <span style={{ color: 'var(--hw-text-primary)' }}>{selectedReservation.phone}</span>
                      </Flex>
                      <Flex justify="between" mb="2" style={{ fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--hw-text-secondary)' }}>Room & Dates:</span>
                        <span style={{ color: 'var(--hw-text-primary)', fontWeight: 600 }}>
                          {selectedReservation.roomType} ({selectedReservation.nights} nts • {selectedReservation.checkInDate} → {selectedReservation.checkOutDate})
                        </span>
                      </Flex>
                      {selectedReservation.notes && (
                        <Flex justify="between" mb="2" style={{ fontSize: '0.82rem' }}>
                          <span style={{ color: 'var(--hw-text-secondary)' }}>Reservation Notes:</span>
                          <span style={{ color: '#c4b5fd', fontStyle: 'italic' }}>{selectedReservation.notes}</span>
                        </Flex>
                      )}
                      <div style={{ borderTop: '1px solid var(--hw-border)', margin: '0.65rem 0' }} />
                      <Flex justify="between" mb="1" style={{ fontSize: '0.86rem', color: 'var(--hw-text-secondary)' }}>
                        <span>Total Stay (incl. 10% Levy):</span>
                        <span>GH₵ {tot}.00</span>
                      </Flex>
                      <Flex justify="between" mb="2" style={{ fontSize: '0.86rem', color: '#34d399' }}>
                        <span>Advance Deposit Credited:</span>
                        <span style={{ fontWeight: 700 }}>-GH₵ {selectedReservation.depositPaid}.00</span>
                      </Flex>
                      <Flex justify="between" pt="2" style={{ borderTop: '1px solid var(--hw-border)', fontWeight: 800, fontSize: '1.08rem' }}>
                        <span style={{ color: 'var(--hw-text-primary)' }}>Balance to Collect at Check-In:</span>
                        <span style={{ color: '#fbbf24' }}>GH₵ {bal}.00</span>
                      </Flex>
                    </Box>

                    {bal > 0 && (
                      <div style={{ marginBottom: '1.2rem' }}>
                        <label className="form-label">Balance Payment Method</label>
                        <select
                          className="hw-select"
                          value={arrivalPaymentMethod}
                          onChange={(e) => setArrivalPaymentMethod(e.target.value as any)}
                        >
                          <option value="mobile_money">MTN Mobile Money / Telecel Cash</option>
                          <option value="card">Credit / Debit Card</option>
                          <option value="cash">Cash Payment (GH₵)</option>
                        </select>
                      </div>
                    )}

                    <Flex justify="between" align="center" gap="2" wrap="wrap">
                      <button
                        type="button"
                        className="btn-hw-secondary"
                        style={{ color: '#ff669d', borderColor: 'rgba(255,46,126,0.35)', fontSize: '0.78rem' }}
                        onClick={() => handleCancelReservation(selectedReservation)}
                      >
                        Cancel Reservation & Release Room
                      </button>

                      <Flex gap="2">
                        <button type="button" className="btn-hw-secondary" onClick={() => setShowArrivalModal(false)}>
                          Close
                        </button>
                        <button
                          type="button"
                          className="btn-hw-primary"
                          onClick={() => handlePerformArrivalCheckIn(selectedReservation)}
                        >
                          <UserCheck size={16} /> Hand Over Keys & Print Receipt
                        </button>
                      </Flex>
                    </Flex>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </Theme>
  );
}
