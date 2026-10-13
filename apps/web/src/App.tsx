import { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Key, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  Server, 
  Users, 
  Lock, 
  Smartphone, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Mail,
  UserPlus
} from 'lucide-react';

interface HotelFormData {
  hotelName: string;
  code: string;
  currency: string;
  timeZone: string;
  address: string;
  phone: string;
  ownerName: string;
  ownerEmail: string;
  ownerPin: string;
  roomsCount: number;
  plan: 'starter' | 'standard' | 'premium';
  billingInterval: 'monthly' | 'annual';
}

interface StaffFormData {
  name: string;
  role: 'receptionist' | 'housekeeper' | 'waiter' | 'kitchen' | 'manager';
  pinCode: string;
  email: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'register' | 'pricing' | 'staff' | 'architecture'>('register');
  const [step, setStep] = useState<number>(1);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  
  // Local Hub connection status
  const [hubOnline, setHubOnline] = useState<boolean | null>(null);
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'pairing' | 'success' | 'error'>('idle');
  const [pairingMessage, setPairingMessage] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<HotelFormData>({
    hotelName: 'The Grand Azure Resort & Spa',
    code: 'grand-azure',
    currency: 'USD',
    timeZone: 'UTC',
    address: 'Ocean Drive 402, Miami Beach, FL',
    phone: '+1 (305) 555-0199',
    ownerName: 'Alexander Hayes',
    ownerEmail: 'alexander@grandazure.com',
    ownerPin: '8492',
    roomsCount: 45,
    plan: 'standard',
    billingInterval: 'annual',
  });

  // Generated License Key on completion
  const [generatedLicense, setGeneratedLicense] = useState<string>('HOSP-PRO-9842-710F-4410');
  const [generatedTenantId, setGeneratedTenantId] = useState<string>('tenant_' + Math.random().toString(36).substring(2, 9));

