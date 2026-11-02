'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Container, 
  Heading, 
  Text, 
  Flex, 
  Grid, 
  Button, 
  Box, 
  Slider,
  SegmentedControl
} from '@radix-ui/themes';
import { 
  Check, 
  ArrowRight, 
  UtensilsCrossed,
  Bell,
  BedDouble,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import { 
  AVAILABLE_MODULES, 
  calculateTierBlock, 
  calculateBasePrice, 
  calculateModulesPrice, 
  calculateTotalMonthly, 
  calculateTotalAnnual
} from '@/lib/pricing';

export default function PricingPage() {
  const [roomsCount, setRoomsCount] = useState<number>(18);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedModules, setSelectedModules] = useState<string[]>(['bar_pos', 'sms_alerts']);

  const tierBlock = calculateTierBlock(roomsCount);
  const basePrice = calculateBasePrice(roomsCount);
  const modulesPrice = calculateModulesPrice(roomsCount, selectedModules);
  const totalMonthly = calculateTotalMonthly(roomsCount, selectedModules);
  const totalAnnual = calculateTotalAnnual(roomsCount, selectedModules);

  const toggleModule = (id: string) => {
    setSelectedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'bar_pos': return <UtensilsCrossed size={18} />;
      case 'sms_alerts': return <Bell size={18} />;
      case 'housekeeping': return <BedDouble size={18} />;
      case 'staff_shifts': return <Layers size={18} />;
      default: return null;
    }
  };

  return (
    <Container size="4" px={{ initial: '4', md: '6' }}>
      {/* Header Section with Large Space */}
      <Box style={{ paddingTop: '7rem', paddingBottom: '6rem', textAlign: 'center' }}>
        <Flex direction="column" align="center" gap="4">
          <Text 
            size="2" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.45)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em', 
              fontWeight: 600 
            }}
          >
            Transparent Pricing
          </Text>

          <Heading 
            size={{ initial: '8', md: '9' }} 
            weight="bold" 
            style={{ 
              maxWidth: 780, 
              letterSpacing: '-0.04em', 
              lineHeight: 1.15,
              color: '#fff'
            }}
          >
            Scale by room capacity. <br />
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Pay in Ghanaian Cedis.
            </span>
          </Heading>

          <Text 
            size="3" 
            style={{ 
              maxWidth: 580, 
              lineHeight: 1.7, 
              color: 'rgba(255, 255, 255, 0.5)' 
            }}
          >
            Base plan starts at GH₵ 200/month per 20 rooms for full front desk & owner reports. 
            Stack add-ons on demand via Mobile Money.
          </Text>

          {/* Minimalist Cadence Switcher */}
          <Box mt="4">
            <SegmentedControl.Root 
              value={billingCycle} 
              onValueChange={(val) => setBillingCycle(val as any)}
              size="2"
            >
              <SegmentedControl.Item value="monthly">
                Monthly MoMo
              </SegmentedControl.Item>
              <SegmentedControl.Item value="annual">
                Annual Prepay (20% off)
              </SegmentedControl.Item>
            </SegmentedControl.Root>
          </Box>
        </Flex>
      </Box>

      {/* Interactive Room Slider Section */}
      <Box 
        p={{ initial: '5', md: '7' }} 
        mb="8" 
        style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid rgba(255, 255, 255, 0.06)', 
          borderRadius: 20 
        }}
      >
        <Flex justify="between" align="baseline" wrap="wrap" gap="4" mb="5">
          <Box>
            <Heading size="5" style={{ color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              Select Room Capacity
            </Heading>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
              Blocks of 20 rooms. Adjust to calculate exact subscription.
            </Text>
          </Box>
          <Box style={{ textAlign: 'right' }}>
            <Flex align="baseline" gap="2" justify="end">
              <Text size="8" weight="bold" style={{ color: '#fff', letterSpacing: '-0.03em' }}>{roomsCount}</Text>
              <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Rooms</Text>
            </Flex>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Tier {tierBlock} ({tierBlock * 20} Block Capacity)
            </Text>
          </Box>
        </Flex>

        <Box py="4">
          <Slider 
            value={[roomsCount]} 
            onValueChange={([val]) => setRoomsCount(val)}
            min={5}
            max={80}
            step={1}
            size="3"
            color="gray"
          />
        </Box>

        <Flex justify="between" mt="2">
          <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>5 Rooms</Text>
          <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>20 Rooms (Tier 1)</Text>
          <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>40 Rooms (Tier 2)</Text>
          <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>60 Rooms (Tier 3)</Text>
          <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>80+ Rooms</Text>
        </Flex>
      </Box>

      {/* 3 Tier Blocks with Ample Whitespace */}
      <Grid columns={{ initial: '1', md: '3' }} gap="6" mb="9">
        {/* Tier 1 */}
        <Box 
          p="6" 
          style={{ 
            background: tierBlock === 1 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.015)',
            border: tierBlock === 1 ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 18,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 420
          }}
        >
          <Box>
            <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Tier 1 • Boutique
            </Text>
            <Heading size="5" style={{ color: '#fff', letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Up to 20 Rooms
            </Heading>
            <Flex align="baseline" gap="2" mb="5">
              <Text size="8" weight="bold" style={{ color: '#fff' }}>GH₵ 200</Text>
              <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>/ month</Text>
            </Flex>
            <Flex direction="column" gap="3" mb="6">
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Front Desk Workstation</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Owner Cloud Reports</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>80mm Receipt Slip Printing</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Offline SQLite Engine</Text>
              </Flex>
            </Flex>
          </Box>
          <Button asChild size="2" variant="outline" style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', cursor: 'pointer', borderRadius: 8 }}>
            <Link href="/register">Select Tier 1</Link>
          </Button>
        </Box>

        {/* Tier 2 */}
        <Box 
          p="6" 
          style={{ 
            background: tierBlock === 2 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.015)',
            border: tierBlock === 2 ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 18,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 420
          }}
        >
          <Box>
            <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Tier 2 • Mid-Scale
            </Text>
            <Heading size="5" style={{ color: '#fff', letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              21 – 40 Rooms
            </Heading>
            <Flex align="baseline" gap="2" mb="5">
              <Text size="8" weight="bold" style={{ color: '#fff' }}>GH₵ 400</Text>
              <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>/ month</Text>
            </Flex>
            <Flex direction="column" gap="3" mb="6">
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Everything in Tier 1</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>2x 20-Room Capacity Blocks</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Multiple Cashier Logins</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Priority WhatsApp Support</Text>
              </Flex>
            </Flex>
          </Box>
          <Button asChild size="2" variant="outline" style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', cursor: 'pointer', borderRadius: 8 }}>
            <Link href="/register">Select Tier 2</Link>
          </Button>
        </Box>

        {/* Tier 3 */}
        <Box 
          p="6" 
          style={{ 
            background: tierBlock >= 3 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.015)',
            border: tierBlock >= 3 ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 18,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 420
          }}
        >
          <Box>
            <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Tier 3 • Resort
            </Text>
            <Heading size="5" style={{ color: '#fff', letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              41 – 60 Rooms
            </Heading>
            <Flex align="baseline" gap="2" mb="5">
              <Text size="8" weight="bold" style={{ color: '#fff' }}>GH₵ 600</Text>
              <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>/ month</Text>
            </Flex>
            <Flex direction="column" gap="3" mb="6">
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Everything in Tier 2</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>3x 20-Room Capacity Blocks</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Multi-terminal synchronization</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Check size={15} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Dedicated Account Manager</Text>
              </Flex>
            </Flex>
          </Box>
          <Button asChild size="2" variant="outline" style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', cursor: 'pointer', borderRadius: 8 }}>
            <Link href="/register">Select Tier 3</Link>
          </Button>
        </Box>
      </Grid>

      {/* Spacious Add-on Modules & Summary Section */}
      <Box style={{ paddingTop: '5rem', paddingBottom: '7rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Grid columns={{ initial: '1', lg: '3' }} gap="8">
          {/* Left: Modules list */}
          <Box style={{ gridColumn: 'span 2' }}>
            <Heading size="6" style={{ color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              Add-on Modules
            </Heading>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.6, display: 'block', marginBottom: '2rem' }}>
              Each module scales per 20-room block (Base Fee × {tierBlock} {tierBlock > 1 ? 'blocks' : 'block'}).
            </Text>

            <Grid columns={{ initial: '1', sm: '2' }} gap="5">
              {AVAILABLE_MODULES.map((mod) => {
                const isSelected = selectedModules.includes(mod.id);
                const cost = mod.pricePerBlock * tierBlock;
                return (
                  <Box 
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 16,
                      background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box style={{ width: '100%', height: 160, position: 'relative', overflow: 'hidden' }}>
                      <img 
                        src={mod.image} 
                        alt={mod.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <Box 
                        style={{ 
                          position: 'absolute', 
                          top: 12, 
                          right: 12,
                          background: isSelected ? '#fff' : 'rgba(0, 0, 0, 0.65)',
                          color: isSelected ? '#080a0f' : '#fff',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backdropFilter: 'blur(8px)'
                        }}
                      >
                        {isSelected ? '✓ Added' : '+ Add'}
                      </Box>
                    </Box>

                    <Box p="5" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Box mb="3">
                        <Heading size="3" mb="2" style={{ color: '#fff' }}>{mod.name}</Heading>
                        <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.6 }} as="p">
                          {mod.description}
                        </Text>
                      </Box>
                      <Text size="2" weight="bold" style={{ color: '#fff' }}>
                        +GH₵ {cost}/month ({mod.pricePerBlock}/block)
                      </Text>
                    </Box>
                  </Box>
                );
              })}
            </Grid>
          </Box>

          {/* Right: Minimalist Total Card */}
          <Box>
            <Box 
              p="6" 
              style={{ 
                position: 'sticky', 
                top: 100, 
                background: 'rgba(255, 255, 255, 0.025)', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: 20 
              }}
            >
              <Heading size="4" mb="5" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                Summary
              </Heading>

              <Flex direction="column" gap="3" mb="6">
                <Flex justify="between">
                  <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Capacity</Text>
                  <Text size="2" style={{ color: '#fff' }}>{roomsCount} Rooms ({tierBlock} Blocks)</Text>
                </Flex>
                <Flex justify="between">
                  <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Base Plan</Text>
                  <Text size="2" style={{ color: '#fff' }}>GH₵ {basePrice}.00</Text>
                </Flex>
                <Flex justify="between">
                  <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Add-ons ({selectedModules.length})</Text>
                  <Text size="2" style={{ color: '#fff' }}>GH₵ {modulesPrice}.00</Text>
                </Flex>
                <Flex justify="between">
                  <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Cadence</Text>
                  <Text size="2" style={{ color: '#fff', textTransform: 'capitalize' }}>{billingCycle}</Text>
                </Flex>
              </Flex>

              <Box style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 20 }} mb="6">
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
                  Total Payment
                </Text>
                <Flex align="baseline" justify="between">
                  <Text size="8" weight="bold" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
                    GH₵ {billingCycle === 'monthly' ? totalMonthly : totalAnnual}
                  </Text>
                  <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                    {billingCycle === 'monthly' ? '/ month' : '/ year (-20%)'}
                  </Text>
                </Flex>
              </Box>

              <Button 
                asChild 
                size="3" 
                style={{ 
                  width: '100%', 
                  cursor: 'pointer',
                  background: '#fff',
                  color: '#080a0f',
                  fontWeight: 600,
                  borderRadius: 8,
                  height: 44
                }}
              >
                <Link href="/register">
                  <span>Continue to Register</span>
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </Box>
          </Box>
        </Grid>
      </Box>
    </Container>
  );
}
