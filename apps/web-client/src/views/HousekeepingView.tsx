import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { RoomStatus } from '@hospware/core-domain';
import { 
  Flex, 
  Box, 
  Text, 
  Heading, 
  Badge, 
  Button, 
  IconButton, 
  Card, 
  Grid, 
  Dialog, 
  TextArea, 
  SegmentedControl,
  Callout,
  Tooltip
} from '@radix-ui/themes';
import { 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  X,
  AlertTriangle
} from 'lucide-react';

export const HousekeepingView: React.FC = () => {
  const { rooms, updateRoomStatus } = useHub();
  const [filter, setFilter] = useState<'ALL' | 'DIRTY' | 'CLEANING' | 'CLEAN'>('ALL');
  const [ticketModalRoom, setTicketModalRoom] = useState<any | null>(null);
  const [ticketNote, setTicketNote] = useState('');

  const filteredRooms = rooms.filter((r) => {
    if (filter === 'DIRTY') return r.status.includes('DIRTY');
    if (filter === 'CLEANING') return r.status === 'CLEANING_IN_PROGRESS';
    if (filter === 'CLEAN') return r.status.includes('CLEAN') || r.status === 'INSPECTED';
    return true;
  });

  const dirtyCount = rooms.filter((r) => r.status.includes('DIRTY')).length;
  const inProgressCount = rooms.filter((r) => r.status === 'CLEANING_IN_PROGRESS').length;
  const cleanCount = rooms.filter((r) => r.status.includes('CLEAN') || r.status === 'INSPECTED').length;

  const handleQuickAdvance = async (room: any) => {
    if (room.status === RoomStatus.VACANT_DIRTY) {
      await updateRoomStatus(room.id, RoomStatus.CLEANING_IN_PROGRESS);
    } else if (room.status === RoomStatus.CLEANING_IN_PROGRESS) {
      await updateRoomStatus(room.id, RoomStatus.VACANT_CLEAN);
    } else if (room.status === RoomStatus.OCCUPIED_DIRTY) {
      await updateRoomStatus(room.id, RoomStatus.OCCUPIED_CLEAN);
    } else if (room.status === RoomStatus.VACANT_CLEAN) {
      await updateRoomStatus(room.id, RoomStatus.INSPECTED);
    }
  };

  const handleCreateMaintenanceTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketModalRoom || !ticketNote) return;

    await updateRoomStatus(ticketModalRoom.id, RoomStatus.OUT_OF_SERVICE, `Maintenance: ${ticketNote}`);
    setTicketModalRoom(null);
    setTicketNote('');
  };

  return (
    <Box className="space-y-5 max-w-5xl mx-auto">
      
      {/* Mobile-Friendly Status Overview Cards */}
      <Grid columns="3" gap="3">
        <Card 
          size="2" 
          className={`cursor-pointer transition-all ${
            filter === 'DIRTY' ? 'border-amber-500 bg-amber-950/25 ring-1 ring-amber-500' : 'glass-panel'
          }`}
          onClick={() => setFilter('DIRTY')}
        >
          <Text size="6" weight="bold" className="text-amber-400 font-heading block">
            {dirtyCount}
          </Text>
          <Text size="1" color="gray" weight="medium">
            Needs Cleaning
          </Text>
        </Card>

        <Card 
          size="2" 
          className={`cursor-pointer transition-all ${
            filter === 'CLEANING' ? 'border-cyan-500 bg-cyan-950/25 ring-1 ring-cyan-500' : 'glass-panel'
          }`}
          onClick={() => setFilter('CLEANING')}
        >
          <Text size="6" weight="bold" className="text-cyan-400 font-heading block">
            {inProgressCount}
          </Text>
          <Text size="1" color="gray" weight="medium">
            In Progress
          </Text>
        </Card>

        <Card 
          size="2" 
          className={`cursor-pointer transition-all ${
            filter === 'CLEAN' ? 'border-emerald-500 bg-emerald-950/25 ring-1 ring-emerald-500' : 'glass-panel'
          }`}
          onClick={() => setFilter('CLEAN')}
        >
          <Text size="6" weight="bold" className="text-emerald-400 font-heading block">
            {cleanCount}
          </Text>
          <Text size="1" color="gray" weight="medium">
            Clean & Inspected
          </Text>
        </Card>
      </Grid>

      {/* Staff Bar & Filter */}
      <Card size="2" className="glass-panel border-slate-800">
        <Flex justify="between" align="center" wrap="wrap" gap="3">
          <Flex align="center" gap="2">
            <Badge color="iris" variant="surface" size="2" radius="full">
              <Sparkles className="w-4 h-4" />
            </Badge>
            <Heading size="4" className="font-heading text-white">Housekeeping Dispatch</Heading>
          </Flex>

          <SegmentedControl.Root
            value={filter}
            onValueChange={(val: any) => setFilter(val)}
            size="2"
            radius="large"
          >
            <SegmentedControl.Item value="ALL">All ({rooms.length})</SegmentedControl.Item>
            <SegmentedControl.Item value="DIRTY">Dirty</SegmentedControl.Item>
            <SegmentedControl.Item value="CLEANING">Cleaning</SegmentedControl.Item>
            <SegmentedControl.Item value="CLEAN">Clean</SegmentedControl.Item>
          </SegmentedControl.Root>
        </Flex>
      </Card>

      {/* Tap-Friendly Room Cards */}
      <Grid columns={{ initial: '1', md: '2' }} gap="4">
        {filteredRooms.map((room) => {
          const isDirty = room.status.includes('DIRTY');
          const isCleaning = room.status === 'CLEANING_IN_PROGRESS';
          const isClean = room.status === 'VACANT_CLEAN' || room.status === 'OCCUPIED_CLEAN';
          const isInspected = room.status === 'INSPECTED';

          return (
            <Card
              key={room.id}
              size="3"
              className={`room-card relative overflow-hidden transition-all ${
                isDirty
                  ? 'border-l-4 border-l-amber-500 bg-amber-950/15'
                  : isCleaning
                  ? 'border-l-4 border-l-cyan-500 bg-cyan-950/15'
                  : isInspected
                  ? 'border-l-4 border-l-sky-500 bg-sky-950/15'
                  : 'border-l-4 border-l-emerald-500 bg-emerald-950/15'
              }`}
            >
              <Flex direction="column" justify="between" className="h-full gap-4">
                
                {/* Top Line */}
                <Box>
                  <Flex justify="between" align="start" mb="2">
                    <Box>
                      <Flex align="center" gap="2">
                        <Heading size="7" className="font-heading font-extrabold text-white">
                          {room.roomNumber}
                        </Heading>
                        <Badge color="gray" variant="surface" size="1" radius="medium">
                          Floor {room.floor}
                        </Badge>
                      </Flex>
                      <Text size="2" color="gray">{room.roomType.name}</Text>
                    </Box>

                    <Badge 
                      color={isClean || isInspected ? "green" : isCleaning ? "cyan" : "amber"} 
                      variant="surface" 
                      size="2" 
                      radius="full"
                    >
                      {room.status.replace(/_/g, ' ')}
                    </Badge>
                  </Flex>

                  {room.notes && (
                    <Callout.Root color="amber" size="1" className="mt-2">
                      <Callout.Icon>
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </Callout.Icon>
                      <Callout.Text size="1">{room.notes}</Callout.Text>
                    </Callout.Root>
                  )}
                </Box>

                {/* Touch Action Button */}
                <Flex align="center" gap="2">
                  <Button
                    variant="solid"
                    color={isDirty ? "amber" : isCleaning ? "grass" : isClean ? "sky" : "gray"}
                    size="3"
                    radius="large"
                    className="flex-1 cursor-pointer font-bold shadow-lg"
                    onClick={() => handleQuickAdvance(room)}
                  >
                    {isDirty && (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>Start Cleaning</span>
                      </>
                    )}
                    {isCleaning && (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Clean & Ready</span>
                      </>
                    )}
                    {isClean && (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Supervisor Inspect</span>
                      </>
                    )}
                    {isInspected && (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Inspected & Ready</span>
                      </>
                    )}
                  </Button>

                  <Tooltip content="Report Maintenance Issue">
                    <IconButton
                      variant="surface"
                      color="gray"
                      size="3"
                      radius="large"
                      onClick={() => setTicketModalRoom(room)}
                      className="cursor-pointer hover:border-amber-500/50"
                    >
                      <Wrench className="w-4 h-4 text-amber-400" />
                    </IconButton>
                  </Tooltip>
                </Flex>

              </Flex>
            </Card>
          );
        })}
      </Grid>

      {/* Maintenance Ticket Modal */}
      <Dialog.Root open={!!ticketModalRoom} onOpenChange={(open) => !open && setTicketModalRoom(null)}>
        <Dialog.Content size="3" maxWidth="480px" className="p-6">
          <Flex justify="between" align="center" mb="4">
            <Flex align="center" gap="2">
              <Badge color="amber" variant="surface" size="2" radius="full">
                <Wrench className="w-4 h-4" />
              </Badge>
              <Dialog.Title className="m-0">
                <Heading size="4" className="font-heading text-white">
                  Report Issue: Room {ticketModalRoom?.roomNumber}
                </Heading>
              </Dialog.Title>
            </Flex>
            <Dialog.Close>
              <IconButton variant="ghost" color="gray" size="2" radius="medium" onClick={() => setTicketModalRoom(null)}>
                <X className="w-4 h-4" />
              </IconButton>
            </Dialog.Close>
          </Flex>

          <form onSubmit={handleCreateMaintenanceTicket}>
            <Flex direction="column" gap="4">
              <Box>
                <Text size="1" weight="bold" color="gray" className="mb-1 block">
                  Issue Description *
                </Text>
                <TextArea
                  rows={3}
                  radius="large"
                  placeholder="e.g. AC leaking water, bathroom light fixture not responding, shower low pressure..."
                  value={ticketNote}
                  onChange={(e) => setTicketNote(e.target.value)}
                  required
                />
              </Box>

              <Flex justify="end" gap="3">
                <Dialog.Close>
                  <Button variant="soft" color="gray" size="2" radius="large" type="button" onClick={() => setTicketModalRoom(null)}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button variant="solid" color="ruby" size="2" radius="large" type="submit">
                  Set Room Out of Service
                </Button>
              </Flex>
            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Root>

    </Box>
  );
};
