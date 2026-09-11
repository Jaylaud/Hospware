import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Flex, 
  Box, 
  Text, 
  Badge, 
  Button, 
  IconButton, 
  Avatar, 
  Tooltip,
  SegmentedControl
} from '@radix-ui/themes';
import { 
  Building2, 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  KeyRound, 
  DollarSign, 
  BedDouble, 
  Sparkles, 
  UtensilsCrossed, 
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { PinSwitchModal } from './PinSwitchModal';

interface HeaderProps {
  activeTab: 'frontdesk' | 'housekeeping' | 'pos' | 'owner';
  setActiveTab: (tab: 'frontdesk' | 'housekeeping' | 'pos' | 'owner') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, isConnected, syncStatus, activeShift, refreshData } = useHub();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <>
      <header className="glass-nav sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <Flex align="center" justify="between" wrap="wrap" gap="3">
            
            {/* Logo & Hotel Brand */}
            <Flex align="center" gap="3">
              <Box className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Building2 className="w-5 h-5 text-white" />
              </Box>
              <Box>
                <Flex align="center" gap="2">
                  <Text className="font-heading font-bold text-lg text-white tracking-tight">HOSPWARE</Text>
                  <Badge color="iris" variant="surface" size="1" radius="full">
                    LOCAL HUB
                  </Badge>
                </Flex>
                <Text size="1" color="gray">Grand Horizon Hotel & Suites</Text>
              </Box>
            </Flex>

            {/* Navigation Portals */}
            <SegmentedControl.Root 
              value={activeTab} 
              onValueChange={(val: any) => setActiveTab(val)}
              size="2"
              radius="large"
            >
              <SegmentedControl.Item value="frontdesk">
                <Flex align="center" gap="2">
                  <BedDouble className="w-3.5 h-3.5" />
                  <span>Front Desk</span>
                </Flex>
              </SegmentedControl.Item>
              <SegmentedControl.Item value="housekeeping">
                <Flex align="center" gap="2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Housekeeping</span>
                </Flex>
              </SegmentedControl.Item>
              <SegmentedControl.Item value="pos">
                <Flex align="center" gap="2">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Bar / POS</span>
                </Flex>
              </SegmentedControl.Item>
              <SegmentedControl.Item value="owner">
                <Flex align="center" gap="2">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Owner Analytics</span>
                </Flex>
              </SegmentedControl.Item>
            </SegmentedControl.Root>

            {/* Right Status Bar & Operator Fast Switch */}
            <Flex align="center" gap="3">
              
              {/* Shift Badge */}
              {activeShift ? (
                <Badge color="green" variant="surface" size="2" radius="medium" className="hidden sm:inline-flex">
                  <Flex align="center" gap="1">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Shift Open (${activeShift.opening_cash_float})</span>
                  </Flex>
                </Badge>
              ) : (
                <Badge color="amber" variant="surface" size="2" radius="medium" className="hidden sm:inline-flex">
                  <span>No Active Shift</span>
                </Badge>
              )}

              {/* LAN & Cloud Health Badges */}
              <Flex align="center" gap="2" className="bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-800/80">
                <Tooltip content={isConnected ? "LAN WebSocket Online" : "LAN Offline"}>
                  <Flex align="center" gap="1">
                    {isConnected ? (
                      <Badge color="green" variant="solid" size="1" radius="full">
                        <Wifi className="w-3 h-3" />
                      </Badge>
                    ) : (
                      <Badge color="ruby" variant="solid" size="1" radius="full">
                        <WifiOff className="w-3 h-3" />
                      </Badge>
                    )}
                    <Text size="1" color={isConnected ? "green" : "red"} className="hidden md:inline font-medium">
                      {isConnected ? "LAN" : "OFF"}
                    </Text>
                  </Flex>
                </Tooltip>

                <Box className="w-[1px] h-3 bg-slate-700" />

                <Tooltip content={syncStatus?.isOnline ? "Cloud Synchronized" : "Local SQLite Mode (Offline buffer)"}>
                  <Flex align="center" gap="1">
                    {syncStatus?.isOnline ? (
                      <Badge color="cyan" variant="solid" size="1" radius="full">
                        <Cloud className="w-3 h-3" />
                      </Badge>
                    ) : (
                      <Badge color="amber" variant="solid" size="1" radius="full">
                        <CloudOff className="w-3 h-3" />
                      </Badge>
                    )}
                    <Text size="1" color={syncStatus?.isOnline ? "cyan" : "amber"} className="hidden md:inline font-medium">
                      {syncStatus?.isOnline ? "SYNC" : "BUFFER"}
                    </Text>
                  </Flex>
                </Tooltip>
              </Flex>

              {/* Refresh Button */}
              <Tooltip content="Refresh Live PMS Data">
                <IconButton 
                  variant="ghost" 
                  color="gray" 
                  size="2" 
                  onClick={handleRefresh}
                  radius="medium"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                </IconButton>
              </Tooltip>

              {/* Fast Operator Switch Button */}
              <Button
                variant="surface"
                color="gray"
                size="2"
                radius="large"
                onClick={() => setIsPinModalOpen(true)}
                className="cursor-pointer hover:border-indigo-500/50 transition-all"
              >
                <Flex align="center" gap="2">
                  <Avatar
                    size="1"
                    fallback={currentUser.fullName.charAt(0)}
                    color="iris"
                    radius="full"
                  />
                  <Box className="text-left hidden lg:block">
                    <Text size="2" weight="bold" className="text-white leading-tight">
                      {currentUser.fullName}
                    </Text>
                    <Text size="1" color="iris" className="block text-[10px]">
                      {currentUser.role.replace(/_/g, ' ')}
                    </Text>
                  </Box>
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                </Flex>
              </Button>

            </Flex>
          </Flex>
        </div>
      </header>

      {/* Operator PIN Switch Modal */}
      {isPinModalOpen && <PinSwitchModal onClose={() => setIsPinModalOpen(false)} />}
    </>
  );
};
