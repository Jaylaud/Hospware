'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Heading, 
  Text, 
  Flex, 
  Grid, 
  Button, 
  Box, 
  Tabs,
  Table,
  Dialog,
  Callout,
  TextField,
  Select,
  Badge,
  Separator,
  Switch,
  Progress,
  Slider
} from '@radix-ui/themes';
import { 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  PackagePlus,
  Unlock,
  Settings,
  Smartphone,
  User,
  KeyRound,
  Building2,
  CreditCard,
  Bell,
  MapPin,
  Mail,
  Phone,
  Clock,
  Save,
  UserCheck,
  Sparkles,
  Plus,
  Wand2,
  Pencil,
  Trash2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Download,
  Monitor,
  Send,
  Copy,
  UtensilsCrossed,
  Receipt,
  Calendar
} from 'lucide-react';
import { 
  AVAILABLE_MODULES, 
  calculateTierBlock, 
  calculateBasePrice, 
  calculateModulesPrice, 
  calculateTotalMonthly, 
  AddonModule 
} from '@/lib/pricing';

interface PortalRoom {
  number: string;
  type: string;
  floor: number;
  rate: number;
  status: 'occupied' | 'available' | 'reserved' | 'dirty' | 'cleaning';
  guest?: string;
  checkout?: string;
}

const SAMPLE_ROOMS: PortalRoom[] = [
  { number: '101', type: 'Standard King', floor: 1, rate: 350, status: 'available' },
  { number: '102', type: 'Standard King', floor: 1, rate: 350, status: 'occupied', guest: 'Kwesi Appiah', checkout: 'Tomorrow, 11 AM' },
  { number: '103', type: 'Deluxe Queen', floor: 1, rate: 450, status: 'dirty' },
  { number: '104', type: 'Deluxe Queen', floor: 1, rate: 450, status: 'reserved', guest: 'Nana Ama Ofori (Arriving Today)', checkout: '3 Nights Reserved' },
  { number: '201', type: 'Executive Suite', floor: 2, rate: 680, status: 'occupied', guest: 'Akosua Mensah', checkout: '28 Oct, 12 PM' },
  { number: '202', type: 'Standard Double', floor: 2, rate: 320, status: 'cleaning' },
  { number: '203', type: 'Standard Double', floor: 2, rate: 320, status: 'available' },
  { number: '204', type: 'Executive Suite', floor: 2, rate: 680, status: 'reserved', guest: 'Kofi Mensah (Arriving Today)', checkout: '2 Nights Reserved' },
  { number: '301', type: 'Presidential Suite', floor: 3, rate: 950, status: 'available' },
  { number: '302', type: 'Presidential Suite', floor: 3, rate: 950, status: 'occupied', guest: 'Dr. Michael Boateng', checkout: '30 Oct, 10 AM' }
];

// Helper to extract number via regular expressions, auto-increment, or append if missing
function parseAndGenerateRoomNames(baseInput: string, count: number): string[] {
  // Strip leading "room" or "room " so results do not start with the word "Room"
  const trimmed = baseInput.trim().replace(/^room\s*/i, '');
  if (!trimmed) {
    return [];
  }

  // Regex to separate prefix, number sequence, and suffix
  // e.g. "Room 101" -> prefix="Room ", numStr="101", suffix=""
  // e.g. "101" -> prefix="", numStr="101", suffix=""
  // e.g. "Villa 01-B" -> prefix="Villa ", numStr="01", suffix="-B"
  const match = trimmed.match(/^(.*?)(\d+)([^\d]*)$/);

  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const suffix = match[3];
    const startNum = parseInt(numStr, 10);
    const padLength = numStr.length;

    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const currentVal = startNum + i;
      const formattedNum = String(currentVal).padStart(padLength, '0');
      names.push(`${prefix}${formattedNum}${suffix}`);
    }

    return names;
  } else {
    // If no number exists in the name (e.g. "Chalet A" or "Executive Suite")
    if (count <= 1) {
      return [trimmed];
    } else {
      const names: string[] = [];
      for (let i = 1; i <= count; i++) {
        names.push(`${trimmed} ${i}`);
      }
      return names;
    }
  }
}

