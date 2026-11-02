export interface AddonModule {
  id: string;
  name: string;
  category: 'operations' | 'pos' | 'automation' | 'security';
  description: string;
  pricePerBlock: number; // In GHS (GH₵) per 20 rooms block per month
  image: string;
  badge?: string;
}

export const AVAILABLE_MODULES: AddonModule[] = [
  {
    id: 'bar_pos',
    name: 'Restaurant & Bar POS',
    category: 'pos',
    description: 'Direct kitchen and bar order pad with automatic folio charge-to-room billing for dining guests.',
    pricePerBlock: 100,
    image: '/images/modules/bar_pos.jpg',
    badge: 'Most Popular'
  },
  {
    id: 'sms_alerts',
    name: 'WhatsApp & SMS Alerts',
    category: 'automation',
    description: 'Instant MoMo check-in confirmations, automated guest receipts, and nightly audit alerts to the owner.',
    pricePerBlock: 50,
    image: '/images/modules/sms_alerts.jpg',
    badge: 'Essential'
  },
  {
    id: 'housekeeping',
    name: 'Mobile Housekeeping',
    category: 'operations',
    description: 'Floor attendants inspect and mark rooms clean or maintenance-ready in real-time on any smartphone.',
    pricePerBlock: 50,
    image: '/images/modules/housekeeping.jpg'
  },
  {
    id: 'staff_shifts',
    name: 'Staff Shifts & PIN Audits',
    category: 'security',
    description: 'Individual receptionist PIN authorization, cash drawer shift handovers, and audit tracking.',
    pricePerBlock: 50,
    image: '/images/modules/staff_shifts.jpg'
  }
];

export const calculateTierBlock = (rooms: number) => Math.max(1, Math.ceil(rooms / 20));

export const calculateBasePrice = (rooms: number) => calculateTierBlock(rooms) * 200;

export const calculateModulesPrice = (rooms: number, selectedModules: string[]) => {
  const block = calculateTierBlock(rooms);
  return selectedModules.reduce((acc, modId) => {
    const found = AVAILABLE_MODULES.find(m => m.id === modId);
    return acc + (found ? found.pricePerBlock * block : 0);
  }, 0);
};

export const calculateTotalMonthly = (rooms: number, selectedModules: string[]) => {
  return calculateBasePrice(rooms) + calculateModulesPrice(rooms, selectedModules);
};

export const calculateTotalAnnual = (rooms: number, selectedModules: string[]) => {
  const monthly = calculateTotalMonthly(rooms, selectedModules);
  return Math.round(monthly * 12 * 0.8); // 20% discount on annual
};
