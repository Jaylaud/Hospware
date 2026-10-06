import { useState, useEffect } from 'react';
import { 
  Building2, 
  CalendarDays, 
  BedDouble, 
  Users, 
  UtensilsCrossed, 
  Sparkles, 
  Receipt, 
  Wifi, 
  WifiOff, 
  Clock
} from 'lucide-react';
import type { Room, RoomStatus } from '@hospware/types';

// Mock initial data for UI preview
const INITIAL_ROOMS: Partial<Room>[] = [
  { id: '101', roomNumber: '101', status: 'available', floor: '1' },
  { id: '102', roomNumber: '102', status: 'occupied', floor: '1' },
  { id: '103', roomNumber: '103', status: 'dirty', floor: '1' },
  { id: '104', roomNumber: '104', status: 'available', floor: '1' },
  { id: '201', roomNumber: '201', status: 'occupied', floor: '2' },
  { id: '202', roomNumber: '202', status: 'cleaning', floor: '2' },
  { id: '203', roomNumber: '203', status: 'maintenance', floor: '2' },
  { id: '204', roomNumber: '204', status: 'available', floor: '2' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount] = useState(0);
  const [rooms] = useState(INITIAL_ROOMS);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusClass = (status?: RoomStatus) => {
    switch (status) {
      case 'available': return 'available';
      case 'occupied': return 'occupied';
      case 'dirty': return 'dirty';
      case 'cleaning': return 'dirty';
      case 'maintenance': return 'maintenance';
      default: return 'available';
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-icon">
            <Building2 size={22} />
          </div>
          <div>
            <div className="brand-title">Hospware</div>
            <div className="brand-subtitle">Local Hub Edition</div>
          </div>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-item ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            <BedDouble size={18} />
            <span>Front Desk & Rooms</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            <CalendarDays size={18} />
            <span>Reservations</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'guests' ? 'active' : ''}`}
            onClick={() => setActiveTab('guests')}
          >
            <Users size={18} />
            <span>Guest Directory</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'housekeeping' ? 'active' : ''}`}
            onClick={() => setActiveTab('housekeeping')}
          >
            <Sparkles size={18} />
            <span>Housekeeping</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'pos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pos')}
          >
            <UtensilsCrossed size={18} />
            <span>Restaurant / POS</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            <Receipt size={18} />
            <span>Billing & Folio</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="node-status-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Network State:</span>
              <span className={`status-badge ${isOnline ? 'online' : 'offline-mode'}`}>
                <span className="status-dot"></span>
                {isOnline ? 'LAN Hub Active' : 'Offline / Standalone'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>Cloud Sync Queue:</span>
              <span style={{ fontWeight: 600, color: pendingSyncCount > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                {pendingSyncCount} mutations
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Grand Horizon Hotel & Suites</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>| Terminal 01 (Reception)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <Clock size={16} />
              <span>{currentTime}</span>
            </div>

            <button 
              onClick={() => setIsOnline(!isOnline)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {isOnline ? <Wifi size={14} color="var(--accent-emerald)" /> : <WifiOff size={14} color="var(--accent-amber)" />}
              <span>{isOnline ? 'Simulate Offline' : 'Go Online'}</span>
            </button>
          </div>
        </header>

        <main className="content-container">
          <div className="section-header">
            <h1 className="section-title">Room Matrix & Front Desk</h1>
            <p className="section-subtitle">Real-time room occupancy and housekeeping status</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Rooms</span>
              <span className="stat-value">{rooms.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Occupied</span>
              <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>
                {rooms.filter(r => r.status === 'occupied').length}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Available</span>
              <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                {rooms.filter(r => r.status === 'available').length}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Requires Housekeeping</span>
              <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>
                {rooms.filter(r => r.status === 'dirty' || r.status === 'cleaning').length}
              </span>
            </div>
          </div>

          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className="room-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="room-number">Room {room.roomNumber}</span>
                  <span className={`room-status-tag ${getStatusClass(room.status as RoomStatus)}`}>
                    {room.status}
                  </span>
                </div>
                <div className="room-type">Floor {room.floor} • Deluxe King</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
