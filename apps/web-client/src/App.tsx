import React, { useState } from 'react';
import { HubProvider, useHub } from './context/HubContext';
import { Header } from './components/Header';
import { FrontDeskView } from './views/FrontDeskView';
import { HousekeepingView } from './views/HousekeepingView';
import { PosView } from './views/PosView';
import { OwnerView } from './views/OwnerView';
import { Box, Flex, Text, Spinner } from '@radix-ui/themes';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'frontdesk' | 'housekeeping' | 'pos' | 'owner'>('frontdesk');
  const { isLoading } = useHub();

  if (isLoading) {
    return (
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        gap="3" 
        className="min-h-screen bg-[#090d16] text-white"
      >
        <Spinner size="3" />
        <Text size="2" color="gray" className="font-heading">
          Connecting to Hospware Local Hub...
        </Text>
      </Flex>
    );
  }

  return (
    <Box className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <Box asChild className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <main>
          {activeTab === 'frontdesk' && <FrontDeskView />}
          {activeTab === 'housekeeping' && <HousekeepingView />}
          {activeTab === 'pos' && <PosView />}
          {activeTab === 'owner' && <OwnerView />}
        </main>
      </Box>

      <Box asChild className="glass-nav border-t border-slate-800/80 py-3 px-4 text-center">
        <footer>
          <Text size="1" color="gray">
            Hospware Offline-First PMS Master Hub • Local Engine v1.0.0 • SQLite WAL Mode
          </Text>
        </footer>
      </Box>
    </Box>
  );
};

export const App: React.FC = () => {
  return (
    <HubProvider>
      <AppContent />
    </HubProvider>
  );
};

export default App;