export default function PortalPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [settingsSubSection, setSettingsSubSection] = useState<'hotel' | 'admin' | 'billing' | 'security'>('hotel');

  // Dynamic Room Inventory State
  const [rooms, setRooms] = useState<PortalRoom[]>(SAMPLE_ROOMS);

  // Hotel Profile & Property Configuration (Default Tier 1: 20 rooms limit)
  const [hotelProfile, setHotelProfile] = useState({
    name: 'Golden Palm Hotel & Suites',
    city: 'East Legon, Accra',
    digitalAddress: 'GA-183-9021',
    phone: '+233 30 212 3456',
    email: 'frontdesk@goldenpalm.com.gh',
    capacity: 20, // Tier 1: 20 rooms limit
    checkInTime: '14:00',
    checkOutTime: '11:00'
  });

  const [activeModules, setActiveModules] = useState<string[]>(['bar_pos', 'sms_alerts', 'housekeeping']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string>('HW-GH-4821');
  const [phoneLinkForm, setPhoneLinkForm] = useState({
    recipientName: 'Kwabena Darko',
    phone: '024 412 3456',
    appRole: 'owner_report' as 'owner_report' | 'housekeeping' | 'waiter_pos',
    channel: 'whatsapp' as 'whatsapp' | 'sms'
  });
  const [dispatchedLinks, setDispatchedLinks] = useState<
    { id: string; recipient: string; phone: string; roleLabel: string; channel: string; sentAt: string }[]
  >([
    {
      id: 'dl-1',
      recipient: 'Kwabena Darko (Owner)',
      phone: '024 412 3456',
      roleLabel: 'Owner Live Report & Alert App',
      channel: 'WhatsApp',
      sentAt: 'Today, 08:30 AM'
    },
    {
      id: 'dl-2',
      recipient: 'Abena Osei (Floor Lead)',
      phone: '054 889 1023',
      roleLabel: 'Mobile Housekeeping & Turnover App',
      channel: 'SMS',
      sentAt: 'Today, 09:15 AM'
    }
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
      const saved = localStorage.getItem('hospware_registered_hotel');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name) {
            setHotelProfile(prev => ({
              ...prev,
              name: parsed.name,
              email: parsed.email || prev.email,
              capacity: parsed.capacity || prev.capacity
            }));
          }
          if (parsed.pairingCode) {
            setPairingCode(parsed.pairingCode);
          }
        } catch {
          // ignore invalid json
        }
      }
    }
  }, []);

  const handleSendPhoneAppLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneLinkForm.phone.trim()) return;
    const roleMap = {
      owner_report: 'Owner Live Report & Alert App',
      housekeeping: 'Mobile Housekeeping & Turnover App',
      waiter_pos: 'Restaurant & Bar Waiter POS Pad'
    };
    const roleLabel = roleMap[phoneLinkForm.appRole];
    const channelLabel = phoneLinkForm.channel === 'whatsapp' ? 'WhatsApp' : 'SMS';

    setDispatchedLinks(prev => [
      {
        id: `dl-${Date.now()}`,
        recipient: phoneLinkForm.recipientName || 'Staff Member',
        phone: phoneLinkForm.phone,
        roleLabel,
        channel: channelLabel,
        sentAt: 'Just now'
      },
      ...prev
    ]);

    setToastMessage(
      `✓ Sent ${roleLabel} download & auto-pairing link (${pairingCode}) via ${channelLabel} to ${phoneLinkForm.phone}.`
    );
    setTimeout(() => setToastMessage(null), 5500);
  };

  // In-app configurable admin & security details
  const [adminSettings, setAdminSettings] = useState({
    adminName: 'Kwabena Darko',
    adminRole: 'General Manager & Owner',
    adminPhone: '024 412 3456',
    adminEmail: 'kwabena.darko@goldenpalm.com.gh',
    whatsappDailyAudit: true,
    whatsappShiftAlerts: true,
    whatsappDiscrepancies: false,
    momoNetwork: 'MTN Mobile Money',
    momoNumber: '024 412 3456',
    momoAccountName: 'Kwabena Darko / Golden Palm',
    autoDebitPrompt: true,
    receptionPin: '4821',
    requirePinForOverride: true,
    shiftHandoverLock: true,
    autoLockMinutes: '15'
  });

  // Module dialog states
  const [activateDialogOpen, setActivateDialogOpen] = useState<boolean>(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState<boolean>(false);
  const [selectedModule, setSelectedModule] = useState<AddonModule | null>(null);
  const [activationOption, setActivationOption] = useState<'trial' | 'immediate'>('trial');

  // Room Management & Upgrade Dialog States
  const [addRoomsDialogOpen, setAddRoomsDialogOpen] = useState<boolean>(false);
  const [editRoomDialogOpen, setEditRoomDialogOpen] = useState<boolean>(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState<boolean>(false);

  // Room form states
  const [roomToEdit, setRoomToEdit] = useState<PortalRoom | null>(null);

  const [addRoomForm, setAddRoomForm] = useState({
    name: '101',
    count: 1,
    type: 'Standard King',
    floor: 1,
    rate: 350
  });

  // Upgrade interception state
  const [pendingRoomsToAdd, setPendingRoomsToAdd] = useState<PortalRoom[]>([]);
  const [upgradeTargetTier, setUpgradeTargetTier] = useState<number>(2);
  const [upgradeReason, setUpgradeReason] = useState<string>('');

  const tierBlock = calculateTierBlock(hotelProfile.capacity);
  const maxAllowedRooms = tierBlock * 20;
  const basePrice = calculateBasePrice(hotelProfile.capacity);
  const modulesPrice = calculateModulesPrice(hotelProfile.capacity, activeModules);
  const totalMonthly = calculateTotalMonthly(hotelProfile.capacity, activeModules);

  // Room Addition & Management Handlers
  const handleOpenAddRoomsDialog = () => {
    // Calculate smart default starting room number and floor from current inventory
    const existingNums = rooms
      .map(r => parseInt(r.number.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const nextStart = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 101;
    const initialFloor = nextStart >= 100 && nextStart <= 999 ? Math.floor(nextStart / 100) : 1;

    setAddRoomForm({
      name: `${nextStart}`,
      count: 1,
      type: 'Standard King',
      floor: initialFloor,
      rate: 350
    });
    setAddRoomsDialogOpen(true);
  };

  const handleAddRoomsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addRoomForm.name.trim()) return;

    const names = parseAndGenerateRoomNames(addRoomForm.name, addRoomForm.count);
    if (names.length === 0) return;

    // Duplicate detection
    const existingNumbers = new Set(rooms.map(r => r.number.toLowerCase()));
    const conflicts = names.filter(n => existingNumbers.has(n.toLowerCase()));

    if (conflicts.length === names.length) {
      setToastMessage(`⚠ Room(s) ${conflicts.slice(0, 3).join(', ')}${conflicts.length > 3 ? '...' : ''} already exist in inventory.`);
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    const roomsToCreate: PortalRoom[] = names
      .filter(name => !existingNumbers.has(name.toLowerCase()))
      .map(name => {
        // Automatically calculate floor if 3 or 4-digit number (e.g. 201 -> floor 2)
        const numMatch = name.match(/\d+/);
        let calculatedFloor = addRoomForm.floor;
        if (numMatch) {
          const val = parseInt(numMatch[0], 10);
          if (val >= 100 && val <= 9999) {
            calculatedFloor = Math.floor(val / 100);
          }
        }

        return {
          number: name,
          type: addRoomForm.type,
          floor: calculatedFloor,
          rate: addRoomForm.rate,
          status: 'available'
        };
      });

    const projectedTotal = rooms.length + roomsToCreate.length;
    if (projectedTotal > maxAllowedRooms) {
      const neededTier = Math.ceil(projectedTotal / 20);
      setPendingRoomsToAdd(roomsToCreate);
      setUpgradeTargetTier(neededTier);
      setUpgradeReason(`Adding ${roomsToCreate.length} room(s) will bring your inventory to ${projectedTotal} rooms, exceeding your Tier ${tierBlock} limit (${maxAllowedRooms} rooms).`);
      setAddRoomsDialogOpen(false);
      setUpgradeDialogOpen(true);
      return;
    }

    setRooms(prev => [...prev, ...roomsToCreate]);
    setAddRoomsDialogOpen(false);
    const msg = roomsToCreate.length === 1 
      ? `✓ Room "${roomsToCreate[0].number}" added to inventory.`
      : `✓ Added ${roomsToCreate.length} rooms (${roomsToCreate[0].number} to ${roomsToCreate[roomsToCreate.length - 1].number}) to inventory.`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleConfirmUpgradeAndAdd = () => {
    const newTier = upgradeTargetTier;
    const newCapacity = newTier * 20;

    setHotelProfile(prev => ({
      ...prev,
      capacity: newCapacity
    }));

    if (pendingRoomsToAdd.length > 0) {
      setRooms(prev => [...prev, ...pendingRoomsToAdd]);
    }

    setUpgradeDialogOpen(false);
    setPendingRoomsToAdd([]);
    setToastMessage(`✓ Upgraded to Tier ${newTier} (up to ${newCapacity} rooms)! Subscription updated.`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleOpenEditRoom = (room: PortalRoom) => {
    setRoomToEdit({ ...room });
    setEditRoomDialogOpen(true);
  };

  const handleSaveEditRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomToEdit) return;
    setRooms(prev => prev.map(r => r.number === roomToEdit.number ? roomToEdit : r));
    setEditRoomDialogOpen(false);
    setToastMessage(`✓ Room "${roomToEdit.number}" updated.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteRoom = (roomNumber: string) => {
    setRooms(prev => prev.filter(r => r.number !== roomNumber));
    setToastMessage(`Room "${roomNumber}" removed from inventory.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetToSample = () => {
    setRooms(SAMPLE_ROOMS);
    setToastMessage('✓ Reset to sample hotel room inventory.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenActivate = (mod: AddonModule) => {
    setSelectedModule(mod);
    setActivationOption('trial');
    setActivateDialogOpen(true);
  };

  const handleOpenDeactivate = (mod: AddonModule) => {
    setSelectedModule(mod);
    setDeactivateDialogOpen(true);
  };

  const handleConfirmActivation = () => {
    if (!selectedModule) return;
    const modId = selectedModule.id;
    if (!activeModules.includes(modId)) {
      setActiveModules(prev => [...prev, modId]);
    }
    const msg = activationOption === 'trial'
      ? `7-Day Free Trial activated for "${selectedModule.name}". Unlocked on front desk.`
      : `✓ "${selectedModule.name}" activated! +GH₵ ${selectedModule.pricePerBlock * tierBlock}/mo added to your next MoMo statement.`;
    setToastMessage(msg);
    setActivateDialogOpen(false);
    setSelectedModule(null);
    setTimeout(() => setToastMessage(null), 5500);
  };

  const handleConfirmDeactivation = () => {
    if (!selectedModule) return;
    const modId = selectedModule.id;
    setActiveModules(prev => prev.filter(m => m !== modId));
    setToastMessage(`Module "${selectedModule.name}" deactivated. Subscription adjusted.`);
    setDeactivateDialogOpen(false);
    setSelectedModule(null);
    setTimeout(() => setToastMessage(null), 5500);
  };

  const handleSaveHotelProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(`✓ Property profile saved: "${hotelProfile.name}" updated successfully.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSaveAdminSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(`✓ Administrator contact and WhatsApp preferences saved for ${adminSettings.adminName}.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSaveBillingSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(`✓ Mobile Money billing preferences saved (${adminSettings.momoNetwork} - ${adminSettings.momoNumber}).`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSaveSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('✓ Front desk security and supervisor override PIN updated.');
    setTimeout(() => setToastMessage(null), 5000);
  };

  const getStatusText = (status: PortalRoom['status']) => {
    switch (status) {
      case 'occupied': return <Text size="2" style={{ color: '#fff' }}>Occupied</Text>;
      case 'reserved': return <Text size="2" style={{ color: '#c4b5fd', fontWeight: 600 }}>Reserved</Text>;
      case 'available': return <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Available</Text>;
      case 'dirty': return <Text size="2" style={{ color: '#f87171' }}>Dirty</Text>;
      case 'cleaning': return <Text size="2" style={{ color: '#fbbf24' }}>Cleaning</Text>;
    }
  };

  return (
    <Container size="4" px={{ initial: '4', md: '6' }}>
      <Box style={{ paddingTop: '5rem', paddingBottom: '8rem' }}>
        {/* Toast Alert Callout */}
        {toastMessage && (
          <Box mb="6">
            <Callout.Root color="gray" variant="surface" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Callout.Icon>
                <CheckCircle2 size={16} color="#fff" />
              </Callout.Icon>
              <Callout.Text style={{ color: '#fff' }}>{toastMessage}</Callout.Text>
            </Callout.Root>
          </Box>
        )}

        {/* Portal Header */}
        <Flex justify="between" align="baseline" wrap="wrap" gap="4" mb="8">
          <Box>
            <Flex align="baseline" gap="3" mb="1">
              <Heading size="7" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
                {hotelProfile.name}
              </Heading>
              <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                {hotelProfile.city}
              </Text>
            </Flex>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
              Capacity: {hotelProfile.capacity} Rooms • Tier {tierBlock} • Supabase Live Sync
            </Text>
          </Box>

          <Flex gap="2" wrap="wrap">
            <Button
              variant="soft"
              color="indigo"
              size="2"
              onClick={() => setActiveTab('apps')}
              style={{ cursor: 'pointer', borderRadius: 8 }}
            >
              <Download size={15} />
              <span>Download Apps & Phone Link</span>
            </Button>

            <Button asChild variant="outline" color="gray" size="2" style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', cursor: 'pointer', borderRadius: 8 }}>
              <a href="http://localhost:3000" target="_blank" rel="noreferrer">
                <ShieldCheck size={15} style={{ opacity: 0.7 }} />
                <span>Lobby Workstation</span>
                <ExternalLink size={13} style={{ opacity: 0.4 }} />
              </a>
            </Button>
          </Flex>
        </Flex>

        {/* Minimalist Tabs Control */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List size="2" mb="7" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="apps">Apps & Downloads</Tabs.Trigger>
            <Tabs.Trigger value="rooms">Rooms ({rooms.length})</Tabs.Trigger>
            <Tabs.Trigger value="financials">Financials</Tabs.Trigger>
            <Tabs.Trigger value="modules">
              Add-on Modules ({activeModules.length} Active)
            </Tabs.Trigger>
            <Tabs.Trigger value="settings">
              Settings & Admin
            </Tabs.Trigger>
          </Tabs.List>

          {/* TAB: APPS, STANDALONE DESKTOP DOWNLOADS & PHONE LINKS */}
          <Tabs.Content value="apps">
            <Flex justify="between" align="center" wrap="wrap" gap="4" mb="6">
              <Box>
                <Heading size="5" mb="1" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                  Apps, Standalone Terminals & Mobile Links
                </Heading>
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.5)' }} as="p">
                  Download the ultra-lightweight standalone Front Desk & POS desktop app, install the phone app, or send an instant download link to your phone or staff phones.
                </Text>
              </Box>
              <img
                src="/hospware-logo.png"
                alt="Hospware"
                style={{ height: 28, width: 'auto', objectFit: 'contain' }}
              />
            </Flex>

            <Grid columns={{ initial: '1', md: '2' }} gap="6" mb="7">
              {/* CARD 1: STANDALONE FRONT DESK, POS & HOUSEKEEPING DESKTOP INSTALLER (TAURI) */}
              <Box
                p="6"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem'
                }}
              >
                <Box>
                  <Flex justify="between" align="center" mb="3">
                    <Flex align="center" gap="3">
                      <Box p="2" style={{ background: 'rgba(99, 102, 241, 0.15)', borderRadius: 10 }}>
                        <Monitor size={22} color="#818cf8" />
                      </Box>
                      <Box>
                        <Heading size="4" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                          Premises Hub Standalone App
                        </Heading>
                        <Text size="1" style={{ color: '#818cf8', fontWeight: 600 }}>
                          Powered by Tauri v2 • 4.8 MB Download • 100% Offline SQLite
                        </Text>
                      </Box>
                    </Flex>
                    <Badge color="green" variant="soft">v0.1.0 Ready</Badge>
                  </Flex>

                  <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.55)', lineHeight: 1.6 }} as="p" mb="4">
                    All-in-one lobby desktop application bundling the <strong>Front Desk Room Matrix</strong>, <strong>Restaurant & Bar POS</strong>, <strong>Housekeeping Board</strong>, and <strong>80mm Thermal Receipt Printer Engine</strong>. Uses native OS WebView (95% smaller download than Electron) and works without internet.
                  </Text>

                  {/* Workspace Pairing Key */}
                  <Box
                    p="3"
                    mb="4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: 12
                    }}
                  >
                    <Flex justify="between" align="center">
                      <Box>
                        <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>
                          Property Terminal Pairing Key
                        </Text>
                        <Text size="3" weight="bold" style={{ color: '#fff', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                          {pairingCode}
                        </Text>
                      </Box>
                      <Button
                        size="1"
                        variant="soft"
                        color="gray"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(pairingCode);
                          }
                          setToastMessage(`✓ Copied property pairing key (${pairingCode}) to clipboard.`);
                          setTimeout(() => setToastMessage(null), 4000);
                        }}
                      >
                        <Copy size={12} />
                        <span>Copy Key</span>
                      </Button>
                    </Flex>
                  </Box>
                </Box>

                <Flex direction="column" gap="2">
                  <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                    <Button
                      size="3"
                      style={{
                        background: '#fff',
                        color: '#080a0f',
                        fontWeight: 600,
                        cursor: 'pointer',
                        borderRadius: 10
                      }}
                      onClick={() => {
                        setToastMessage('✓ Downloading Hospware-Premises-Hub-Setup-x64.msi (4.8 MB for Windows 10/11)...');
                        setTimeout(() => setToastMessage(null), 5000);
                      }}
                    >
                      <Download size={15} />
                      <span>Windows (.msi • 4.8 MB)</span>
                    </Button>

                    <Button
                      size="3"
                      variant="soft"
                      color="gray"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                        borderRadius: 10
                      }}
                      onClick={() => {
                        setToastMessage('✓ Downloading Hospware-Premises-Hub-Universal.dmg (5.2 MB for macOS)...');
                        setTimeout(() => setToastMessage(null), 5000);
                      }}
                    >
                      <Download size={15} />
                      <span>macOS (.dmg • 5.2 MB)</span>
                    </Button>
                  </Grid>

                  <Button
                    asChild
                    size="2"
                    variant="ghost"
                    color="gray"
                    style={{ cursor: 'pointer', color: 'rgba(255, 255, 255, 0.6)', marginTop: 4 }}
                  >
                    <a href="http://localhost:3000" target="_blank" rel="noreferrer">
                      <ExternalLink size={13} />
                      <span>Or open Web Terminal in Browser (localhost:3000)</span>
                    </a>
                  </Button>
                </Flex>
              </Box>

              {/* CARD 2: MOBILE PHONE APP DOWNLOAD & SEND LINK TO PHONE (WHATSAPP / SMS) */}
              <Box
                p="6"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem'
                }}
              >
                <Box>
                  <Flex justify="between" align="center" mb="3">
                    <Flex align="center" gap="3">
                      <Box p="2" style={{ background: 'rgba(16, 185, 129, 0.15)', borderRadius: 10 }}>
                        <Smartphone size={22} color="#34d399" />
                      </Box>
                      <Box>
                        <Heading size="4" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                          Mobile Phone App & Link Sender
                        </Heading>
                        <Text size="1" style={{ color: '#34d399', fontWeight: 600 }}>
                          iOS & Android • Owner Reports, Housekeeping & Waiter POS
                        </Text>
                      </Box>
                    </Flex>
                    <Badge color="jade" variant="soft">iOS & Android</Badge>
                  </Flex>

                  <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.55)', lineHeight: 1.6 }} as="p" mb="4">
                    Download the mobile app directly onto your phone or send an instant <strong>WhatsApp / SMS installation link</strong> pre-paired with <strong>{hotelProfile.name}</strong> to yourself, your manager, or housekeeping staff.
                  </Text>

                  {/* Direct Phone Download Buttons */}
                  <Grid columns="2" gap="3" mb="4">
                    <Button
                      size="2"
                      variant="outline"
                      color="gray"
                      style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', cursor: 'pointer', borderRadius: 8 }}
                      onClick={() => {
                        setToastMessage('✓ Downloading Hospware-Mobile-Android.apk (14.2 MB)...');
                        setTimeout(() => setToastMessage(null), 5000);
                      }}
                    >
                      <Download size={14} />
                      <span>Android (.apk • 14 MB)</span>
                    </Button>

                    <Button
                      size="2"
                      variant="outline"
                      color="gray"
                      style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', cursor: 'pointer', borderRadius: 8 }}
                      onClick={() => {
                        setToastMessage('✓ Opening iOS App Store / TestFlight invite for Hospware Mobile...');
                        setTimeout(() => setToastMessage(null), 5000);
                      }}
                    >
                      <Smartphone size={14} />
                      <span>iOS App Store</span>
                    </Button>
                  </Grid>

                  {/* Send Link to Phone Form */}
                  <Box
                    p="4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: 12
                    }}
                  >
                    <Text size="2" weight="bold" mb="3" style={{ color: '#fff', display: 'block' }}>
                      Send Download & Auto-Pair Link to Phone
                    </Text>

                    <form onSubmit={handleSendPhoneAppLink}>
                      <Flex direction="column" gap="3">
                        <Grid columns={{ initial: '1', sm: '2' }} gap="2">
                          <TextField.Root
                            size="2"
                            placeholder="Recipient Name (e.g. Kwabena)"
                            value={phoneLinkForm.recipientName}
                            onChange={(e) => setPhoneLinkForm(p => ({ ...p, recipientName: e.target.value }))}
                          />
                          <TextField.Root
                            size="2"
                            type="tel"
                            required
                            placeholder="Phone (e.g. 024 412 3456)"
                            value={phoneLinkForm.phone}
                            onChange={(e) => setPhoneLinkForm(p => ({ ...p, phone: e.target.value }))}
                          />
                        </Grid>

                        <Grid columns={{ initial: '1', sm: '2' }} gap="2">
                          <Select.Root
                            size="2"
                            value={phoneLinkForm.appRole}
                            onValueChange={(val: 'owner_report' | 'housekeeping' | 'waiter_pos') =>
                              setPhoneLinkForm(p => ({ ...p, appRole: val }))
                            }
                          >
                            <Select.Trigger style={{ width: '100%' }} />
                            <Select.Content>
                              <Select.Item value="owner_report">Owner Live Report App</Select.Item>
                              <Select.Item value="housekeeping">Housekeeping Floor App</Select.Item>
                              <Select.Item value="waiter_pos">Waiter Bar & Dining POS</Select.Item>
                            </Select.Content>
                          </Select.Root>

                          <Select.Root
                            size="2"
                            value={phoneLinkForm.channel}
                            onValueChange={(val: 'whatsapp' | 'sms') =>
                              setPhoneLinkForm(p => ({ ...p, channel: val }))
                            }
                          >
                            <Select.Trigger style={{ width: '100%' }} />
                            <Select.Content>
                              <Select.Item value="whatsapp">Send via WhatsApp</Select.Item>
                              <Select.Item value="sms">Send via SMS</Select.Item>
                            </Select.Content>
                          </Select.Root>
                        </Grid>

                        <Button
                          type="submit"
                          size="2"
                          style={{
                            background: '#10b981',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            borderRadius: 8
                          }}
                        >
                          <Send size={14} />
                          <span>Send App Link to {phoneLinkForm.phone || 'Phone'}</span>
                        </Button>
                      </Flex>
                    </form>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* ALL-IN-ONE OPERATIONS SUITE LAUNCHPAD (FRONT DESK, POS, HOUSEKEEPING, FOLIOS) */}
            <Box
              p="6"
              mb="6"
              style={{
                background: 'rgba(255, 255, 255, 0.015)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 18
              }}
            >
              <Heading size="4" mb="1" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                All-in-One Hotel Operations Suite
              </Heading>
              <Text size="2" mb="5" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>
                Launch or inspect any workstation module directly from one place.
              </Text>

              <Grid columns={{ initial: '1', sm: '2', lg: '5' }} gap="4">
                <Box p="4" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 14 }}>
                  <Flex align="center" gap="2" mb="2">
                    <Building2 size={18} color="#38bdf8" />
                    <Text size="2" weight="bold" style={{ color: '#fff' }}>Front Desk Matrix</Text>
                  </Flex>
                  <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block', marginBottom: '1rem', lineHeight: 1.5 }}>
                    Live room availability, walk-in check-ins, and guest key assignment.
                  </Text>
                  <Button asChild size="2" variant="soft" style={{ width: '100%', cursor: 'pointer', borderRadius: 8 }}>
                    <a href="http://localhost:3000?module=rooms" target="_blank" rel="noreferrer">
                      <span>Open Front Desk</span>
                      <ExternalLink size={13} />
                    </a>
                  </Button>
                </Box>

                <Box p="4" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 14 }}>
                  <Flex align="center" gap="2" mb="2">
                    <Calendar size={18} color="#a78bfa" />
                    <Text size="2" weight="bold" style={{ color: '#fff' }}>Reservations &amp; Holds</Text>
                  </Flex>
                  <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block', marginBottom: '1rem', lineHeight: 1.5 }}>
                    Advance bookings, OTA/corporate holds, MoMo deposits, and arrival check-in.
                  </Text>
                  <Button asChild size="2" variant="soft" style={{ width: '100%', cursor: 'pointer', borderRadius: 8 }}>
                    <a href="http://localhost:3000?module=reservations" target="_blank" rel="noreferrer">
                      <span>Open Reservations</span>
                      <ExternalLink size={13} />
                    </a>
                  </Button>
                </Box>

                <Box p="4" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 14 }}>
                  <Flex align="center" gap="2" mb="2">
                    <UtensilsCrossed size={18} color="#ff2e7e" />
                    <Text size="2" weight="bold" style={{ color: '#fff' }}>Restaurant & Bar POS</Text>
                  </Flex>
                  <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block', marginBottom: '1rem', lineHeight: 1.5 }}>
                    Order food & drinks, print kitchen tickets, and post charges directly to room folios.
                  </Text>
                  <Button asChild size="2" variant="soft" style={{ width: '100%', cursor: 'pointer', borderRadius: 8 }}>
                    <a href="http://localhost:3000?module=pos" target="_blank" rel="noreferrer">
                      <span>Open POS Terminal</span>
                      <ExternalLink size={13} />
                    </a>
                  </Button>
                </Box>

                <Box p="4" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 14 }}>
                  <Flex align="center" gap="2" mb="2">
                    <Sparkles size={18} color="#fbbf24" />
                    <Text size="2" weight="bold" style={{ color: '#fff' }}>Housekeeping Board</Text>
                  </Flex>
                  <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block', marginBottom: '1rem', lineHeight: 1.5 }}>
                    Real-time room turnover tracking, dirty/cleaning alerts, and floor inspection.
                  </Text>
                  <Button asChild size="2" variant="soft" style={{ width: '100%', cursor: 'pointer', borderRadius: 8 }}>
                    <a href="http://localhost:3000?module=housekeeping" target="_blank" rel="noreferrer">
                      <span>Open Housekeeping</span>
                      <ExternalLink size={13} />
                    </a>
                  </Button>
                </Box>

                <Box p="4" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 14 }}>
                  <Flex align="center" gap="2" mb="2">
                    <Receipt size={18} color="#a855f7" />
                    <Text size="2" weight="bold" style={{ color: '#fff' }}>Folios & 80mm Receipts</Text>
                  </Flex>
                  <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block', marginBottom: '1rem', lineHeight: 1.5 }}>
                    Consolidated room + dining bills, MoMo reconciliation, and thermal receipt slips.
                  </Text>
                  <Button asChild size="2" variant="soft" style={{ width: '100%', cursor: 'pointer', borderRadius: 8 }}>
                    <a href="http://localhost:3000?module=billing" target="_blank" rel="noreferrer">
                      <span>Open Guest Folios</span>
                      <ExternalLink size={13} />
                    </a>
                  </Button>
                </Box>
              </Grid>
            </Box>

            {/* RECENTLY SENT MOBILE APP LINKS */}
            <Box
              p="6"
              style={{
                background: 'rgba(255, 255, 255, 0.015)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 18
              }}
            >
              <Heading size="4" mb="3" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                Dispatched Mobile App Links
              </Heading>
              <Flex direction="column" gap="2">
                {dispatchedLinks.map(item => (
                  <Flex
                    key={item.id}
                    justify="between"
                    align="center"
                    p="3"
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                  >
                    <Box>
                      <Text size="2" weight="bold" style={{ color: '#fff' }}>
                        {item.recipient} • {item.phone}
                      </Text>
                      <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>
                        {item.roleLabel} (Key: {pairingCode})
                      </Text>
                    </Box>
                    <Flex align="center" gap="2">
                      <Badge color="green" variant="soft">{item.channel}</Badge>
                      <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{item.sentAt}</Text>
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </Tabs.Content>

          {/* TAB 1: OVERVIEW */}
          <Tabs.Content value="overview">
            <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="6" mb="8">
              <Box p="6" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 16 }}>
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
                  Live Occupancy
                </Text>
                <Text size="8" weight="bold" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
                  {rooms.length > 0 ? Math.round((rooms.filter(r => r.status === 'occupied').length / rooms.length) * 100) : 0}%
                </Text>
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', marginTop: '0.5rem', display: 'block' }}>
                  {rooms.filter(r => r.status === 'occupied').length} of {rooms.length} rooms checked-in
                </Text>
              </Box>

              <Box p="6" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 16 }}>
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
                  Today&apos;s Revenue
                </Text>
                <Text size="8" weight="bold" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
                  GH₵ 3,850
                </Text>
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', marginTop: '0.5rem', display: 'block' }}>
                  Via MoMo & Front Desk Cash
                </Text>
              </Box>

              <Box p="6" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 16 }}>
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
                  Hospware Plan
                </Text>
                <Text size="8" weight="bold" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
                  GH₵ {totalMonthly}
                </Text>
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', marginTop: '0.5rem', display: 'block' }}>
                  Tier {tierBlock} ({maxAllowedRooms} Rooms max) + {activeModules.length} Modules
                </Text>
              </Box>

              <Box p="6" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 16 }}>
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
                  Housekeeping
                </Text>
                <Text size="8" weight="bold" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
                  {rooms.filter(r => r.status === 'dirty' || r.status === 'cleaning').length}
                </Text>
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', marginTop: '0.5rem', display: 'block' }}>
                  Rooms awaiting inspection
                </Text>
              </Box>
            </Grid>

            {/* Current Guest Activity */}
            <Box p="7" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 18 }}>
              <Heading size="4" mb="5" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                Active Stays
              </Heading>
              <Flex direction="column" gap="3">
                {rooms.filter(r => r.status === 'occupied').length === 0 ? (
                  <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>No active guest check-ins currently.</Text>
                ) : (
                  rooms.filter(r => r.status === 'occupied').map(room => (
                    <Flex key={room.number} justify="between" align="center" p="4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <Box>
                        <Text size="2" weight="bold" style={{ color: '#fff' }}>Room {room.number} • {room.guest}</Text>
                        <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }} as="p">{room.type} • GH₵ {room.rate}/night</Text>
                      </Box>
                      <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Checkout: {room.checkout || 'Active stay'}</Text>
                    </Flex>
                  ))
                )}
              </Flex>
            </Box>
          </Tabs.Content>

          {/* TAB 2: ROOM INVENTORY & SMART GENERATOR */}
          <Tabs.Content value="rooms">
            {/* Capacity Allocation & Tier Status Banner */}
            <Box p="5" mb="6" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: 16 }}>
              <Flex justify="between" align={{ initial: 'start', sm: 'center' }} wrap="wrap" gap="4">
                <Box style={{ flex: 1, minWidth: 260 }}>
                  <Flex align="center" gap="2" mb="2">
                    <Text size="3" weight="bold" style={{ color: '#fff' }}>
                      {rooms.length} of {maxAllowedRooms} Rooms Allocated
                    </Text>
                    <Badge 
                      color={rooms.length >= maxAllowedRooms ? 'amber' : 'indigo'} 
                      variant="soft"
                    >
                      Tier {tierBlock} ({maxAllowedRooms} Max)
                    </Badge>
                  </Flex>

                  <Progress 
                    value={Math.min(100, Math.round((rooms.length / maxAllowedRooms) * 100))} 
                    size="2" 
                    color={rooms.length >= maxAllowedRooms ? 'amber' : 'indigo'}
                    style={{ maxWidth: 360, marginBottom: '0.5rem' }} 
                  />

                  {rooms.length >= maxAllowedRooms ? (
                    <Text size="1" style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={13} />
                      <span>Tier capacity limit reached. Need to add more rooms? Upgrade to Tier {tierBlock + 1}.</span>
                    </Text>
                  ) : (
                    <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                      {maxAllowedRooms - rooms.length} room slots remaining in your current GH₵ {basePrice}.00/mo package.
                    </Text>
                  )}
                </Box>

                <Flex gap="3" align="center" wrap="wrap">
                  {rooms.length >= maxAllowedRooms && (
                    <Button 
                      variant="soft" 
                      color="indigo" 
                      size="2"
                      onClick={() => {
                        setUpgradeTargetTier(tierBlock + 1);
                        setPendingRoomsToAdd([]);
                        setUpgradeReason(`Upgrading to Tier ${tierBlock + 1} expands your room capacity from ${maxAllowedRooms} to ${(tierBlock + 1) * 20} rooms.`);
                        setUpgradeDialogOpen(true);
                      }}
                      style={{ cursor: 'pointer', borderRadius: 8 }}
                    >
                      <TrendingUp size={14} />
                      <span>Upgrade to Tier {tierBlock + 1}</span>
                    </Button>
                  )}

                  <Button 
                    variant="solid" 
                    size="2"
                    onClick={handleOpenAddRoomsDialog}
                    style={{ cursor: 'pointer', borderRadius: 8, background: '#fff', color: '#080a0f', fontWeight: 600 }}
                  >
                    <Plus size={15} />
                    <span>Add Room(s)</span>
                  </Button>
                </Flex>
              </Flex>
            </Box>

            {/* Room List or Empty State */}
            {rooms.length === 0 ? (
              <Box p="8" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 18, textAlign: 'center' }}>
                <Box p="3" style={{ display: 'inline-flex', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 16, marginBottom: '1rem' }}>
                  <Plus size={32} color="#818cf8" />
                </Box>
                <Heading size="4" mb="2" style={{ color: '#fff' }}>No Rooms in Inventory</Heading>
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.5)', maxWidth: 440, margin: '0 auto 1.5rem auto', display: 'block', lineHeight: 1.6 }}>
                  Quickly set up your rooms using our smart sequential fill, or load realistic sample rooms to test out the workstation.
                </Text>
                <Flex justify="center" gap="3">
                  <Button 
                    size="3" 
                    onClick={handleOpenAddRoomsDialog}
                    style={{ background: '#fff', color: '#080a0f', fontWeight: 600, borderRadius: 8, cursor: 'pointer' }}
                  >
                    <Plus size={16} />
                    <span>Add Room(s)</span>
                  </Button>
                  <Button 
                    size="3" 
                    variant="soft" 
                    color="gray"
                    onClick={handleResetToSample}
                    style={{ borderRadius: 8, cursor: 'pointer' }}
                  >
                    <RefreshCw size={15} />
                    <span>Load Demo Rooms</span>
                  </Button>
                </Flex>
              </Box>
            ) : (
              <Box p="6" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 18 }}>
                <Flex justify="between" align="center" mb="4">
                  <Box>
                    <Heading size="4" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                      Room Matrix ({rooms.length})
                    </Heading>
                    <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                      Front desk terminal live sync enabled.
                    </Text>
                  </Box>
                  <Button 
                    variant="ghost" 
                    color="gray" 
                    size="1" 
                    onClick={handleResetToSample}
                    style={{ cursor: 'pointer', color: 'rgba(255, 255, 255, 0.4)' }}
                  >
                    <RefreshCw size={12} />
                    <span>Reset to Sample Data</span>
                  </Button>
                </Flex>

                <Table.Root variant="ghost">
                  <Table.Header>
                    <Table.Row style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <Table.ColumnHeaderCell style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Room</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Type</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Floor</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Nightly Rate</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Status</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Current Guest</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ color: 'rgba(255, 255, 255, 0.4)', textAlign: 'right' }}>Actions</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {rooms.map(room => (
                      <Table.Row key={room.number} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <Table.RowHeaderCell style={{ color: '#fff', padding: '14px 10px' }}>
                          {room.number}
                        </Table.RowHeaderCell>
                        <Table.Cell style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{room.type}</Table.Cell>
                        <Table.Cell style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Floor {room.floor}</Table.Cell>
                        <Table.Cell style={{ color: '#fff', fontWeight: 600 }}>GH₵ {room.rate}.00</Table.Cell>
                        <Table.Cell>{getStatusText(room.status)}</Table.Cell>
                        <Table.Cell style={{ color: room.guest ? '#fff' : 'rgba(255, 255, 255, 0.3)' }}>
                          {room.guest || '—'}
                        </Table.Cell>
                        <Table.Cell style={{ textAlign: 'right' }}>
                          <Flex gap="2" justify="end">
                            <Button 
                              variant="ghost" 
                              color="gray" 
                              size="1" 
                              onClick={() => handleOpenEditRoom(room)}
                              style={{ cursor: 'pointer', padding: 6 }}
                              title="Edit Room"
                            >
                              <Pencil size={14} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              color="red" 
                              size="1" 
                              onClick={() => handleDeleteRoom(room.number)}
                              style={{ cursor: 'pointer', padding: 6 }}
                              title="Delete Room"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Tabs.Content>

          {/* TAB 3: FINANCIALS */}
          <Tabs.Content value="financials">
            <Box p="6" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 18 }}>
              <Heading size="4" mb="1" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                Recent Transactions
              </Heading>
              <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', marginBottom: '2rem', display: 'block' }}>
                Mobile Money & front desk collections.
              </Text>

              <Flex direction="column" gap="3">
                <Box p="4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <Flex justify="between" align="center">
                    <Box>
                      <Text size="2" weight="bold" style={{ color: '#fff' }}>Room 102 • Kwesi Appiah (2 Nights)</Text>
                      <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }} as="p">MTN Mobile Money • Ref: MOMO-GH-8921</Text>
                    </Box>
                    <Box style={{ textAlign: 'right' }}>
                      <Text size="3" weight="bold" style={{ color: '#fff' }}>+GH₵ 770.00</Text>
                      <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }} as="p">Today, 09:42 AM</Text>
                    </Box>
                  </Flex>
                </Box>

                <Box p="4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <Flex justify="between" align="center">
                    <Box>
                      <Text size="2" weight="bold" style={{ color: '#fff' }}>Restaurant & Bar POS • Room 201</Text>
                      <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }} as="p">Dinner & Drinks • Ref: POS-BAR-1102</Text>
                    </Box>
                    <Box style={{ textAlign: 'right' }}>
                      <Text size="3" weight="bold" style={{ color: '#fff' }}>+GH₵ 180.00</Text>
                      <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }} as="p">Yesterday, 08:15 PM</Text>
                    </Box>
                  </Flex>
                </Box>

                <Box p="4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <Flex justify="between" align="center">
                    <Box>
                      <Text size="2" weight="bold" style={{ color: '#fff' }}>Hospware Subscription</Text>
                      <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }} as="p">Tier 2 Base + Modules</Text>
                    </Box>
                    <Box style={{ textAlign: 'right' }}>
                      <Text size="3" weight="bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>-GH₵ 700.00</Text>
                      <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }} as="p">01 Oct 2026</Text>
                    </Box>
                  </Flex>
                </Box>
              </Flex>
            </Box>
          </Tabs.Content>

          {/* TAB 4: ADD-ON MODULES STORE (VERTICAL CARDS WITH IMAGE) */}
          <Tabs.Content value="modules">
            <Box mb="6">
              <Heading size="4" mb="1" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                Add-on Modules Store
              </Heading>
              <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }} as="p">
                Unlock specialized capabilities. Changes take effect instantly on lobby terminals.
              </Text>
            </Box>

            <Grid columns={{ initial: '1', sm: '2', lg: '4' }} gap="6">
              {AVAILABLE_MODULES.map((mod) => {
                const isActive = activeModules.includes(mod.id);
                const cost = mod.pricePerBlock * tierBlock;
                return (
                  <Box 
                    key={mod.id} 
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 16,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box style={{ width: '100%', height: 160, position: 'relative', overflow: 'hidden' }}>
                      <img 
                        src={mod.image} 
                        alt={mod.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      {isActive && (
                        <Box 
                          style={{ 
                            position: 'absolute', 
                            top: 10, 
                            right: 10,
                            background: '#fff',
                            color: '#080a0f',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}
                        >
                          ✓ Active
                        </Box>
                      )}
                    </Box>

                    <Box p="5" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Box mb="4">
                        <Heading size="3" mb="2" style={{ color: '#fff' }}>{mod.name}</Heading>
                        <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.6 }} as="p" mb="3">
                          {mod.description}
                        </Text>
                        <Text size="2" weight="bold" style={{ color: '#fff' }}>
                          GH₵ {cost}.00 / mo ({tierBlock} blocks)
                        </Text>
                      </Box>

                      <Box>
                        {isActive ? (
                          <Button
                            variant="ghost"
                            color="red"
                            size="2"
                            onClick={() => handleOpenDeactivate(mod)}
                            style={{ cursor: 'pointer', width: '100%' }}
                          >
                            Deactivate Module
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            color="gray"
                            size="2"
                            onClick={() => handleOpenActivate(mod)}
                            style={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: '#fff', cursor: 'pointer', borderRadius: 8, width: '100%' }}
                          >
                            <Unlock size={14} /> Activate Module
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Grid>
          </Tabs.Content>

          {/* TAB 5: DEDICATED SECTIONED SETTINGS & ADMIN FORMS */}
          <Tabs.Content value="settings">
            <Box mb="7">
              <Heading size="6" mb="1" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
                Settings & Administration
              </Heading>
              <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Configure property details, manager WhatsApp alerts, MoMo subscription billing, and lobby security.
              </Text>
            </Box>

            <Flex direction={{ initial: 'column', md: 'row' }} gap={{ initial: '6', md: '8' }} align="start">
              {/* Settings Sub-Navigation Menu */}
              <Box style={{ width: '100%', maxWidth: 280, flexShrink: 0 }}>
                <Flex direction="column" gap="1">
                  <Button 
                    variant={settingsSubSection === 'hotel' ? 'solid' : 'ghost'}
                    color={settingsSubSection === 'hotel' ? undefined : 'gray'}
                    onClick={() => setSettingsSubSection('hotel')}
                    style={{
                      justifyContent: 'flex-start',
                      height: 48,
                      padding: '0 1.25rem',
                      borderRadius: 10,
                      background: settingsSubSection === 'hotel' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      border: settingsSubSection === 'hotel' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                      color: settingsSubSection === 'hotel' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer'
                    }}
                  >
                    <Building2 size={16} />
                    <Text size="2" weight={settingsSubSection === 'hotel' ? 'bold' : 'medium'}>Hotel & Property</Text>
                  </Button>

                  <Button 
                    variant={settingsSubSection === 'admin' ? 'solid' : 'ghost'}
                    color={settingsSubSection === 'admin' ? undefined : 'gray'}
                    onClick={() => setSettingsSubSection('admin')}
                    style={{
                      justifyContent: 'flex-start',
                      height: 48,
                      padding: '0 1.25rem',
                      borderRadius: 10,
                      background: settingsSubSection === 'admin' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      border: settingsSubSection === 'admin' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                      color: settingsSubSection === 'admin' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer'
                    }}
                  >
                    <UserCheck size={16} />
                    <Text size="2" weight={settingsSubSection === 'admin' ? 'bold' : 'medium'}>Admin & WhatsApp</Text>
                  </Button>

                  <Button 
                    variant={settingsSubSection === 'billing' ? 'solid' : 'ghost'}
                    color={settingsSubSection === 'billing' ? undefined : 'gray'}
                    onClick={() => setSettingsSubSection('billing')}
                    style={{
                      justifyContent: 'flex-start',
                      height: 48,
                      padding: '0 1.25rem',
                      borderRadius: 10,
                      background: settingsSubSection === 'billing' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      border: settingsSubSection === 'billing' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                      color: settingsSubSection === 'billing' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer'
                    }}
                  >
                    <CreditCard size={16} />
                    <Text size="2" weight={settingsSubSection === 'billing' ? 'bold' : 'medium'}>Mobile Money & Billing</Text>
                  </Button>

                  <Button 
                    variant={settingsSubSection === 'security' ? 'solid' : 'ghost'}
                    color={settingsSubSection === 'security' ? undefined : 'gray'}
                    onClick={() => setSettingsSubSection('security')}
                    style={{
                      justifyContent: 'flex-start',
                      height: 48,
                      padding: '0 1.25rem',
                      borderRadius: 10,
                      background: settingsSubSection === 'security' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      border: settingsSubSection === 'security' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                      color: settingsSubSection === 'security' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer'
                    }}
                  >
                    <KeyRound size={16} />
                    <Text size="2" weight={settingsSubSection === 'security' ? 'bold' : 'medium'}>Front Desk & Security</Text>
                  </Button>
                </Flex>

                {/* Status Box */}
                <Box mt="6" p="4" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 14 }}>
                  <Flex align="center" gap="2" mb="2">
                    <Sparkles size={14} color="#818cf8" />
                    <Text size="1" weight="bold" style={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Subscription Status
                    </Text>
                  </Flex>
                  <Text size="4" weight="bold" style={{ color: '#fff' }}>
                    GH₵ {totalMonthly}.00 <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: 400 }}>/ mo</Text>
                  </Text>
                  <Text size="1" mt="1" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>
                    Tier {tierBlock} ({hotelProfile.capacity} rooms) + {activeModules.length} add-ons
                  </Text>
                </Box>
              </Box>

              {/* Form Content Panel */}
              <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
                {/* SECTION 1: HOTEL & PROPERTY PROFILE */}
                {settingsSubSection === 'hotel' && (
                  <Box p={{ initial: '5', md: '7' }} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: 18 }}>
                    <Flex align="center" gap="3" mb="1">
                      <Box p="2" style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: 8 }}>
                        <Building2 size={20} color="#fff" />
                      </Box>
                      <Box>
                        <Heading size="4" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                          Hotel & Property Profile
                        </Heading>
                        <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                          Used on guest check-in slips, folio statements, and tax invoices.
                        </Text>
                      </Box>
                    </Flex>

                    <Separator size="4" my="5" style={{ background: 'rgba(255, 255, 255, 0.06)' }} />

                    <form onSubmit={handleSaveHotelProfile}>
                      <Flex direction="column" gap="5">
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Hotel / Property Name
                            </Text>
                            <TextField.Root 
                              size="3"
                              required
                              value={hotelProfile.name}
                              onChange={(e) => setHotelProfile(p => ({ ...p, name: e.target.value }))}
                              placeholder="e.g. Golden Palm Hotel & Suites"
                            />
                          </Box>

                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              City & Region
                            </Text>
                            <TextField.Root 
                              size="3"
                              required
                              value={hotelProfile.city}
                              onChange={(e) => setHotelProfile(p => ({ ...p, city: e.target.value }))}
                              placeholder="e.g. East Legon, Greater Accra"
                            >
                              <TextField.Slot>
                                <MapPin size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                              </TextField.Slot>
                            </TextField.Root>
                          </Box>
                        </Grid>

                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              GhanaPost GPS Digital Address
                            </Text>
                            <TextField.Root 
                              size="3"
                              value={hotelProfile.digitalAddress}
                              onChange={(e) => setHotelProfile(p => ({ ...p, digitalAddress: e.target.value }))}
                              placeholder="e.g. GA-183-9021"
                            />
                          </Box>

                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Total Room Capacity
                            </Text>
                            <Flex align="center" gap="3">
                              <TextField.Root 
                                size="3"
                                type="number"
                                min={1}
                                max={500}
                                style={{ width: 120 }}
                                value={hotelProfile.capacity}
                                onChange={(e) => setHotelProfile(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
                              />
                              <Badge size="2" variant="soft" color="gray" style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#fff' }}>
                                Tier {tierBlock} ({tierBlock * 20} Room Block)
                              </Badge>
                            </Flex>
                            <Text size="1" mt="1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                              Base front desk: GH₵ {basePrice}.00/mo
                            </Text>
                          </Box>
                        </Grid>

                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Reception Phone Number
                            </Text>
                            <TextField.Root 
                              size="3"
                              type="tel"
                              value={hotelProfile.phone}
                              onChange={(e) => setHotelProfile(p => ({ ...p, phone: e.target.value }))}
                              placeholder="e.g. +233 30 212 3456"
                            >
                              <TextField.Slot>
                                <Phone size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                              </TextField.Slot>
                            </TextField.Root>
                          </Box>

                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Front Desk Official Email
                            </Text>
                            <TextField.Root 
                              size="3"
                              type="email"
                              value={hotelProfile.email}
                              onChange={(e) => setHotelProfile(p => ({ ...p, email: e.target.value }))}
                              placeholder="frontdesk@hotel.com"
                            >
                              <TextField.Slot>
                                <Mail size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                              </TextField.Slot>
                            </TextField.Root>
                          </Box>
                        </Grid>

                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Standard Check-in Time
                            </Text>
                            <TextField.Root 
                              size="3"
                              type="time"
                              value={hotelProfile.checkInTime}
                              onChange={(e) => setHotelProfile(p => ({ ...p, checkInTime: e.target.value }))}
                            >
                              <TextField.Slot>
                                <Clock size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                              </TextField.Slot>
                            </TextField.Root>
                          </Box>

                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Standard Check-out Time
                            </Text>
                            <TextField.Root 
                              size="3"
                              type="time"
                              value={hotelProfile.checkOutTime}
                              onChange={(e) => setHotelProfile(p => ({ ...p, checkOutTime: e.target.value }))}
                            >
                              <TextField.Slot>
                                <Clock size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                              </TextField.Slot>
                            </TextField.Root>
                          </Box>
                        </Grid>

                        <Flex justify="end" mt="4">
                          <Button 
                            type="submit"
                            size="3" 
                            style={{ 
                              cursor: 'pointer',
                              background: '#fff',
                              color: '#080a0f',
                              fontWeight: 600,
                              borderRadius: 8,
                              height: 44,
                              padding: '0 1.5rem'
                            }}
                          >
                            <Save size={16} />
                            <span>Save Hotel Profile</span>
                          </Button>
                        </Flex>
                      </Flex>
                    </form>
                  </Box>
                )}

                {/* SECTION 2: ADMINISTRATOR & WHATSAPP ALERTS */}
                {settingsSubSection === 'admin' && (
                  <Box p={{ initial: '5', md: '7' }} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: 18 }}>
                    <Flex align="center" gap="3" mb="1">
                      <Box p="2" style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: 8 }}>
                        <UserCheck size={20} color="#fff" />
                      </Box>
                      <Box>
                        <Heading size="4" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                          Administrator Contact & WhatsApp Alerts
                        </Heading>
                        <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                          Daily audit reports, revenue digests, and shift summaries will be delivered to this owner contact.
                        </Text>
                      </Box>
                    </Flex>

                    <Separator size="4" my="5" style={{ background: 'rgba(255, 255, 255, 0.06)' }} />

                    <form onSubmit={handleSaveAdminSettings}>
                      <Flex direction="column" gap="5">
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Manager / Owner Full Name
                            </Text>
                            <TextField.Root 
                              size="3"
                              required
                              value={adminSettings.adminName}
                              onChange={(e) => setAdminSettings(p => ({ ...p, adminName: e.target.value }))}
                              placeholder="e.g. Kwabena Darko"
                            >
                              <TextField.Slot>
                                <User size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                              </TextField.Slot>
                            </TextField.Root>
                          </Box>

                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Role / Job Title
                            </Text>
                            <TextField.Root 
                              size="3"
                              value={adminSettings.adminRole}
                              onChange={(e) => setAdminSettings(p => ({ ...p, adminRole: e.target.value }))}
                              placeholder="e.g. General Manager / Owner"
                            />
                          </Box>
                        </Grid>

                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              WhatsApp Mobile Number
                            </Text>
                            <TextField.Root 
                              size="3"
                              type="tel"
                              required
                              value={adminSettings.adminPhone}
                              onChange={(e) => setAdminSettings(p => ({ ...p, adminPhone: e.target.value }))}
                              placeholder="024 123 4567"
                            >
                              <TextField.Slot>
                                <Smartphone size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                              </TextField.Slot>
                            </TextField.Root>
                            <Text size="1" mt="1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                              Ghanaian format (MTN, Telecel, AT). Automated summaries dispatch here.
                            </Text>
                          </Box>

                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Administrative Email
                            </Text>
                            <TextField.Root 
                              size="3"
                              type="email"
                              value={adminSettings.adminEmail}
                              onChange={(e) => setAdminSettings(p => ({ ...p, adminEmail: e.target.value }))}
                              placeholder="manager@hotel.com"
                            >
                              <TextField.Slot>
                                <Mail size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                              </TextField.Slot>
                            </TextField.Root>
                          </Box>
                        </Grid>

                        {/* WhatsApp Notification Toggles */}
                        <Box mt="2" p="4" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 12 }}>
                          <Text size="2" weight="bold" mb="3" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Bell size={15} color="#818cf8" />
                            <span>Automated WhatsApp Intelligence Feeds</span>
                          </Text>

                          <Flex direction="column" gap="4">
                            <Flex justify="between" align="center">
                              <Box style={{ maxWidth: '85%' }}>
                                <Text size="2" weight="medium" style={{ color: '#fff' }} as="p">
                                  Daily Night Audit Digest (23:30 GMT)
                                </Text>
                                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                                  Automated breakdown of final occupancy %, cash drawer total, and MoMo deposits sent to your WhatsApp.
                                </Text>
                              </Box>
                              <Switch 
                                checked={adminSettings.whatsappDailyAudit}
                                onCheckedChange={(val) => setAdminSettings(p => ({ ...p, whatsappDailyAudit: val }))}
                              />
                            </Flex>

                            <Separator size="4" style={{ background: 'rgba(255, 255, 255, 0.04)' }} />

                            <Flex justify="between" align="center">
                              <Box style={{ maxWidth: '85%' }}>
                                <Text size="2" weight="medium" style={{ color: '#fff' }} as="p">
                                  Shift Handover & Cash Balancing
                                </Text>
                                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                                  Receive an instant ping whenever receptionists change shifts and balance their cash drawer.
                                </Text>
                              </Box>
                              <Switch 
                                checked={adminSettings.whatsappShiftAlerts}
                                onCheckedChange={(val) => setAdminSettings(p => ({ ...p, whatsappShiftAlerts: val }))}
                              />
                            </Flex>

                            <Separator size="4" style={{ background: 'rgba(255, 255, 255, 0.04)' }} />

                            <Flex justify="between" align="center">
                              <Box style={{ maxWidth: '85%' }}>
                                <Text size="2" weight="medium" style={{ color: '#fff' }} as="p">
                                  Room Discrepancy & Cleaning Alerts
                                </Text>
                                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                                  Immediate alert if a room status changes to dirty or vacant without a logged guest checkout.
                                </Text>
                              </Box>
                              <Switch 
                                checked={adminSettings.whatsappDiscrepancies}
                                onCheckedChange={(val) => setAdminSettings(p => ({ ...p, whatsappDiscrepancies: val }))}
                              />
                            </Flex>
                          </Flex>
                        </Box>

                        <Flex justify="end" mt="4">
                          <Button 
                            type="submit"
                            size="3" 
                            style={{ 
                              cursor: 'pointer',
                              background: '#fff',
                              color: '#080a0f',
                              fontWeight: 600,
                              borderRadius: 8,
                              height: 44,
                              padding: '0 1.5rem'
                            }}
                          >
                            <Save size={16} />
                            <span>Save Admin Details</span>
                          </Button>
                        </Flex>
                      </Flex>
                    </form>
                  </Box>
                )}

                {/* SECTION 3: MOBILE MONEY & BILLING */}
                {settingsSubSection === 'billing' && (
                  <Box p={{ initial: '5', md: '7' }} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: 18 }}>
                    <Flex align="center" gap="3" mb="1">
                      <Box p="2" style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: 8 }}>
                        <CreditCard size={20} color="#fff" />
                      </Box>
                      <Box>
                        <Heading size="4" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                          Mobile Money & Subscription Billing
                        </Heading>
                        <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                          Hospware is billed monthly in Ghanaian Cedis (GH₵). No bank cards or foreign currency required.
                        </Text>
                      </Box>
                    </Flex>

                    <Separator size="4" my="5" style={{ background: 'rgba(255, 255, 255, 0.06)' }} />

                    <form onSubmit={handleSaveBillingSettings}>
                      <Flex direction="column" gap="5">
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Mobile Money Network Provider
                            </Text>
                            <Select.Root 
                              value={adminSettings.momoNetwork} 
                              onValueChange={(val) => setAdminSettings(p => ({ ...p, momoNetwork: val }))}
                              size="3"
                            >
                              <Select.Trigger style={{ width: '100%' }} />
                              <Select.Content>
                                <Select.Item value="MTN Mobile Money">MTN Mobile Money</Select.Item>
                                <Select.Item value="Telecel Cash">Telecel Cash</Select.Item>
                                <Select.Item value="AT Money">AT Money</Select.Item>
                              </Select.Content>
                            </Select.Root>
                          </Box>

                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Registered MoMo Wallet Number
                            </Text>
                            <TextField.Root 
                              size="3"
                              type="tel"
                              required
                              value={adminSettings.momoNumber}
                              onChange={(e) => setAdminSettings(p => ({ ...p, momoNumber: e.target.value }))}
                              placeholder="024 123 4567"
                            >
                              <TextField.Slot>
                                <Smartphone size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                              </TextField.Slot>
                            </TextField.Root>
                          </Box>
                        </Grid>

                        <Box>
                          <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Registered Name on Mobile Money Wallet
                          </Text>
                          <TextField.Root 
                            size="3"
                            value={adminSettings.momoAccountName}
                            onChange={(e) => setAdminSettings(p => ({ ...p, momoAccountName: e.target.value }))}
                            placeholder="e.g. Kwabena Darko / Golden Palm Hotel"
                          />
                        </Box>

                        {/* Live Billing Statement Breakdown */}
                        <Box p="5" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14 }}>
                          <Flex justify="between" align="baseline" mb="3">
                            <Text size="2" weight="bold" style={{ color: '#fff' }}>
                              Monthly Subscription Statement
                            </Text>
                            <Badge size="1" color="green" variant="soft">
                              Active Tier {tierBlock}
                            </Badge>
                          </Flex>

                          <Flex justify="between" py="2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Base Front Desk Software ({hotelProfile.capacity} Rooms, {tierBlock} × 20 block)
                            </Text>
                            <Text size="2" weight="bold" style={{ color: '#fff' }}>
                              GH₵ {basePrice}.00
                            </Text>
                          </Flex>

                          <Flex justify="between" py="2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Active Add-on Modules ({activeModules.length} selected)
                            </Text>
                            <Text size="2" weight="bold" style={{ color: '#fff' }}>
                              GH₵ {modulesPrice}.00
                            </Text>
                          </Flex>

                          <Flex justify="between" pt="3" align="baseline">
                            <Box>
                              <Text size="3" weight="bold" style={{ color: '#fff' }}>
                                Consolidated Monthly Total
                              </Text>
                              <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>
                                Invoiced automatically on the 1st of every month
                              </Text>
                            </Box>
                            <Text size="5" weight="bold" style={{ color: '#fff' }}>
                              GH₵ {totalMonthly}.00 <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>/ mo</Text>
                            </Text>
                          </Flex>
                        </Box>

                        <Flex justify="between" align="center" p="4" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 12 }}>
                          <Box style={{ maxWidth: '85%' }}>
                            <Text size="2" weight="medium" style={{ color: '#fff' }} as="p">
                              Authorize 1st-of-Month USSD Debit Prompt
                            </Text>
                            <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                              Hospware will automatically push the payment approval prompt to your phone on the 1st of every billing month.
                            </Text>
                          </Box>
                          <Switch 
                            checked={adminSettings.autoDebitPrompt}
                            onCheckedChange={(val) => setAdminSettings(p => ({ ...p, autoDebitPrompt: val }))}
                          />
                        </Flex>

                        <Flex justify="end" mt="4">
                          <Button 
                            type="submit"
                            size="3" 
                            style={{ 
                              cursor: 'pointer',
                              background: '#fff',
                              color: '#080a0f',
                              fontWeight: 600,
                              borderRadius: 8,
                              height: 44,
                              padding: '0 1.5rem'
                            }}
                          >
                            <Save size={16} />
                            <span>Save Billing Details</span>
                          </Button>
                        </Flex>
                      </Flex>
                    </form>
                  </Box>
                )}

                {/* SECTION 4: FRONT DESK & TERMINAL SECURITY */}
                {settingsSubSection === 'security' && (
                  <Box p={{ initial: '5', md: '7' }} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: 18 }}>
                    <Flex align="center" gap="3" mb="1">
                      <Box p="2" style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: 8 }}>
                        <KeyRound size={20} color="#fff" />
                      </Box>
                      <Box>
                        <Heading size="4" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                          Front Desk & Terminal Security
                        </Heading>
                        <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                          Supervisor override codes and workstation session timeout configurations.
                        </Text>
                      </Box>
                    </Flex>

                    <Separator size="4" my="5" style={{ background: 'rgba(255, 255, 255, 0.06)' }} />

                    <form onSubmit={handleSaveSecuritySettings}>
                      <Flex direction="column" gap="5">
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Front Desk Supervisor Override PIN
                            </Text>
                            <TextField.Root 
                              size="3"
                              required
                              value={adminSettings.receptionPin}
                              onChange={(e) => setAdminSettings(p => ({ ...p, receptionPin: e.target.value }))}
                              placeholder="4-digit PIN (e.g. 4821)"
                            >
                              <TextField.Slot>
                                <KeyRound size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                              </TextField.Slot>
                            </TextField.Root>
                            <Text size="1" mt="1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                              Required for cash drawer balance overrides, discounts, and room cancellations.
                            </Text>
                          </Box>

                          <Box>
                            <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Workstation Inactivity Auto-Lock
                            </Text>
                            <Select.Root 
                              value={adminSettings.autoLockMinutes} 
                              onValueChange={(val) => setAdminSettings(p => ({ ...p, autoLockMinutes: val }))}
                              size="3"
                            >
                              <Select.Trigger style={{ width: '100%' }} />
                              <Select.Content>
                                <Select.Item value="5">Lock after 5 minutes</Select.Item>
                                <Select.Item value="15">Lock after 15 minutes</Select.Item>
                                <Select.Item value="30">Lock after 30 minutes</Select.Item>
                                <Select.Item value="never">Never auto-lock</Select.Item>
                              </Select.Content>
                            </Select.Root>
                            <Text size="1" mt="1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                              Locks front desk screen when receptionists step away from the counter.
                            </Text>
                          </Box>
                        </Grid>

                        <Box p="4" style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 12 }}>
                          <Text size="2" weight="bold" mb="3" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={15} color="#818cf8" />
                            <span>Front Desk Cash & Audit Policies</span>
                          </Text>

                          <Flex direction="column" gap="4">
                            <Flex justify="between" align="center">
                              <Box style={{ maxWidth: '85%' }}>
                                <Text size="2" weight="medium" style={{ color: '#fff' }} as="p">
                                  Require Supervisor PIN on Shift Closing
                                </Text>
                                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                                  Receptionists cannot close their cash shift without supervisor sign-off and physical cash verification.
                                </Text>
                              </Box>
                              <Switch 
                                checked={adminSettings.shiftHandoverLock}
                                onCheckedChange={(val) => setAdminSettings(p => ({ ...p, shiftHandoverLock: val }))}
                              />
                            </Flex>

                            <Separator size="4" style={{ background: 'rgba(255, 255, 255, 0.04)' }} />

                            <Flex justify="between" align="center">
                              <Box style={{ maxWidth: '85%' }}>
                                <Text size="2" weight="medium" style={{ color: '#fff' }} as="p">
                                  Enforce PIN for Manual Price Overrides
                                </Text>
                                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                                  Front desk staff must enter the supervisor PIN if discounting room rates below rack rates.
                                </Text>
                              </Box>
                              <Switch 
                                checked={adminSettings.requirePinForOverride}
                                onCheckedChange={(val) => setAdminSettings(p => ({ ...p, requirePinForOverride: val }))}
                              />
                            </Flex>
                          </Flex>
                        </Box>

                        <Flex justify="end" mt="4">
                          <Button 
                            type="submit"
                            size="3" 
                            style={{ 
                              cursor: 'pointer',
                              background: '#fff',
                              color: '#080a0f',
                              fontWeight: 600,
                              borderRadius: 8,
                              height: 44,
                              padding: '0 1.5rem'
                            }}
                          >
                            <Save size={16} />
                            <span>Save Security Configuration</span>
                          </Button>
                        </Flex>
                      </Flex>
                    </form>
                  </Box>
                )}
              </Box>
            </Flex>
          </Tabs.Content>
        </Tabs.Root>

        {/* DIALOG 1: ACTIVATE MODULE */}
        <Dialog.Root open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
          <Dialog.Content size="3" style={{ maxWidth: 440, background: '#0e111a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 16 }}>
            {selectedModule && (
              <>
                <Dialog.Title style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                  Activate {selectedModule.name}
                </Dialog.Title>
                <Dialog.Description size="2" mb="4" style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6 }}>
                  {selectedModule.description}
                </Dialog.Description>

                <Flex direction="column" gap="3" mb="6">
                  <Box 
                    p="4" 
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      background: activationOption === 'trial' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.015)',
                      border: activationOption === 'trial' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                    onClick={() => setActivationOption('trial')}
                  >
                    <Flex align="start" gap="3">
                      <input 
                        type="radio" 
                        name="act-opt" 
                        checked={activationOption === 'trial'} 
                        onChange={() => setActivationOption('trial')} 
                        style={{ marginTop: 3 }}
                      />
                      <Box>
                        <Text size="2" weight="bold" style={{ color: '#fff' }}>7-Day Free Trial</Text>
                        <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }} as="p">
                          Zero payment today. Unlocks immediately on all workstations.
                        </Text>
                      </Box>
                    </Flex>
                  </Box>

                  <Box 
                    p="4" 
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      background: activationOption === 'immediate' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.015)',
                      border: activationOption === 'immediate' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                    onClick={() => setActivationOption('immediate')}
                  >
                    <Flex align="start" gap="3">
                      <input 
                        type="radio" 
                        name="act-opt" 
                        checked={activationOption === 'immediate'} 
                        onChange={() => setActivationOption('immediate')} 
                        style={{ marginTop: 3 }}
                      />
                      <Box>
                        <Text size="2" weight="bold" style={{ color: '#fff' }}>MoMo Consolidation</Text>
                        <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }} as="p">
                          +GH₵ {selectedModule.pricePerBlock * tierBlock}/mo added to your next 1st-of-month invoice.
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                </Flex>

                <Flex gap="3" justify="end">
                  <Dialog.Close>
                    <Button variant="ghost" color="gray">Cancel</Button>
                  </Dialog.Close>
                  <Button 
                    onClick={handleConfirmActivation}
                    style={{ background: '#fff', color: '#080a0f', fontWeight: 600, borderRadius: 8 }}
                  >
                    Confirm & Unlock
                  </Button>
                </Flex>
              </>
            )}
          </Dialog.Content>
        </Dialog.Root>

        {/* DIALOG 2: DEACTIVATE MODULE */}
        <Dialog.Root open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
          <Dialog.Content size="3" style={{ maxWidth: 400, background: '#0e111a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 16 }}>
            {selectedModule && (
              <>
                <Dialog.Title style={{ color: '#fff' }}>Deactivate {selectedModule.name}?</Dialog.Title>
                <Dialog.Description size="2" mb="4" style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6 }}>
                  This will lock the feature on lobby workstations at the end of your billing cycle.
                </Dialog.Description>

                <Box p="3" mb="5" style={{ background: 'rgba(239, 68, 68, 0.08)', borderRadius: 8 }}>
                  <Text size="1" style={{ color: '#f87171' }}>
                    Monthly bill will be reduced by GH₵ {selectedModule.pricePerBlock * tierBlock}.00.
                  </Text>
                </Box>

                <Flex gap="3" justify="end">
                  <Dialog.Close>
                    <Button variant="ghost" color="gray">Keep Active</Button>
                  </Dialog.Close>
                  <Button color="red" variant="soft" onClick={handleConfirmDeactivation}>
                    Confirm Deactivation
                  </Button>
                </Flex>
              </>
            )}
          </Dialog.Content>
        </Dialog.Root>

        {/* UNIFIED DIALOG: ADD ROOM(S) WITH SMART FILL SLIDER */}
        <Dialog.Root open={addRoomsDialogOpen} onOpenChange={setAddRoomsDialogOpen}>
          <Dialog.Content size="3" style={{ maxWidth: 520, background: '#0e111a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 16 }}>
            {(() => {
              const names = parseAndGenerateRoomNames(addRoomForm.name, addRoomForm.count);
              const existingNumbers = new Set(rooms.map(r => r.number.toLowerCase()));
              const hasConflict = names.some(n => existingNumbers.has(n.toLowerCase()));
              const projectedCount = rooms.length + names.length;
              const willExceedTier = projectedCount > maxAllowedRooms;

              return (
                <>
                  <Flex align="center" gap="3" mb="1">
                    <Box p="2" style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: 10 }}>
                      <Plus size={20} color="#fff" />
                    </Box>
                    <Box>
                      <Dialog.Title style={{ color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                        Add Room(s)
                      </Dialog.Title>
                      <Dialog.Description size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                        Enter room details. Use the smart fill slider to auto-generate sequential rooms.
                      </Dialog.Description>
                    </Box>
                  </Flex>

                  <Separator size="4" my="4" style={{ background: 'rgba(255, 255, 255, 0.06)' }} />

                  <form onSubmit={handleAddRoomsSubmit}>
                    <Flex direction="column" gap="4">
                      {/* Room Name or Starting Number */}
                      <Box>
                        <Flex justify="between" align="baseline" mb="2">
                          <Text size="2" weight="medium" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Room Name / Starting Number
                          </Text>
                          <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                            e.g. 101, Villa A, Suite 1
                          </Text>
                        </Flex>
                        <TextField.Root 
                          size="3"
                          required
                          value={addRoomForm.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Auto-derive suggested floor if value starts with/contains 3-digit floor number
                            const numMatch = val.match(/\d+/);
                            let newFloor = addRoomForm.floor;
                            if (numMatch) {
                              const n = parseInt(numMatch[0], 10);
                              if (n >= 100 && n <= 999) {
                                newFloor = Math.floor(n / 100);
                              }
                            }
                            setAddRoomForm(p => ({ ...p, name: val, floor: newFloor }));
                          }}
                          placeholder="e.g. 101 or Villa A"
                        />
                      </Box>

                      {/* Smart Fill Slider */}
                      <Box p="3" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 12 }}>
                        <Flex justify="between" align="center" mb="2">
                          <Flex align="center" gap="2">
                            <Wand2 size={15} color="#818cf8" />
                            <Text size="2" weight="medium" style={{ color: '#fff' }}>
                              Smart Fill Slider
                            </Text>
                          </Flex>
                          <Badge size="1" variant="surface" color="indigo" style={{ fontWeight: 600 }}>
                            {addRoomForm.count} {addRoomForm.count === 1 ? 'room' : 'rooms'}
                          </Badge>
                        </Flex>

                        <Box py="2">
                          <Slider 
                            min={1} 
                            max={20} 
                            step={1} 
                            value={[addRoomForm.count]} 
                            onValueChange={([val]) => setAddRoomForm(p => ({ ...p, count: val }))} 
                          />
                        </Box>

                        <Flex justify="between" align="center" mt="2">
                          <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                            Quick pick:
                          </Text>
                          <Flex gap="1">
                            {[1, 2, 5, 10, 15, 20].map(cnt => (
                              <Button
                                key={cnt}
                                type="button"
                                size="1"
                                variant={addRoomForm.count === cnt ? 'solid' : 'ghost'}
                                color="gray"
                                onClick={() => setAddRoomForm(p => ({ ...p, count: cnt }))}
                                style={{
                                  cursor: 'pointer',
                                  padding: '2px 8px',
                                  minWidth: 26,
                                  background: addRoomForm.count === cnt ? '#fff' : 'transparent',
                                  color: addRoomForm.count === cnt ? '#080a0f' : 'rgba(255, 255, 255, 0.6)',
                                  fontWeight: addRoomForm.count === cnt ? 600 : 400
                                }}
                              >
                                {cnt}
                              </Button>
                            ))}
                          </Flex>
                        </Flex>
                      </Box>

                      {/* Room Type & Floor */}
                      <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                        <Box>
                          <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Room Type
                          </Text>
                          <Select.Root 
                            value={addRoomForm.type}
                            onValueChange={(val) => setAddRoomForm(p => ({ ...p, type: val }))}
                            size="3"
                          >
                            <Select.Trigger style={{ width: '100%' }} />
                            <Select.Content>
                              <Select.Item value="Standard King">Standard King</Select.Item>
                              <Select.Item value="Deluxe Queen">Deluxe Queen</Select.Item>
                              <Select.Item value="Standard Double">Standard Double</Select.Item>
                              <Select.Item value="Executive Suite">Executive Suite</Select.Item>
                              <Select.Item value="Presidential Suite">Presidential Suite</Select.Item>
                              <Select.Item value="Studio Single">Studio Single</Select.Item>
                            </Select.Content>
                          </Select.Root>
                        </Box>

                        <Box>
                          <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Floor
                          </Text>
                          <TextField.Root 
                            size="3"
                            type="number"
                            min={0}
                            max={50}
                            required
                            value={addRoomForm.floor}
                            onChange={(e) => setAddRoomForm(p => ({ ...p, floor: parseInt(e.target.value) || 1 }))}
                          />
                        </Box>
                      </Grid>

                      {/* Nightly Rate */}
                      <Box>
                        <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          Nightly Rate (GH₵)
                        </Text>
                        <TextField.Root 
                          size="3"
                          type="number"
                          min={50}
                          required
                          value={addRoomForm.rate}
                          onChange={(e) => setAddRoomForm(p => ({ ...p, rate: parseInt(e.target.value) || 100 }))}
                          placeholder="e.g. 350"
                        />
                      </Box>

                      {/* Smart Regex Preview */}
                      <Box p="3" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: 10 }}>
                        <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block' }}>
                          {addRoomForm.count === 1 ? (
                            <>Adding: <strong style={{ color: '#fff' }}>{names[0] || '—'}</strong></>
                          ) : (
                            <>
                              Creating <strong style={{ color: '#fff' }}>{names.length} rooms</strong>: <strong style={{ color: '#fff' }}>{names[0]}</strong> → <strong style={{ color: '#fff' }}>{names[names.length - 1]}</strong>
                            </>
                          )}
                        </Text>

                        {/* Sequence Badges Preview for Multi-room batches */}
                        {names.length > 1 && (
                          <Flex wrap="wrap" gap="1" mt="2" pt="2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            {names.slice(0, 8).map(name => {
                              const exists = existingNumbers.has(name.toLowerCase());
                              return (
                                <Badge 
                                  key={name} 
                                  size="1" 
                                  color={exists ? 'amber' : 'gray'} 
                                  variant="surface"
                                  style={{ fontSize: '0.72rem' }}
                                >
                                  {name}{exists ? ' (exists)' : ''}
                                </Badge>
                              );
                            })}
                            {names.length > 8 && (
                              <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)', alignSelf: 'center', marginLeft: 4 }}>
                                +{names.length - 8} more
                              </Text>
                            )}
                          </Flex>
                        )}

                        {hasConflict && (
                          <Text size="1" mt="2" style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertCircle size={12} />
                            <span>Some room numbers already exist in inventory and will be skipped.</span>
                          </Text>
                        )}

                        {willExceedTier && (
                          <Text size="1" mt="2" style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertCircle size={12} />
                            <span>Exceeds Tier {tierBlock} capacity ({maxAllowedRooms} rooms). You will be prompted to upgrade to Tier {Math.ceil(projectedCount / 20)}.</span>
                          </Text>
                        )}
                      </Box>

                      {/* Dialog Action Buttons */}
                      <Flex gap="3" justify="end" mt="2">
                        <Dialog.Close>
                          <Button variant="ghost" color="gray">Cancel</Button>
                        </Dialog.Close>
                        <Button 
                          type="submit"
                          style={{ background: '#fff', color: '#080a0f', fontWeight: 600, borderRadius: 8, cursor: 'pointer' }}
                        >
                          <Plus size={15} />
                          <span>Add {addRoomForm.count === 1 ? 'Room' : `${addRoomForm.count} Rooms`}</span>
                        </Button>
                      </Flex>
                    </Flex>
                  </form>
                </>
              );
            })()}
          </Dialog.Content>
        </Dialog.Root>

        {/* DIALOG 5: EDIT ROOM */}
        <Dialog.Root open={editRoomDialogOpen} onOpenChange={setEditRoomDialogOpen}>
          <Dialog.Content size="3" style={{ maxWidth: 460, background: '#0e111a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 16 }}>
            {roomToEdit && (
              <>
                <Flex align="center" gap="3" mb="1">
                  <Box p="2" style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: 10 }}>
                    <Pencil size={20} color="#fff" />
                  </Box>
                  <Box>
                    <Dialog.Title style={{ color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                      Edit Room {roomToEdit.number}
                    </Dialog.Title>
                    <Dialog.Description size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                      Update room category, pricing, or assigned floor.
                    </Dialog.Description>
                  </Box>
                </Flex>

                <Separator size="4" my="4" style={{ background: 'rgba(255, 255, 255, 0.06)' }} />

                <form onSubmit={handleSaveEditRoom}>
                  <Flex direction="column" gap="4">
                    <Box>
                      <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        Room Name / Number
                      </Text>
                      <TextField.Root 
                        size="3"
                        required
                        value={roomToEdit.number}
                        onChange={(e) => setRoomToEdit({ ...roomToEdit, number: e.target.value })}
                      />
                    </Box>

                    <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                      <Box>
                        <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          Room Type
                        </Text>
                        <Select.Root 
                          value={roomToEdit.type}
                          onValueChange={(val) => setRoomToEdit({ ...roomToEdit, type: val })}
                          size="3"
                        >
                          <Select.Trigger style={{ width: '100%' }} />
                          <Select.Content>
                            <Select.Item value="Standard King">Standard King</Select.Item>
                            <Select.Item value="Deluxe Queen">Deluxe Queen</Select.Item>
                            <Select.Item value="Standard Double">Standard Double</Select.Item>
                            <Select.Item value="Executive Suite">Executive Suite</Select.Item>
                            <Select.Item value="Presidential Suite">Presidential Suite</Select.Item>
                            <Select.Item value="Studio Single">Studio Single</Select.Item>
                          </Select.Content>
                        </Select.Root>
                      </Box>

                      <Box>
                        <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          Floor
                        </Text>
                        <TextField.Root 
                          size="3"
                          type="number"
                          required
                          value={roomToEdit.floor}
                          onChange={(e) => setRoomToEdit({ ...roomToEdit, floor: parseInt(e.target.value) || 1 })}
                        />
                      </Box>
                    </Grid>

                    <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                      <Box>
                        <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          Nightly Rate (GH₵)
                        </Text>
                        <TextField.Root 
                          size="3"
                          type="number"
                          required
                          value={roomToEdit.rate}
                          onChange={(e) => setRoomToEdit({ ...roomToEdit, rate: parseInt(e.target.value) || 100 })}
                        />
                      </Box>

                      <Box>
                        <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          Housekeeping Status
                        </Text>
                        <Select.Root 
                          value={roomToEdit.status}
                          onValueChange={(val: PortalRoom['status']) => setRoomToEdit({ ...roomToEdit, status: val })}
                          size="3"
                        >
                          <Select.Trigger style={{ width: '100%' }} />
                          <Select.Content>
                            <Select.Item value="available">Available</Select.Item>
                            <Select.Item value="reserved">Reserved</Select.Item>
                            <Select.Item value="occupied">Occupied</Select.Item>
                            <Select.Item value="dirty">Dirty</Select.Item>
                            <Select.Item value="cleaning">Cleaning</Select.Item>
                          </Select.Content>
                        </Select.Root>
                      </Box>
                    </Grid>

                    <Flex gap="3" justify="end" mt="2">
                      <Dialog.Close>
                        <Button variant="ghost" color="gray">Cancel</Button>
                      </Dialog.Close>
                      <Button 
                        type="submit"
                        style={{ background: '#fff', color: '#080a0f', fontWeight: 600, borderRadius: 8, cursor: 'pointer' }}
                      >
                        <span>Save Changes</span>
                      </Button>
                    </Flex>
                  </Flex>
                </form>
              </>
            )}
          </Dialog.Content>
        </Dialog.Root>

        {/* DIALOG 6: PACKAGE UPGRADE REQUIRED */}
        <Dialog.Root open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <Dialog.Content size="3" style={{ maxWidth: 480, background: '#0e111a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 16 }}>
            <Flex align="center" gap="3" mb="2">
              <Box p="2" style={{ background: 'rgba(99, 102, 241, 0.15)', borderRadius: 10 }}>
                <TrendingUp size={24} color="#818cf8" />
              </Box>
              <Box>
                <Dialog.Title style={{ color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                  Upgrade Package Capacity
                </Dialog.Title>
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                  Tier {tierBlock} Package Limit: {maxAllowedRooms} Rooms
                </Text>
              </Box>
            </Flex>

            <Dialog.Description size="2" mb="4" style={{ color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6 }}>
              {upgradeReason || `Your property has reached its limit of ${maxAllowedRooms} rooms. To create additional rooms, upgrade to Tier ${upgradeTargetTier}.`}
            </Dialog.Description>

            {/* Pricing Transparency Card */}
            <Box p="4" mb="5" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: 12 }}>
              <Flex justify="between" py="2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Current Tier {tierBlock} Plan ({maxAllowedRooms} Rooms)</Text>
                <Text size="2" style={{ color: '#fff' }}>GH₵ {basePrice}.00/mo</Text>
              </Flex>
              <Flex justify="between" py="2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Text size="2" style={{ color: '#818cf8', fontWeight: 600 }}>New Tier {upgradeTargetTier} Plan (Up to {upgradeTargetTier * 20} Rooms)</Text>
                <Text size="2" weight="bold" style={{ color: '#818cf8' }}>GH₵ {upgradeTargetTier * 200}.00/mo</Text>
              </Flex>
              {activeModules.length > 0 && (
                <Flex justify="between" py="2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Active Modules ({activeModules.length}) Adjustment</Text>
                  <Text size="2" style={{ color: '#fff' }}>GH₵ {calculateModulesPrice(upgradeTargetTier * 20, activeModules)}.00/mo</Text>
                </Flex>
              )}
              <Flex justify="between" pt="3" align="baseline">
                <Box>
                  <Text size="2" weight="bold" style={{ color: '#fff' }}>New Total Monthly Commitment</Text>
                  <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Billed via MoMo on 1st of month</Text>
                </Box>
                <Text size="5" weight="bold" style={{ color: '#fff' }}>
                  GH₵ {calculateTotalMonthly(upgradeTargetTier * 20, activeModules)}.00 <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: 400 }}>/ mo</Text>
                </Text>
              </Flex>
            </Box>

            <Flex gap="3" justify="end">
              <Dialog.Close>
                <Button variant="ghost" color="gray" onClick={() => setUpgradeDialogOpen(false)}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button 
                onClick={handleConfirmUpgradeAndAdd}
                style={{ background: '#fff', color: '#080a0f', fontWeight: 600, borderRadius: 8, cursor: 'pointer' }}
              >
                <Sparkles size={15} />
                <span>Upgrade to Tier {upgradeTargetTier} & Create Rooms</span>
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Box>
    </Container>
  );
}
