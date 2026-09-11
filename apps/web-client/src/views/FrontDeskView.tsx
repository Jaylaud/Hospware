import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { RoomStatus, PaymentMethod } from '@hospware/core-domain';
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
  TextField, 
  Select, 
  SegmentedControl,
  Callout,
  Separator,
  Tooltip
} from '@radix-ui/themes';
import { 
  Plus, 
  UserCheck, 
  DollarSign, 
  Receipt, 
  Bed, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Printer, 
  Sparkles,
  ShieldAlert,
  X,
  CreditCard
} from 'lucide-react';

export const FrontDeskView: React.FC = () => {
  const { 
    rooms, 
    reservations, 
    activeShift, 
    updateRoomStatus, 
    performWalkInCheckIn, 
    settleCheckout, 
    openShift, 
    closeShiftBlindDrop,
    printFolioReceipt 
  } = useHub();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  // Modals
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState<boolean>(false);
  const [isFolioModalOpen, setIsFolioModalOpen] = useState<boolean>(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [activeFolioData, setActiveFolioData] = useState<any | null>(null);

  // Walk-in form state
  const [walkInForm, setWalkInForm] = useState({
    roomId: '',
    guestFirstName: '',
    guestLastName: '',
    guestPhone: '',
    guestEmail: '',
    guestIdNumber: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    nightlyRate: 65,
    depositAmount: 65,
    paymentMethod: PaymentMethod.CASH,
  });

  // Shift form state
  const [blindDropCash, setBlindDropCash] = useState<string>('');
  const [varianceReason, setVarianceReason] = useState<string>('');
  const [openingFloatAmount, setOpeningFloatAmount] = useState<string>('100');
  const [shiftResult, setShiftResult] = useState<any | null>(null);

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'VACANT') return r.status.startsWith('VACANT') || r.status === 'INSPECTED';
    if (statusFilter === 'OCCUPIED') return r.status.startsWith('OCCUPIED');
    if (statusFilter === 'DIRTY') return r.status.includes('DIRTY');
    return r.status === statusFilter;
  });

  // Open Folio Modal for occupied room
  const handleOpenFolio = async (room: any) => {
    setSelectedRoom(room);
    if (room.currentReservationId) {
      try {
        const res = await fetch(`/api/reservations`);
        const data = await res.json();
        const activeRes = data.data?.find((r: any) => r.id === room.currentReservationId);
        
        setActiveFolioData({
          room,
          reservation: activeRes,
          balanceDue: activeRes ? activeRes.totalEstimatedAmount - activeRes.depositPaid : 0,
        });
        setIsFolioModalOpen(true);
      } catch {
        alert('Could not load folio');
      }
    }
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.roomId || !walkInForm.guestFirstName || !walkInForm.guestPhone) {
      alert('Please fill in room, guest name, and phone number.');
      return;
    }

    try {
      await performWalkInCheckIn({
        ...walkInForm,
        depositAmount: Number(walkInForm.depositAmount),
        nightlyRate: Number(walkInForm.nightlyRate),
      });
      setIsWalkInModalOpen(false);
      setWalkInForm({
        roomId: '',
        guestFirstName: '',
        guestLastName: '',
        guestPhone: '',
        guestEmail: '',
        guestIdNumber: '',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        nightlyRate: 65,
        depositAmount: 65,
        paymentMethod: PaymentMethod.CASH,
      });
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleCheckout = async () => {
    if (!activeFolioData?.reservation?.id) return;
    const ok = await settleCheckout(activeFolioData.reservation.id);
    if (ok) {
      setIsFolioModalOpen(false);
    }
  };

  const handleBlindDropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await closeShiftBlindDrop(Number(blindDropCash), varianceReason);
      setShiftResult(result);
    } catch (err: any) {
      alert(err.message || 'Failed to submit blind drop');
    }
  };

  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await openShift(Number(openingFloatAmount));
    if (ok) {
      setIsShiftModalOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VACANT_CLEAN':
        return <Badge color="green" variant="surface" radius="full">Vacant Clean</Badge>;
      case 'INSPECTED':
        return <Badge color="cyan" variant="surface" radius="full">Inspected</Badge>;
      case 'OCCUPIED_CLEAN':
      case 'OCCUPIED_DIRTY':
        return <Badge color="purple" variant="surface" radius="full">Occupied</Badge>;
      case 'CLEANING_IN_PROGRESS':
        return <Badge color="amber" variant="surface" radius="full">Cleaning</Badge>;
      case 'VACANT_DIRTY':
        return <Badge color="ruby" variant="surface" radius="full">Vacant Dirty</Badge>;
      default:
        return <Badge color="gray" variant="surface" radius="full">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <Box className="space-y-5">
      
      {/* Control Bar: Filters & Action Buttons */}
      <Card size="2" className="glass-panel border-slate-800">
        <Flex justify="between" align="center" wrap="wrap" gap="3">
          
          {/* Status Filter Segmented Control */}
          <SegmentedControl.Root
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val)}
            size="2"
            radius="large"
          >
            <SegmentedControl.Item value="ALL">All Rooms ({rooms.length})</SegmentedControl.Item>
            <SegmentedControl.Item value="VACANT">Vacant / Ready</SegmentedControl.Item>
            <SegmentedControl.Item value="OCCUPIED">Occupied</SegmentedControl.Item>
            <SegmentedControl.Item value="DIRTY">Needs Cleaning</SegmentedControl.Item>
          </SegmentedControl.Root>

          {/* Action Buttons */}
          <Flex align="center" gap="3">
            <Button
              variant="soft"
              color="grass"
              size="2"
              radius="large"
              onClick={() => setIsShiftModalOpen(true)}
              className="cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Shift Drawer</span>
            </Button>

            <Button
              variant="solid"
              color="iris"
              size="2"
              radius="large"
              onClick={() => setIsWalkInModalOpen(true)}
              className="cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Express Walk-In</span>
            </Button>
          </Flex>

        </Flex>
      </Card>

      {/* Tape Chart / Room Matrix Grid */}
      <Grid columns={{ initial: '1', sm: '2', md: '3', lg: '4' }} gap="4">
        {filteredRooms.map((room) => {
          const isOccupied = room.status.startsWith('OCCUPIED');
          const isClean = room.status === 'VACANT_CLEAN' || room.status === 'INSPECTED';
          const isDirty = room.status.includes('DIRTY') || room.status === 'CLEANING_IN_PROGRESS';

          return (
            <Card
              key={room.id}
              size="2"
              className={`room-card relative overflow-hidden transition-all ${
                isOccupied
                  ? 'border-l-4 border-l-purple-500 bg-purple-950/20'
                  : isClean
                  ? 'border-l-4 border-l-emerald-500 bg-emerald-950/15'
                  : 'border-l-4 border-l-rose-500 bg-rose-950/15'
              }`}
            >
              {/* Room Top Line */}
              <Flex justify="between" align="start" mb="2">
                <Box>
                  <Flex align="center" gap="2">
                    <Heading size="6" className="font-heading font-extrabold text-white">
                      {room.roomNumber}
                    </Heading>
                    <Badge color="gray" variant="surface" size="1" radius="medium">
                      F{room.floor} • {room.roomType.code}
                    </Badge>
                  </Flex>
                  <Text size="1" color="gray" className="mt-0.5 block truncate max-w-[160px]">
                    {room.roomType.name}
                  </Text>
                </Box>
                
                {getStatusBadge(room.status)}
              </Flex>

              {/* Room Rate */}
              <Flex justify="between" align="center" mb="3">
                <Text size="1" color="gray">Nightly Rate</Text>
                <Text size="2" weight="bold" className="text-indigo-300">
                  ${room.roomType.basePrice}<span className="text-[10px] text-slate-400 font-normal">/night</span>
                </Text>
              </Flex>

              {/* Occupied Reservation Pill */}
              {isOccupied ? (
                <Card variant="surface" size="1" className="bg-slate-900/80 border-purple-500/20 mb-3 p-2">
                  <Flex justify="between" align="center">
                    <Flex align="center" gap="1.5">
                      <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                      <Text size="1" weight="bold" color="purple">Guest In-House</Text>
                    </Flex>
                    <Badge color="purple" variant="solid" size="1" radius="full">Active Folio</Badge>
                  </Flex>
                  <Text size="1" color="gray" className="truncate mt-1 block">
                    Res #{room.currentReservationId?.substring(0, 8)}
                  </Text>
                </Card>
              ) : (
                <Card variant="surface" size="1" className="bg-slate-900/40 border-slate-800 mb-3 p-2 text-center">
                  <Text size="1" color={isClean ? "green" : "amber"}>
                    {isClean ? '✓ Ready for Guest Check-In' : '⚠️ Housekeeping Required'}
                  </Text>
                </Card>
              )}

              {/* Action Buttons */}
              <Flex align="center" gap="2" pt="2" className="border-t border-slate-800/80">
                {isOccupied ? (
                  <Button
                    variant="soft"
                    color="purple"
                    size="1"
                    radius="large"
                    className="w-full cursor-pointer"
                    onClick={() => handleOpenFolio(room)}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Manage Folio / Checkout</span>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="solid"
                      color="iris"
                      size="1"
                      radius="large"
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setWalkInForm((prev) => ({ 
                          ...prev, 
                          roomId: room.id, 
                          nightlyRate: room.roomType.basePrice, 
                          depositAmount: room.roomType.basePrice 
                        }));
                        setIsWalkInModalOpen(true);
                      }}
                    >
                      Walk-In Check-In
                    </Button>
                    {isDirty && (
                      <Tooltip content="Set Cleaning In Progress">
                        <IconButton
                          variant="soft"
                          color="amber"
                          size="1"
                          radius="large"
                          onClick={() => updateRoomStatus(room.id, RoomStatus.CLEANING_IN_PROGRESS)}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                )}
              </Flex>

            </Card>
          );
        })}
      </Grid>

      {/* DIALOG 1: Express Walk-In Check-In */}
      <Dialog.Root open={isWalkInModalOpen} onOpenChange={setIsWalkInModalOpen}>
        <Dialog.Content size="3" maxWidth="560px" className="p-6">
          <Flex justify="between" align="center" mb="4">
            <Flex align="center" gap="2">
              <Badge color="iris" variant="surface" size="2" radius="full">
                <Bed className="w-4 h-4" />
              </Badge>
              <Dialog.Title className="m-0">
                <Heading size="4" className="font-heading text-white">Express Walk-In Check-In</Heading>
              </Dialog.Title>
            </Flex>
            <Dialog.Close>
              <IconButton variant="ghost" color="gray" size="2" radius="medium">
                <X className="w-4 h-4" />
              </IconButton>
            </Dialog.Close>
          </Flex>

          <Dialog.Description size="2" color="gray" className="mb-4">
            Assign room, record guest information, and collect initial deposit tender.
          </Dialog.Description>

          <form onSubmit={handleWalkInSubmit}>
            <Flex direction="column" gap="3">
              
              {/* Room Selection */}
              <Box>
                <Text size="1" weight="bold" color="gray" className="mb-1 block">Room Assignment *</Text>
                <select
                  value={walkInForm.roomId}
                  onChange={(e) => {
                    const rm = rooms.find((r) => r.id === e.target.value);
                    setWalkInForm((prev) => ({
                      ...prev,
                      roomId: e.target.value,
                      nightlyRate: rm?.roomType?.basePrice || 65,
                      depositAmount: rm?.roomType?.basePrice || 65,
                    }));
                  }}
                  className="input-field"
                  required
                >
                  <option value="">-- Choose Vacant Room --</option>
                  {rooms
                    .filter((r) => !r.status.startsWith('OCCUPIED'))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} ({r.roomType.name}) - ${r.roomType.basePrice}/night - [{r.status}]
                      </option>
                    ))}
                </select>
              </Box>

              {/* Guest Details */}
              <Grid columns="2" gap="3">
                <Box>
                  <Text size="1" weight="bold" color="gray" className="mb-1 block">First Name *</Text>
                  <TextField.Root
                    size="2"
                    radius="large"
                    placeholder="e.g. John"
                    value={walkInForm.guestFirstName}
                    onChange={(e) => setWalkInForm({ ...walkInForm, guestFirstName: e.target.value })}
                    required
                  />
                </Box>
                <Box>
                  <Text size="1" weight="bold" color="gray" className="mb-1 block">Last Name *</Text>
                  <TextField.Root
                    size="2"
                    radius="large"
                    placeholder="e.g. Doe"
                    value={walkInForm.guestLastName}
                    onChange={(e) => setWalkInForm({ ...walkInForm, guestLastName: e.target.value })}
                    required
                  />
                </Box>
              </Grid>

              <Grid columns="2" gap="3">
                <Box>
                  <Text size="1" weight="bold" color="gray" className="mb-1 block">Phone / MoMo Number *</Text>
                  <TextField.Root
                    size="2"
                    radius="large"
                    placeholder="+233 24 000 0000"
                    value={walkInForm.guestPhone}
                    onChange={(e) => setWalkInForm({ ...walkInForm, guestPhone: e.target.value })}
                    required
                  />
                </Box>
                <Box>
                  <Text size="1" weight="bold" color="gray" className="mb-1 block">National ID / Passport #</Text>
                  <TextField.Root
                    size="2"
                    radius="large"
                    placeholder="GHA-00000000-0"
                    value={walkInForm.guestIdNumber}
                    onChange={(e) => setWalkInForm({ ...walkInForm, guestIdNumber: e.target.value })}
                  />
                </Box>
              </Grid>

              {/* Stay Dates */}
              <Grid columns="2" gap="3">
                <Box>
                  <Text size="1" weight="bold" color="gray" className="mb-1 block">Check-In Date</Text>
                  <TextField.Root
                    type="date"
                    size="2"
                    radius="large"
                    value={walkInForm.checkInDate}
                    onChange={(e) => setWalkInForm({ ...walkInForm, checkInDate: e.target.value })}
                  />
                </Box>
                <Box>
                  <Text size="1" weight="bold" color="gray" className="mb-1 block">Check-Out Date</Text>
                  <TextField.Root
                    type="date"
                    size="2"
                    radius="large"
                    value={walkInForm.checkOutDate}
                    onChange={(e) => setWalkInForm({ ...walkInForm, checkOutDate: e.target.value })}
                  />
                </Box>
              </Grid>

              {/* Deposit Tender Panel */}
              <Card variant="surface" size="2" className="bg-slate-900/90 border-slate-800 mt-2">
                <Flex justify="between" align="center" mb="2">
                  <Text size="2" weight="bold" className="text-white">Deposit & Payment Tender</Text>
                  <Text size="2" weight="bold" className="text-emerald-400">${walkInForm.nightlyRate}/night</Text>
                </Flex>

                <Grid columns="2" gap="3">
                  <Box>
                    <Text size="1" color="gray" className="mb-1 block">Deposit Amount ($)</Text>
                    <TextField.Root
                      type="number"
                      size="2"
                      radius="large"
                      value={String(walkInForm.depositAmount)}
                      onChange={(e) => setWalkInForm({ ...walkInForm, depositAmount: Number(e.target.value) })}
                    />
                  </Box>

                  <Box>
                    <Text size="1" color="gray" className="mb-1 block">Payment Method</Text>
                    <select
                      value={walkInForm.paymentMethod}
                      onChange={(e) => setWalkInForm({ ...walkInForm, paymentMethod: e.target.value as PaymentMethod })}
                      className="input-field"
                    >
                      <option value={PaymentMethod.CASH}>Cash (Front Desk)</option>
                      <option value={PaymentMethod.PAYSTACK_MOMO}>Paystack Mobile Money</option>
                      <option value={PaymentMethod.PAYSTACK_CARD}>Paystack Card</option>
                      <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                    </select>
                  </Box>
                </Grid>
              </Card>

              {/* Submit Buttons */}
              <Flex justify="end" gap="3" mt="3">
                <Dialog.Close>
                  <Button variant="soft" color="gray" size="2" radius="large" type="button">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button variant="solid" color="iris" size="2" radius="large" type="submit">
                  Confirm & Check-In
                </Button>
              </Flex>

            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Root>

      {/* DIALOG 2: Folio Management & Checkout */}
      <Dialog.Root open={isFolioModalOpen} onOpenChange={setIsFolioModalOpen}>
        <Dialog.Content size="3" maxWidth="520px" className="p-6">
          {activeFolioData && (
            <>
              <Flex justify="between" align="center" mb="4">
                <Flex align="center" gap="2">
                  <Badge color="purple" variant="surface" size="2" radius="full">
                    <Receipt className="w-4 h-4" />
                  </Badge>
                  <Dialog.Title className="m-0">
                    <Heading size="4" className="font-heading text-white">
                      Folio: Room {activeFolioData.room?.roomNumber}
                    </Heading>
                  </Dialog.Title>
                </Flex>
                <Dialog.Close>
                  <IconButton variant="ghost" color="gray" size="2" radius="medium">
                    <X className="w-4 h-4" />
                  </IconButton>
                </Dialog.Close>
              </Flex>

              <Flex direction="column" gap="4">
                
                {/* Guest Summary Card */}
                <Card variant="surface" size="2" className="bg-slate-900/80 border-slate-800">
                  <Flex justify="between" align="start">
                    <Box>
                      <Text size="1" color="gray">Guest Name</Text>
                      <Text size="3" weight="bold" className="text-white">
                        {activeFolioData.reservation?.guest?.firstName} {activeFolioData.reservation?.guest?.lastName}
                      </Text>
                      <Text size="1" color="indigo">{activeFolioData.reservation?.guest?.phone}</Text>
                    </Box>
                    <Box className="text-right">
                      <Text size="1" color="gray">Stay Period</Text>
                      <Text size="1" color="gray">
                        {activeFolioData.reservation?.checkInDate} to {activeFolioData.reservation?.checkOutDate}
                      </Text>
                      <Badge color="purple" variant="solid" size="1" radius="full" className="mt-1">
                        In-House
                      </Badge>
                    </Box>
                  </Flex>
                </Card>

                {/* Financial Charges Breakdown */}
                <Card variant="surface" size="2" className="bg-slate-900/90 border-purple-500/20">
                  <Flex justify="between" align="center" mb="2">
                    <Text size="2" color="gray">Estimated Room Charges</Text>
                    <Text size="2" weight="bold" className="text-slate-200">
                      ${activeFolioData.reservation?.totalEstimatedAmount?.toFixed(2)}
                    </Text>
                  </Flex>
                  <Flex justify="between" align="center" mb="2">
                    <Text size="2" color="green">Deposits / Payments Paid</Text>
                    <Text size="2" weight="bold" className="text-emerald-400">
                      -${activeFolioData.reservation?.depositPaid?.toFixed(2)}
                    </Text>
                  </Flex>
                  
                  <Separator size="4" my="2" />
                  
                  <Flex justify="between" align="center">
                    <Text size="3" weight="bold" className="text-white">Total Balance Due:</Text>
                    <Text size="5" weight="bold" className="text-purple-300 font-heading">
                      ${activeFolioData.balanceDue?.toFixed(2)}
                    </Text>
                  </Flex>
                </Card>

                {/* Actions */}
                <Flex justify="between" align="center" gap="3" pt="2">
                  <Button
                    variant="surface"
                    color="gray"
                    size="2"
                    radius="large"
                    onClick={() => printFolioReceipt(activeFolioData.reservation?.id)}
                  >
                    <Printer className="w-4 h-4" />
                    Print Receipt
                  </Button>

                  <Flex gap="2">
                    <Dialog.Close>
                      <Button variant="soft" color="gray" size="2" radius="large">
                        Close
                      </Button>
                    </Dialog.Close>
                    <Button
                      variant="solid"
                      color="purple"
                      size="2"
                      radius="large"
                      onClick={handleCheckout}
                    >
                      <LogOut className="w-4 h-4" />
                      Complete Check-Out
                    </Button>
                  </Flex>
                </Flex>

              </Flex>
            </>
          )}
        </Dialog.Content>
      </Dialog.Root>

      {/* DIALOG 3: Shift Drawer & Blind Cash Drop */}
      <Dialog.Root open={isShiftModalOpen} onOpenChange={(open) => { setIsShiftModalOpen(open); if (!open) setShiftResult(null); }}>
        <Dialog.Content size="3" maxWidth="480px" className="p-6">
          <Flex justify="between" align="center" mb="4">
            <Flex align="center" gap="2">
              <Badge color="grass" variant="surface" size="2" radius="full">
                <DollarSign className="w-4 h-4" />
              </Badge>
              <Dialog.Title className="m-0">
                <Heading size="4" className="font-heading text-white">Shift Cash Drawer & Audit</Heading>
              </Dialog.Title>
            </Flex>
            <Dialog.Close>
              <IconButton variant="ghost" color="gray" size="2" radius="medium">
                <X className="w-4 h-4" />
              </IconButton>
            </Dialog.Close>
          </Flex>

          {shiftResult ? (
            <Flex direction="column" gap="4">
              <Callout.Root color={shiftResult.closingResult.status === 'BALANCED' ? 'green' : 'amber'}>
                <Callout.Icon>
                  <CheckCircle2 className="w-5 h-5" />
                </Callout.Icon>
                <Callout.Text size="2">
                  <Text weight="bold" className="block mb-1">Shift Closed: {shiftResult.closingResult.status}</Text>
                  Counted: ${shiftResult.closingResult.actualBlindDropCash} | Expected: ${shiftResult.closingResult.expectedClosingCash}
                  <Text weight="bold" className="block mt-1">Variance: ${shiftResult.closingResult.cashVariance}</Text>
                </Callout.Text>
              </Callout.Root>

              <Card variant="surface" size="1" className="bg-slate-900/60 border-slate-800">
                <Text size="1" color="gray">
                  Thermal printer slip with closing reconciliation has been dispatched.
                </Text>
              </Card>

              <Button
                variant="solid"
                color="iris"
                size="3"
                radius="large"
                className="w-full"
                onClick={() => { setIsShiftModalOpen(false); setShiftResult(null); }}
              >
                Done
              </Button>
            </Flex>
          ) : activeShift ? (
            <form onSubmit={handleBlindDropSubmit}>
              <Flex direction="column" gap="3">
                <Card variant="surface" size="2" className="bg-slate-900/80 border-slate-800">
                  <Flex justify="between" mb="1">
                    <Text size="1" color="gray">Opened At</Text>
                    <Text size="1" color="gray">{new Date(activeShift.opened_at).toLocaleTimeString()}</Text>
                  </Flex>
                  <Flex justify="between">
                    <Text size="1" color="gray">Opening Float</Text>
                    <Text size="2" weight="bold" color="green">${activeShift.opening_cash_float}</Text>
                  </Flex>
                </Card>

                <Card variant="surface" size="2" className="bg-indigo-950/20 border-indigo-500/30">
                  <Flex align="center" gap="2" mb="1">
                    <ShieldAlert className="w-4 h-4 text-indigo-400" />
                    <Text size="2" weight="bold" className="text-indigo-200">Blind Cash Drop Handover</Text>
                  </Flex>
                  <Text size="1" color="gray" className="mb-3 block">
                    Count and enter physical cash in drawer. The system will record variance and lock shift logs.
                  </Text>

                  <Text size="1" weight="bold" color="gray" className="mb-1 block">Counted Cash in Drawer ($) *</Text>
                  <TextField.Root
                    size="3"
                    radius="large"
                    placeholder="e.g. 245.50"
                    value={blindDropCash}
                    onChange={(e) => setBlindDropCash(e.target.value)}
                    required
                  />
                </Card>

                <Box>
                  <Text size="1" color="gray" className="mb-1 block">Variance Note / Reason (Optional)</Text>
                  <TextField.Root
                    size="2"
                    radius="large"
                    placeholder="e.g. Minor coin shortage"
                    value={varianceReason}
                    onChange={(e) => setVarianceReason(e.target.value)}
                  />
                </Box>

                <Flex justify="end" gap="3" pt="2">
                  <Dialog.Close>
                    <Button variant="soft" color="gray" size="2" radius="large" type="button">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button variant="solid" color="ruby" size="2" radius="large" type="submit">
                    Close Shift & Print Slip
                  </Button>
                </Flex>
              </Flex>
            </form>
          ) : (
            <form onSubmit={handleOpenShiftSubmit}>
              <Flex direction="column" gap="4">
                <Text size="2" color="gray">
                  No active shift currently open for this terminal. Enter opening cash float to initialize shift drawer.
                </Text>

                <Box>
                  <Text size="1" weight="bold" color="gray" className="mb-1 block">Opening Cash Float ($) *</Text>
                  <TextField.Root
                    size="3"
                    radius="large"
                    value={openingFloatAmount}
                    onChange={(e) => setOpeningFloatAmount(e.target.value)}
                    required
                  />
                </Box>

                <Button variant="solid" color="grass" size="3" radius="large" type="submit" className="w-full">
                  Open New Shift
                </Button>
              </Flex>
            </form>
          )}

        </Dialog.Content>
      </Dialog.Root>

    </Box>
  );
};