  // Staff fast onboarding demo state
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string; role: string; pinCode: string }>>([
    { id: '1', name: 'Maria Santos', role: 'receptionist', pinCode: '2041' },
    { id: '2', name: 'David Kim', role: 'housekeeper', pinCode: '5510' },
    { id: '3', name: 'Elena Rostova', role: 'waiter', pinCode: '8832' },
  ]);
  const [staffForm, setStaffForm] = useState<StaffFormData>({
    name: '',
    role: 'receptionist',
    pinCode: '',
    email: '',
  });

  // Check Local Hub availability
  const checkHubHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setHubOnline(true);
      } else {
        setHubOnline(false);
      }
    } catch {
      setHubOnline(false);
    }
  };

  useEffect(() => {
    checkHubHealth();
    const interval = setInterval(checkHubHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update hotel code automatically from hotel name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setFormData(prev => ({ ...prev, hotelName: name, code: slug }));
  };

  // Pricing calculations
  const pricePerRoom = {
    starter: 1.20,
    standard: 1.80,
    premium: 2.50,
  }[formData.plan];

  const discountMultiplier = formData.billingInterval === 'annual' ? 0.8 : 1.0;
  const monthlyTotal = Math.round(formData.roomsCount * pricePerRoom * discountMultiplier);

  // Complete Payment and Generate License
  const handleCompleteRegistration = () => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const license = `HOSP-${formData.plan.toUpperCase().substring(0, 3)}-${formData.roomsCount}-${randomHex}-LIVE`;
    setGeneratedLicense(license);
    setGeneratedTenantId('tenant_' + Math.random().toString(36).substring(2, 10));
    setStep(4);
  };

  // Pair with running Local Hub Server
  const handlePairWithLocalHub = async () => {
    setPairingStatus('pairing');
    setPairingMessage('Contacting local Hospware Hub on port 4000...');

    try {
      const payload = {
        licenseKey: generatedLicense,
        cloudTenantId: generatedTenantId,
        name: formData.hotelName,
        code: formData.code,
        currency: formData.currency,
        timeZone: formData.timeZone,
        address: formData.address,
        phone: formData.phone,
        email: formData.ownerEmail,
        subscriptionTier: formData.plan,
        subscriptionStatus: 'active',
        maxRooms: formData.roomsCount,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPin: formData.ownerPin,
      };

      const res = await fetch('/api/hotels/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPairingStatus('success');
        setPairingMessage('🎉 Hotel successfully paired and activated on local SQLite database!');
      } else {
        setPairingStatus('error');
        setPairingMessage(data.error || 'Failed to activate hotel on local hub.');
      }
    } catch {
      setPairingStatus('error');
      setPairingMessage('Could not reach Local Hub server at http://localhost:4000. Ensure "npm run dev" or the hub server is running.');
    }
  };

  // Fast floor staff provisioning
  const handleAddStaffMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name) return;

    const newStaff = {
      id: Math.random().toString(36).substring(2, 7),
      name: staffForm.name,
      role: staffForm.role,
      pinCode: staffForm.pinCode || Math.floor(1000 + Math.random() * 9000).toString(),
    };

    setStaffList(prev => [...prev, newStaff]);

    // Send to local hub if available
    try {
      await fetch('/api/users/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: 'current',
          name: newStaff.name,
          role: newStaff.role,
          pinCode: newStaff.pinCode,
        }),
      });
    } catch {
      // Local state already updated
    }

    setStaffForm({ name: '', role: 'receptionist', pinCode: '', email: '' });
  };

  const copyLicenseToClipboard = () => {
    navigator.clipboard.writeText(generatedLicense);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="portal-app">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="container nav-content">
          <a href="#" className="logo-group" onClick={() => setActiveTab('register')}>
            <div className="logo-badge">
              <Building2 size={22} />
            </div>
            <div className="logo-text">
              Hospware<span>Cloud</span>
            </div>
          </a>

          <nav className="nav-links">
            <button 
              className={`nav-link ${activeTab === 'register' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveTab('register')}
            >
              Hotel Registration
            </button>
            <button 
              className={`nav-link ${activeTab === 'pricing' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveTab('pricing')}
            >
              Pricing & Plans
            </button>
            <button 
              className={`nav-link ${activeTab === 'staff' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveTab('staff')}
            >
              Staff Onboarding Flow
            </button>
            <button 
              className={`nav-link ${activeTab === 'architecture' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveTab('architecture')}
            >
              Offline Architecture
            </button>
          </nav>

          <div className="nav-actions">
            <div className="hero-badge-item" style={{ padding: '0.4rem 0.85rem' }}>
              <Server size={14} color={hubOnline ? '#10b981' : '#f43f5e'} />
              <span style={{ fontSize: '0.8rem' }}>
                Local Hub: {hubOnline === null ? 'Checking...' : hubOnline ? 'Online (4000)' : 'Offline'}
              </span>
            </div>

            <a 
              href="http://localhost:3000" 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Open Dashboard <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container">
        {activeTab === 'register' && (
          <div>
            {/* Hero Banner */}
            <section className="hero">
              <div className="pill-badge">
                <Sparkles size={14} /> Seamless Onboarding for Hotels & Resorts
              </div>
              <h1 className="hero-title">
                Register Your Property & <br />
                <span className="hero-gradient">Deploy Your Offline-First Hub</span>
              </h1>
              <p className="hero-subtitle">
                Set up your hotel profile, choose your room capacity, and generate your license key. 
                Your on-premise local server will pair instantly and operate even when the internet is down.
              </p>

              <div className="hero-badges">
                <div className="hero-badge-item">
                  <ShieldCheck size={16} color="#10b981" /> 14-Day Free Trial
                </div>
                <div className="hero-badge-item">
                  <Server size={16} color="#6366f1" /> Local SQLite LAN Mesh
                </div>
                <div className="hero-badge-item">
                  <Smartphone size={16} color="#38bdf8" /> Instant Staff Fast PINs
                </div>
              </div>
            </section>

            {/* Registration Wizard Card */}
            <div className="registration-container">
              {/* Step Bar */}
              <div className="step-bar">
                <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`} onClick={() => setStep(1)}>
                  <div className="step-circle">{step > 1 ? <Check size={18} /> : 1}</div>
                  <span className="step-title">Property Profile</span>
                </div>
                <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`} onClick={() => setStep(2)}>
                  <div className="step-circle">{step > 2 ? <Check size={18} /> : 2}</div>
                  <span className="step-title">Plan & Capacity</span>
                </div>
                <div className={`step-item ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`} onClick={() => setStep(3)}>
                  <div className="step-circle">{step > 3 ? <Check size={18} /> : 3}</div>
                  <span className="step-title">Checkout & Trial</span>
                </div>
                <div className={`step-item ${step === 4 ? 'active' : ''}`}>
                  <div className="step-circle"><Key size={18} /></div>
                  <span className="step-title">Pairing & Activation</span>
                </div>
              </div>

              {/* STEP 1: Property Profile */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    1. Hotel & Owner Information
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
                    Enter your property details and master administrator contact.
                  </p>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="hotelName">
                        Hotel / Property Name
                      </label>
                      <input 
                        id="hotelName"
                        type="text" 
                        className="input-control"
                        value={formData.hotelName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Grand Pacific Suites"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="code">
                        Property Code (Unique Identifier)
                        <span className="form-label-hint">For terminals & sync</span>
                      </label>
                      <input 
                        id="code"
                        type="text" 
                        className="input-control"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g. grand-pacific"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="currency">Operational Currency</label>
                      <select 
                        id="currency"
                        className="input-control"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      >
                        <option value="USD">USD ($ - United States Dollar)</option>
                        <option value="EUR">EUR (€ - Euro)</option>
                        <option value="GBP">GBP (£ - British Pound)</option>
                        <option value="KES">KES (KSh - Kenyan Shilling)</option>
                        <option value="AED">AED (AED - UAE Dirham)</option>
                        <option value="CAD">CAD ($ - Canadian Dollar)</option>
                        <option value="AUD">AUD ($ - Australian Dollar)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="timeZone">Property Timezone</label>
                      <select 
                        id="timeZone"
                        className="input-control"
                        value={formData.timeZone}
                        onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                      >
                        <option value="UTC">UTC (Universal Time)</option>
                        <option value="America/New_York">America/New York (EST/EDT)</option>
                        <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                        <option value="Europe/London">Europe/London (GMT/BST)</option>
                        <option value="Europe/Paris">Europe/Paris (CET)</option>
                        <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      </select>
                    </div>

                    <div className="form-group form-full">
                      <label className="form-label" htmlFor="address">Physical Property Address</label>
                      <input 
                        id="address"
                        type="text" 
                        className="input-control"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street, City, Country"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="ownerName">Owner / General Manager Name</label>
                      <input 
                        id="ownerName"
                        type="text" 
                        className="input-control"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        placeholder="Full Name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="ownerEmail">Owner Email Address</label>
                      <input 
                        id="ownerEmail"
                        type="email" 
                        className="input-control"
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        placeholder="owner@hotel.com"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="ownerPin">
                        Master Terminal PIN (4-6 digits)
                        <span className="form-label-hint">For quick front-desk override</span>
                      </label>
                      <input 
                        id="ownerPin"
                        type="password" 
                        maxLength={6}
                        className="input-control"
                        value={formData.ownerPin}
                        onChange={(e) => setFormData({ ...formData, ownerPin: e.target.value })}
                        placeholder="e.g. 8492"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="phone">Contact Phone</label>
                      <input 
                        id="phone"
                        type="tel" 
                        className="input-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setStep(2)}>
                      Next: Choose Plan & Capacity <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Plan & Room Capacity */}
              {step === 2 && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    2. Select Subscription & Room Capacity
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
                    Fair, transparent per-room pricing designed for boutique properties to grand resorts.
                  </p>

                  {/* Room Slider */}
                  <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 600 }}>Total Property Rooms:</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>{formData.roomsCount} Rooms</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="200" 
                      step="5"
                      value={formData.roomsCount}
                      onChange={(e) => setFormData({ ...formData, roomsCount: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                      <span>5 Rooms (Boutique / B&B)</span>
                      <span>50 Rooms (Midscale)</span>
                      <span>100 Rooms</span>
                      <span>200+ Rooms (Resort)</span>
                    </div>
                  </div>

                  {/* Pricing Cards */}
                  <div className="pricing-grid">
                    <div 
                      className={`pricing-card ${formData.plan === 'starter' ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, plan: 'starter' })}
                    >
                      <div className="card-tier-name">Starter Hub</div>
                      <div className="card-tier-price">
                        <span className="price-val">$1.20</span>
                        <span className="price-unit">/ room / mo</span>
                      </div>
                      <ul className="tier-features">
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Up to 30 Rooms</li>
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Offline SQLite Hub</li>
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Front Desk & Housekeeping</li>
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Up to 5 Staff Logins</li>
                      </ul>
                    </div>

                    <div 
                      className={`pricing-card ${formData.plan === 'standard' ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, plan: 'standard' })}
                    >
                      <div className="popular-badge">RECOMMENDED</div>
                      <div className="card-tier-name">Professional</div>
                      <div className="card-tier-price">
                        <span className="price-val">$1.80</span>
                        <span className="price-unit">/ room / mo</span>
                      </div>
                      <ul className="tier-features">
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Up to 100 Rooms</li>
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Real-time LAN Mesh Sync</li>
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Restaurant POS & Room Billing</li>
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Unlimited Staff Fast-PINs</li>
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Mobile Owner Reporting App</li>
                      </ul>
                    </div>

                    <div 
                      className={`pricing-card ${formData.plan === 'premium' ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, plan: 'premium' })}
                    >
                      <div className="card-tier-name">Enterprise Chain</div>
                      <div className="card-tier-price">
                        <span className="price-val">$2.50</span>
                        <span className="price-unit">/ room / mo</span>
                      </div>
                      <ul className="tier-features">
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Unlimited Rooms & Properties</li>
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Dedicated Cloud Sync Node</li>
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Multi-Property Central Portfolio</li>
                        <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> 24/7 Dedicated Priority SLA</li>
                      </ul>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => setStep(1)}>
                      Back
                    </button>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estimated Monthly Cost:</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>${monthlyTotal} / mo</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setStep(3)}>
                      Proceed to Checkout <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Payment & Free Trial Checkout */}
              {step === 3 && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    3. Secure Payment & 14-Day Trial Activation
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
                    Your first 14 days are completely free. You can cancel anytime before your trial ends.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }}>
                    {/* Simulated Payment Card Form */}
                    <div style={{ background: 'var(--bg-surface)', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CreditCard size={18} color="var(--primary)" /> Payment Method
                        </span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                          256-Bit SSL Encrypted
                        </span>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label" htmlFor="cardNum">Card Number</label>
                        <input 
                          id="cardNum"
                          type="text" 
                          className="input-control" 
                          defaultValue="4242 •••• •••• 4242" 
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label" htmlFor="exp">Expiration</label>
                          <input id="exp" type="text" className="input-control" defaultValue="12/28" />
                        </div>
                        <div className="form-group">
                          <label className="form-label" htmlFor="cvc">CVC</label>
                          <input id="cvc" type="text" className="input-control" defaultValue="982" />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" htmlFor="nameCard">Name on Card</label>
                        <input id="nameCard" type="text" className="input-control" defaultValue={formData.ownerName} />
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Lock size={14} color="#10b981" />
                        <span>Powered by Stripe Billing Integration</span>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Order Summary</h3>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Hotel:</span>
                          <span style={{ fontWeight: 600 }}>{formData.hotelName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Plan:</span>
                          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{formData.plan}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Rooms:</span>
                          <span style={{ fontWeight: 600 }}>{formData.roomsCount} Rooms</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Trial Period:</span>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>14 Days Free</span>
                        </div>

                        <hr style={{ borderColor: 'var(--border-subtle)', margin: '1rem 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontWeight: 700 }}>Due Today:</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>$0.00</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right', marginTop: '0.25rem' }}>
                          Then ${monthlyTotal}/month starting in 14 days
                        </div>
                      </div>

                      <button 
                        className="btn btn-success" 
                        style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem' }}
                        onClick={handleCompleteRegistration}
                      >
                        Start Free Trial & Generate Key <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => setStep(2)}>
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Success & Hub Pairing */}
              {step === 4 && (
                <div className="pairing-success">
                  <div className="success-icon-wrap">
                    <CheckCircle2 size={40} />
                  </div>

                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Hotel Registration Complete!
                  </h2>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '550px', margin: '0 auto 1.5rem', fontSize: '1rem' }}>
                    Your cloud tenant account has been provisioned. Pair your on-premise Hospware Hub server to complete activation.
                  </p>

                  <div className="pairing-box">
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Hotel Provisioning & Pairing Key
                    </div>
                    
                    <div className="pairing-key-display">
                      <span className="pairing-key-code">{generatedLicense}</span>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={copyLicenseToClipboard}
                      >
                        {copiedKey ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        {copiedKey ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                      Cloud Tenant ID: <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{generatedTenantId}</span>
                    </div>
                  </div>

                  {/* 1-Click Local Hub Activation */}
                  <div style={{ margin: '2rem auto', maxWidth: '600px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                      Option A: Instant 1-Click Local Activation
                    </h3>
                    <p className="step-instruction">
                      If your Hospware Local Hub server is running on this machine (port 4000), click below to immediately inject the license and initialize the local SQLite database.
                    </p>

                    <button 
                      className="btn btn-primary"
                      style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
                      onClick={handlePairWithLocalHub}
                      disabled={pairingStatus === 'pairing'}
                    >
                      {pairingStatus === 'pairing' ? (
                        <>
                          <RefreshCw size={18} className="spin" /> Activating Local Hub...
                        </>
                      ) : (
                        <>
                          <Server size={18} /> Pair with Running Local Hub
                        </>
                      )}
                    </button>

                    {pairingMessage && (
                      <div className={`notification-banner ${pairingStatus === 'success' ? 'success' : 'error'}`} style={{ marginTop: '1rem', textAlign: 'left' }}>
                        {pairingStatus === 'success' ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
                        <div>{pairingMessage}</div>
                      </div>
                    )}
                  </div>

                  {/* Option B: Terminal Command */}
                  <div style={{ margin: '2rem auto', maxWidth: '600px', textAlign: 'left' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      Option B: CLI On-Premise Pairing Command
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      On your dedicated front-desk server or Raspberry Pi terminal:
                    </p>
                    <div className="cli-code-snippet">
                      curl -X POST http://localhost:4000/api/hotels/activate \<br />
                      &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                      &nbsp;&nbsp;-d '&#123;"licenseKey":"{generatedLicense}","name":"{formData.hotelName}","code":"{formData.code}","ownerEmail":"{formData.ownerEmail}"&#125;'
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                    <a 
                      href="http://localhost:3000" 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn btn-success"
                      style={{ padding: '0.75rem 1.5rem' }}
                    >
                      Open Front Desk Dashboard (Port 3000) <ExternalLink size={16} />
                    </a>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => { setStep(1); setPairingStatus('idle'); setPairingMessage(''); }}
                    >
                      Register Another Hotel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRICING CALCULATOR */}
        {activeTab === 'pricing' && (
          <div style={{ padding: '2rem 0' }}>
            <h2 className="section-title">Transparent Hospitality Pricing</h2>
            <p className="section-subtitle">
              Simple per-room pricing without hidden setup fees. All plans include full offline-first functionality.
            </p>

            <div className="pricing-grid">
              <div className="pricing-card">
                <div className="card-tier-name">Starter Hub</div>
                <div className="card-tier-price">
                  <span className="price-val">$1.20</span>
                  <span className="price-unit">/ room / month</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Ideal for Bed & Breakfasts and boutique hotels up to 30 rooms.
                </p>
                <ul className="tier-features">
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> 100% Offline Local Hub</li>
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Front Desk Reservation Grid</li>
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Housekeeping Status Tracking</li>
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Guest Folio & Invoicing</li>
                </ul>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1.75rem' }}
                  onClick={() => { setFormData({ ...formData, plan: 'starter' }); setActiveTab('register'); setStep(1); }}
                >
                  Choose Starter
                </button>
              </div>

              <div className="pricing-card selected">
                <div className="popular-badge">MOST POPULAR</div>
                <div className="card-tier-name">Professional</div>
                <div className="card-tier-price">
                  <span className="price-val">$1.80</span>
                  <span className="price-unit">/ room / month</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  For busy hotels with multi-terminal front desk and restaurant/bar POS.
                </p>
                <ul className="tier-features">
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Everything in Starter</li>
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Multi-Terminal LAN WebSocket Sync</li>
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Restaurant POS & Room Folio Billing</li>
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Fast Staff PIN Switching</li>
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Mobile Owner Manager App</li>
                </ul>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1.75rem' }}
                  onClick={() => { setFormData({ ...formData, plan: 'standard' }); setActiveTab('register'); setStep(1); }}
                >
                  Choose Professional
                </button>
              </div>

              <div className="pricing-card">
                <div className="card-tier-name">Enterprise Chain</div>
                <div className="card-tier-price">
                  <span className="price-val">$2.50</span>
                  <span className="price-unit">/ room / month</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  For hotel groups, multi-property resorts, and hotel management companies.
                </p>
                <ul className="tier-features">
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Multi-Property Central Cloud Rollup</li>
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Cross-Property Guest Recognition</li>
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Dedicated Cloud Replica Server</li>
                  <li className="tier-feature-item"><CheckCircle2 size={16} color="#10b981" /> Custom Hardware Provisioning</li>
                </ul>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1.75rem' }}
                  onClick={() => { setFormData({ ...formData, plan: 'premium' }); setActiveTab('register'); setStep(1); }}
                >
                  Contact Enterprise
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STAFF ONBOARDING FLOW */}
        {activeTab === 'staff' && (
          <div style={{ padding: '2rem 0' }}>
            <h2 className="section-title">Staff Onboarding & Fast PIN Management</h2>
            <p className="section-subtitle">
              Hospitality shift workers need frictionless terminal logins without waiting for corporate email verification.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
              {/* Quick Add Form */}
              <div style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={18} color="var(--primary)" /> Add Floor Staff (Fast PIN)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Provisions a local terminal user immediately with instant SQLite persistence.
                </p>

                <form onSubmit={handleAddStaffMember}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" htmlFor="staffName">Staff Full Name</label>
                    <input 
                      id="staffName"
                      type="text" 
                      className="input-control"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      placeholder="e.g. Carlos Gomez"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" htmlFor="staffRole">Operational Role</label>
                    <select 
                      id="staffRole"
                      className="input-control"
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as StaffFormData['role'] })}
                    >
                      <option value="receptionist">Receptionist (Front Desk)</option>
                      <option value="housekeeper">Housekeeper (Cleaning & Inspections)</option>
                      <option value="waiter">Waiter (Restaurant / POS)</option>
                      <option value="kitchen">Kitchen Staff (KDS Display)</option>
                      <option value="manager">Manager (Shift Supervisor)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label" htmlFor="staffPin">
                      Quick 4-Digit PIN Code
                      <span className="form-label-hint">For shared terminals</span>
                    </label>
                    <input 
                      id="staffPin"
                      type="text" 
                      maxLength={4}
                      className="input-control"
                      value={staffForm.pinCode}
                      onChange={(e) => setStaffForm({ ...staffForm, pinCode: e.target.value })}
                      placeholder="e.g. 4021 (or leave blank to auto-generate)"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Provision Staff Instantly
                  </button>
                </form>
              </div>

              {/* Active Staff List */}
              <div style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} color="#10b981" /> Active Hotel Staff ({staffList.length})
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Synced to Local Hub SQLite</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {staffList.map((member) => (
                    <div 
                      key={member.id}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.85rem 1rem', 
                        background: 'var(--bg-surface)', 
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{member.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          Role: {member.role}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Fast PIN</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                            •••• ({member.pinCode})
                          </span>
                        </div>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.85rem', color: '#c7d2fe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <Mail size={15} /> Remote Management Invitations
                  </div>
                  Managers requiring remote cloud access are sent an email invite token valid for 48 hours to create a master password.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ARCHITECTURE OVERVIEW */}
        {activeTab === 'architecture' && (
          <div style={{ padding: '2rem 0' }}>
            <h2 className="section-title">The Hospware Offline-First Mesh</h2>
            <p className="section-subtitle">
              How Hospware guarantees 100% operational uptime for hotel front desks, POS, and housekeeping.
            </p>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Server size={22} />
                </div>
                <h3 className="feature-title">Local SQLite Hub Server</h3>
                <p className="feature-desc">
                  Every property runs a local Express + Better-SQLite3 hub server. All reads and writes occur with sub-millisecond local latency.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <RefreshCw size={22} />
                </div>
                <h3 className="feature-title">WebSocket LAN Mesh</h3>
                <p className="feature-desc">
                  When reception assigns a guest to room 204, the housekeeper tablet and restaurant POS update instantly over the local WiFi network.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="feature-title">Sync Journal & CRDT Queue</h3>
                <p className="feature-desc">
                  Every mutation is logged to the <code style={{ color: '#38bdf8' }}>sync_journal</code> table with monotonic revision versions, ensuring zero lost updates when re-syncing with the cloud.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '2.5rem 0', marginTop: '4rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            © 2026 Hospware Platform Inc. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Documentation</span>
            <span>API Reference</span>
            <span>Local Hub Diagnostics</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
