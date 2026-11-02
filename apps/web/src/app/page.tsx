import Link from 'next/link';
import {
  Container,
  Section,
  Heading,
  Text,
  Flex,
  Grid,
  Card,
  Button,
  Box
} from '@radix-ui/themes';
import {
  ArrowRight,
  HardDrive,
  RefreshCw,
  Smartphone,
  UtensilsCrossed,
  Bell,
  BedDouble,
  Layers,
  ExternalLink
} from 'lucide-react';
import { AVAILABLE_MODULES } from '@/lib/pricing';

export default function HomePage() {
  return (
    <Container size="4" px={{ initial: '4', md: '6' }}>
      {/* Hero Section with Large Space */}
      <Box style={{ paddingTop: '8rem', paddingBottom: '9rem', textAlign: 'center' }}>
        <Flex direction="column" align="center" gap="5">
          <Text
            size="2"
            style={{
              color: 'rgba(255, 255, 255, 0.45)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600
            }}
          >
            Hospitality Software • Ghana & West Africa
          </Text>

          <Heading
            size={{ initial: '8', md: '9' }}
            weight="bold"
            style={{
              maxWidth: 860,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: '#fff'
            }}
          >
            Offline-first hotel management. <br />
            <span style={{ color: 'rgba(255, 255, 255, 0.55)' }}>
              Connected in real-time.
            </span>
          </Heading>

          <Text
            size="4"
            style={{
              maxWidth: 620,
              lineHeight: 1.7,
              color: 'rgba(255, 255, 255, 0.5)',
              margin: '0 auto'
            }}
          >
            A front desk system that never stops working during internet or power interruptions.
            Automated MoMo settlement and mobile reports for Ghanaian property owners.
          </Text>

          {/* Minimalist Actions */}
          <Flex wrap="wrap" gap="4" justify="center" mt="5">
            <Button
              asChild
              size="3"
              style={{
                cursor: 'pointer',
                background: '#fff',
                color: '#080a0f',
                fontWeight: 600,
                borderRadius: 8,
                padding: '0 28px',
                height: 48
              }}
            >
              <Link href="/pricing">
                <span>View Pricing & Plans</span>
                <ArrowRight size={16} />
              </Link>
            </Button>

            <Button
              asChild
              size="3"
              variant="outline"
              style={{
                cursor: 'pointer',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: 8,
                padding: '0 24px',
                height: 48
              }}
            >
              <Link href="/register">
                <span>Register Hotel</span>
              </Link>
            </Button>
          </Flex>

          {/* Minimal Key Indicators */}
          <Flex wrap="wrap" gap="7" justify="center" mt="7" style={{ opacity: 0.6 }}>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Zero Local Server Hardware</Text>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>MTN MoMo & Telecel Cash</Text>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>80mm Thermal Receipts</Text>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Instant Offline Failover</Text>
          </Flex>
        </Flex>
      </Box>

      {/* Large Section 1: Architecture */}
      <Box id="architecture" style={{ paddingTop: '6rem', paddingBottom: '7rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Box mb="8" style={{ maxWidth: 600 }}>
          <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
            Architecture
          </Text>
          <Heading size="7" weight="bold" style={{ letterSpacing: '-0.03em', lineHeight: 1.25, marginBottom: '1rem', color: '#fff' }}>
            Built for Ghanaian infrastructure realities.
          </Heading>
          <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.7 }}>
            No expensive on-premise servers to maintain. Workstations run locally on front desk PCs and replicate to cloud Postgres when connected.
          </Text>
        </Box>

        <Grid columns={{ initial: '1', md: '3' }} gap="6">
          {/* Card 1 */}
          <Box
            p="6"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 16
            }}
          >
            <Box mb="5" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <HardDrive size={24} />
            </Box>
            <Heading size="4" mb="2" style={{ color: '#fff' }}>Front Desk Terminal</Heading>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.7 }} as="p">
              Embedded local SQLite database. Check guests in, assign keys, and print thermal receipts even during total internet blackouts.
            </Text>
          </Box>

          {/* Card 2 */}
          <Box
            p="6"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 16
            }}
          >
            <Box mb="5" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <RefreshCw size={24} />
            </Box>
            <Heading size="4" mb="2" style={{ color: '#fff' }}>Automatic Sync</Heading>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.7 }} as="p">
              Local writes are queued in a persistent SQLite log. Once internet returns, data automatically replicates to your cloud database.
            </Text>
          </Box>

          {/* Card 3 */}
          <Box
            p="6"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 16
            }}
          >
            <Box mb="5" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <Smartphone size={24} />
            </Box>
            <Heading size="4" mb="2" style={{ color: '#fff' }}>Owner Cloud Portal</Heading>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.7 }} as="p">
              Real-time room occupancy, cash reconciliation, and Mobile Money statements accessible from your phone anywhere in the world.
            </Text>
          </Box>
        </Grid>
      </Box>

      {/* Large Section 2: Modular Capabilities */}
      <Box style={{ paddingTop: '6rem', paddingBottom: '7rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Box mb="8" style={{ maxWidth: 600 }}>
          <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
            Modular Architecture
          </Text>
          <Heading size="7" weight="bold" style={{ letterSpacing: '-0.03em', lineHeight: 1.25, marginBottom: '1rem', color: '#fff' }}>
            Start with the base. Add modules as you grow.
          </Heading>
          <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.7 }}>
            Base Front Desk starts at GH₵ 200/month per 20 rooms. Stack additional software capabilities on demand.
          </Text>
        </Box>

        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="6">
          {AVAILABLE_MODULES.map((mod) => (
            <Box
              key={mod.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 16,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box style={{ width: '100%', height: 160, position: 'relative', overflow: 'hidden' }}>
                <img
                  src={mod.image}
                  alt={mod.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              <Box p="5" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box mb="4">
                  <Heading size="3" mb="2" style={{ color: '#fff' }}>{mod.name}</Heading>
                  <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.6 }} as="p">
                    {mod.description}
                  </Text>
                </Box>
                <Text size="2" weight="bold" style={{ color: '#fff' }}>+GH₵ {mod.pricePerBlock}/mo per block</Text>
              </Box>
            </Box>
          ))}
        </Grid>
      </Box>

      {/* Large Section 3: Call to Action */}
      <Box style={{ paddingTop: '7rem', paddingBottom: '7rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
        <Flex direction="column" align="center" gap="4">
          <Heading size="8" weight="bold" style={{ letterSpacing: '-0.03em', color: '#fff' }}>
            Ready to get started?
          </Heading>
          <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.5)', maxWidth: 520, lineHeight: 1.7 }}>
            Provision your hotel in minutes. Settle monthly through your existing MTN Mobile Money or Telecel Cash wallet.
          </Text>
          <Flex gap="4" mt="3">
            <Button
              asChild
              size="3"
              style={{
                cursor: 'pointer',
                background: '#fff',
                color: '#080a0f',
                fontWeight: 600,
                borderRadius: 8,
                padding: '0 28px',
                height: 48
              }}
            >
              <Link href="/register">
                <span>Register Property</span>
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button
              asChild
              size="3"
              variant="outline"
              style={{
                cursor: 'pointer',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: 8,
                padding: '0 24px',
                height: 48
              }}
            >
              <Link href="/pricing">
                <span>Calculate Pricing</span>
              </Link>
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Container>
  );
}
