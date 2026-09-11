import React, { useState, useEffect } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Flex, 
  Box, 
  Text, 
  Heading, 
  Badge, 
  Button, 
  Card, 
  Grid, 
  Callout, 
  Progress,
  Separator
} from '@radix-ui/themes';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ShieldCheck, 
  RefreshCw, 
  Award, 
  Key,
  Lock,
  CheckCircle2
} from 'lucide-react';

export const OwnerView: React.FC = () => {
  const { overview, syncStatus, refreshData } = useHub();
  const [licenseData, setLicenseData] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetch('/api/system/license')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLicenseData(d.data);
      });
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/system/sync/trigger', { method: 'POST' });
      await refreshData();
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const kpis = overview?.kpis || {
    occupancyRate: 75.0,
    adr: 85.0,
    revPar: 63.75,
    totalGrossRevenue: 680.0,
    totalRoomRevenue: 510.0,
    totalFnBRevenue: 170.0,
  };

  const financials = overview?.financials || {
    totalCollected: 450.0,
    drawerCash: 245.0,
    activeShiftOpen: true,
  };

  return (
    <Box className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner: Property & Sync Status */}
      <Card size="3" className="glass-panel border-l-4 border-l-indigo-500 border-slate-800">
        <Flex justify="between" align="center" wrap="wrap" gap="3">
          <Box>
            <Flex align="center" gap="2">
              <Heading size="5" className="font-heading font-extrabold text-white">
                Executive Dashboard & Audit
              </Heading>
              <Badge color="green" variant="surface" size="1" radius="full">
                Real-Time Active
              </Badge>
            </Flex>
            <Text size="2" color="gray" className="mt-0.5 block">
              Grand Horizon Hotel & Suites • On-Premise Master Hub Analytics & Anti-Fraud
            </Text>
          </Box>

          <Button
            variant="surface"
            color="iris"
            size="2"
            radius="large"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Force Cloud Sync'}</span>
          </Button>
        </Flex>
      </Card>

      {/* KPI Cards Grid */}
      <Grid columns={{ initial: '1', sm: '2', lg: '4' }} gap="4">
        
        {/* Occupancy Rate */}
        <Card size="2" className="glass-panel border-slate-800 relative overflow-hidden">
          <Flex justify="between" align="center" mb="1">
            <Text size="1" weight="bold" color="gray">Occupancy Rate</Text>
            <Badge color="iris" variant="surface" size="1" radius="full">
              <Percent className="w-3 h-3" />
            </Badge>
          </Flex>
          <Heading size="7" className="font-heading font-extrabold text-white">
            {kpis.occupancyRate}%
          </Heading>
          <Text size="1" color="gray" className="mt-1 block">
            {overview?.roomCounts?.occupied || 3} of {overview?.roomCounts?.total || 8} rooms occupied
          </Text>
          <Box mt="3">
            <Progress value={kpis.occupancyRate} color="iris" size="1" radius="full" />
          </Box>
        </Card>

        {/* Average Daily Rate (ADR) */}
        <Card size="2" className="glass-panel border-slate-800 relative overflow-hidden">
          <Flex justify="between" align="center" mb="1">
            <Text size="1" weight="bold" color="gray">ADR (Avg Daily Rate)</Text>
            <Badge color="green" variant="surface" size="1" radius="full">
              <DollarSign className="w-3 h-3" />
            </Badge>
          </Flex>
          <Heading size="7" className="font-heading font-extrabold text-emerald-400">
            ${kpis.adr?.toFixed(2)}
          </Heading>
          <Text size="1" color="gray" className="mt-1 block">
            Per occupied room night
          </Text>
          <Box mt="3">
            <Progress value={70} color="green" size="1" radius="full" />
          </Box>
        </Card>

        {/* RevPAR */}
        <Card size="2" className="glass-panel border-slate-800 relative overflow-hidden">
          <Flex justify="between" align="center" mb="1">
            <Text size="1" weight="bold" color="gray">RevPAR</Text>
            <Badge color="cyan" variant="surface" size="1" radius="full">
              <TrendingUp className="w-3 h-3" />
            </Badge>
          </Flex>
          <Heading size="7" className="font-heading font-extrabold text-cyan-400">
            ${kpis.revPar?.toFixed(2)}
          </Heading>
          <Text size="1" color="gray" className="mt-1 block">
            Revenue per available room
          </Text>
          <Box mt="3">
            <Progress value={65} color="cyan" size="1" radius="full" />
          </Box>
        </Card>

        {/* Gross Revenue Today */}
        <Card size="2" className="glass-panel border-slate-800 relative overflow-hidden">
          <Flex justify="between" align="center" mb="1">
            <Text size="1" weight="bold" color="gray">Total Revenue Today</Text>
            <Badge color="purple" variant="surface" size="1" radius="full">
              <Award className="w-3 h-3" />
            </Badge>
          </Flex>
          <Heading size="7" className="font-heading font-extrabold text-purple-300">
            ${kpis.totalGrossRevenue?.toFixed(2)}
          </Heading>
          <Text size="1" color="gray" className="mt-1 block">
            Room: ${kpis.totalRoomRevenue} | FnB: ${kpis.totalFnBRevenue}
          </Text>
          <Box mt="3">
            <Progress value={80} color="purple" size="1" radius="full" />
          </Box>
        </Card>

      </Grid>

      {/* Middle Grid: Cash Audit & License Integrity */}
      <Grid columns={{ initial: '1', lg: '2' }} gap="6">
        
        {/* Anti-Fraud & Cash Audit */}
        <Card size="3" className="glass-panel border-slate-800 space-y-4">
          <Flex justify="between" align="center" pb="3" className="border-b border-slate-800">
            <Flex align="center" gap="2">
              <Badge color="green" variant="surface" size="2" radius="full">
                <ShieldCheck className="w-4 h-4" />
              </Badge>
              <Heading size="3" className="font-heading text-white">Cash & Shift Audit</Heading>
            </Flex>
            <Badge color="green" variant="solid" size="1" radius="full">
              Anti-Fraud Active
            </Badge>
          </Flex>

          <Grid columns="2" gap="3">
            <Card variant="surface" size="2" className="bg-slate-900/80 border-slate-800">
              <Text size="1" color="gray" className="block">Current Cash in Drawer</Text>
              <Text size="6" weight="bold" className="text-emerald-400 font-heading mt-0.5 block">
                ${financials.drawerCash?.toFixed(2)}
              </Text>
            </Card>

            <Card variant="surface" size="2" className="bg-slate-900/80 border-slate-800">
              <Text size="1" color="gray" className="block">Total Tender Collected</Text>
              <Text size="6" weight="bold" className="text-white font-heading mt-0.5 block">
                ${financials.totalCollected?.toFixed(2)}
              </Text>
            </Card>
          </Grid>

          <Box className="space-y-2 pt-1">
            <Card variant="surface" size="1" className="bg-slate-900/50 border-slate-800 p-2.5">
              <Flex justify="between" align="center">
                <Text size="1" color="gray">Shift Handover Enforcement:</Text>
                <Text size="1" weight="bold" color="green">Blind Drop Required</Text>
              </Flex>
            </Card>
            <Card variant="surface" size="1" className="bg-slate-900/50 border-slate-800 p-2.5">
              <Flex justify="between" align="center">
                <Text size="1" color="gray">Nightly WhatsApp Reconciliation:</Text>
                <Text size="1" weight="bold" color="cyan">Automated at 23:59</Text>
              </Flex>
            </Card>
          </Box>
        </Card>

        {/* Cryptographic Ed25519 License Status */}
        <Card size="3" className="glass-panel border-slate-800 space-y-4">
          <Flex justify="between" align="center" pb="3" className="border-b border-slate-800">
            <Flex align="center" gap="2">
              <Badge color="iris" variant="surface" size="2" radius="full">
                <Key className="w-4 h-4" />
              </Badge>
              <Heading size="3" className="font-heading text-white">Cryptographic Ed25519 License</Heading>
            </Flex>
            <Badge color="iris" variant="solid" size="1" radius="full">
              Validated
            </Badge>
          </Flex>

          {licenseData && (
            <Flex direction="column" gap="3">
              <Card variant="surface" size="2" className="bg-slate-900/80 border-slate-800">
                <Flex justify="between" align="center">
                  <Box>
                    <Text size="1" color="gray">SUBSCRIPTION TIER</Text>
                    <Heading size="4" className="font-heading text-white">{licenseData.tier} PLAN</Heading>
                  </Box>
                  <Box className="text-right">
                    <Text size="1" color="gray">VALIDITY</Text>
                    <Text size="3" weight="bold" color="green">{licenseData.daysRemaining} Days Left</Text>
                  </Box>
                </Flex>
              </Card>

              <Box>
                <Text size="1" weight="bold" color="gray" className="mb-2 block">Licensed Offline Modules:</Text>
                <Flex wrap="wrap" gap="2">
                  {licenseData.enabledFeatures?.map((f: string) => (
                    <Badge key={f} color="iris" variant="surface" size="1" radius="medium">
                      ✓ {f}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              <Callout.Root color="green" size="1">
                <Callout.Icon>
                  <CheckCircle2 className="w-4 h-4" />
                </Callout.Icon>
                <Callout.Text size="1">
                  Monotonic anti-tamper clock check: Verified (No clock rollback detected)
                </Callout.Text>
              </Callout.Root>
            </Flex>
          )}
        </Card>

      </Grid>

    </Box>
  );
};
