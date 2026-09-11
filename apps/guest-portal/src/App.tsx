import React, { useState } from 'react';
import {
  Box,
  Flex,
  Grid,
  Card,
  Heading,
  Text,
  Badge,
  Button,
  Dialog,
  TextField,
  Select,
  Separator,
  Inset,
  Container,
} from '@radix-ui/themes';
import {
  CalendarIcon,
  PersonIcon,
  CheckCircledIcon,
  ChevronRightIcon,
  DrawingPinIcon,
  MobileIcon,
  StarFilledIcon,
  LockClosedIcon,
} from '@radix-ui/react-icons';

interface RoomShowcase {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  amenities: string[];
  capacity: string;
}

const ROOMS_DATA: RoomShowcase[] = [
  {
    id: 'rt-std',
    name: 'Standard Queen Room',
    description: 'A serene, air-conditioned sanctuary with a comfortable plush queen bed, high-speed Wi-Fi, and a rainfall shower.',
    price: 65,
    capacity: '2 Adults',
    amenities: ['High-Speed Wi-Fi', 'Air Conditioning', 'Rainfall Shower', 'Smart TV', 'Work Desk'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'rt-dlx',
    name: 'Deluxe King Suite',
    description: 'Spacious open suite featuring a king-size bed, private sunset balcony, complimentary breakfast, and stocked minibar.',
    price: 110,
    capacity: '2 Adults, 2 Children',
    amenities: ['King Bed', 'Private Balcony', 'Complimentary Breakfast', 'Minibar', 'Ocean View'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'rt-exc',
    name: 'Executive Penthouse',
    description: 'The ultimate luxury experience. Includes private Jacuzzi on the terrace, VIP lounge access, and dedicated concierge.',
    price: 220,
    capacity: '4 Adults',
    amenities: ['Terrace Jacuzzi', 'VIP Lounge Access', 'Kitchenette', 'Dedicated Concierge', 'Airport Transfer'],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
  },
];

export const App: React.FC = () => {
  const [checkIn, setCheckIn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState<string>(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [adults, setAdults] = useState<string>('2');
  const [selectedRoom, setSelectedRoom] = useState<RoomShowcase | null>(null);

  // Guest booking details
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [momoProvider, setMomoProvider] = useState<string>('MTN Mobile Money');

  // Confirmation
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    ref: string;
    roomName: string;
    guestName: string;
    guestPhone: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalAmount: number;
    depositPaid: number;
    provider: string;
  } | null>(null);

  const calculateNights = () => {
    const d1 = new Date(checkIn).getTime();
    const d2 = new Date(checkOut).getTime();
    return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();

  const handlePaystackCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !guestName || !guestPhone) return;

    setIsProcessing(true);

    // Simulate instant Paystack deposit collection
    setTimeout(() => {
      const bookingRef = `GH-${Date.now().toString().slice(-6)}`;
      setConfirmedBooking({
        ref: bookingRef,
        roomName: selectedRoom.name,
        guestName,
        guestPhone,
        checkIn,
        checkOut,
        nights,
        totalAmount: selectedRoom.price * nights,
        depositPaid: selectedRoom.price * nights,
        provider: momoProvider,
      });
      setIsProcessing(false);
      setSelectedRoom(null);
    }, 1500);
  };

  return (
    <Box className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Box className="border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <Container size="4">
          <Flex align="center" justify="between">
            <Flex align="center" gap="3">
              <Flex
                align="center"
                justify="center"
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/25"
              >
                <DrawingPinIcon className="w-5 h-5 text-white" />
              </Flex>
              <Box>
                <Heading size="4" className="text-white tracking-tight font-heading">
                  Grand Horizon Hotel
                </Heading>
                <Flex align="center" gap="1">
                  <Text size="1" color="gray">
                    Accra, Ghana • Direct Reservations
                  </Text>
                </Flex>
              </Box>
            </Flex>

            <Flex align="center" gap="3">
              <Badge color="iris" variant="surface" size="2">
                <Flex align="center" gap="1">
                  <MobileIcon />
                  <Text size="1" weight="medium">+233 24 000 1122</Text>
                </Flex>
              </Badge>
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Hero Search Section */}
      <Box className="relative py-16 px-6 bg-gradient-to-b from-indigo-950/30 via-[#06090e] to-[#06090e] border-b border-white/5">
        <Container size="3" className="text-center space-y-4 mb-10">
          <Flex justify="center">
            <Badge color="iris" variant="soft" size="2" className="px-3 py-1">
              <Flex align="center" gap="1.5">
                <StarFilledIcon className="text-amber-400" />
                <Text size="1" weight="bold">Best Rate Direct Booking Guarantee</Text>
              </Flex>
            </Badge>
          </Flex>
          <Heading size="8" className="text-white tracking-tight font-heading font-black">
            Experience Luxury, Comfort & Ease
          </Heading>
          <Text size="3" color="gray" className="max-w-xl mx-auto block">
            Instant booking confirmation with automated Mobile Money (MTN, Telecel, AT) or Card payment.
          </Text>
        </Container>

        {/* Search Bar Filter */}
        <Container size="3">
          <Card size="3" variant="classic" className="bg-[#0e1424]/90 border border-white/10 shadow-2xl backdrop-blur-xl">
            <Grid columns={{ initial: '1', sm: '3' }} gap="4">
              <Box>
                <Text as="label" size="2" weight="bold" color="gray" className="mb-1 block">
                  <Flex align="center" gap="1">
                    <CalendarIcon /> Check-In
                  </Flex>
                </Text>
                <TextField.Root
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  size="3"
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" color="gray" className="mb-1 block">
                  <Flex align="center" gap="1">
                    <CalendarIcon /> Check-Out
                  </Flex>
                </Text>
                <TextField.Root
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  size="3"
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" color="gray" className="mb-1 block">
                  <Flex align="center" gap="1">
                    <PersonIcon /> Guests
                  </Flex>
                </Text>
                <Select.Root value={adults} onValueChange={setAdults} size="3">
                  <Select.Trigger className="w-full" />
                  <Select.Content position="popper">
                    <Select.Item value="1">1 Adult</Select.Item>
                    <Select.Item value="2">2 Adults</Select.Item>
                    <Select.Item value="3">3 Adults</Select.Item>
                    <Select.Item value="4">4 Adults</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>
            </Grid>
          </Card>
        </Container>
      </Box>

      {/* Room Showcase List */}
      <Container size="4" className="px-6 py-12 flex-1 w-full space-y-8">
        <Flex align="center" justify="between" wrap="wrap" gap="3">
          <Box>
            <Heading size="6" className="text-white font-heading">
              Available Accommodations
            </Heading>
            <Text size="2" color="gray">
              Showing standard, suite and executive penthouse rates
            </Text>
          </Box>
          <Badge color="iris" size="2" variant="outline">
            {checkIn} ➔ {checkOut} ({nights} {nights === 1 ? 'night' : 'nights'})
          </Badge>
        </Flex>

        <Grid columns={{ initial: '1', md: '3' }} gap="6">
          {ROOMS_DATA.map((room) => {
            const totalPrice = room.price * nights;

            return (
              <Card
                key={room.id}
                size="2"
                variant="classic"
                className="bg-[#0b0f19] border border-white/5 hover:border-indigo-500/40 transition flex flex-col justify-between overflow-hidden group shadow-xl"
              >
                <Box>
                  <Inset side="top" pb="current">
                    <Box className="h-48 overflow-hidden relative">
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <Box className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <Text size="2" weight="bold" className="text-emerald-400">
                          ${room.price} / night
                        </Text>
                      </Box>
                    </Box>
                  </Inset>

                  <Box p="3" className="space-y-3">
                    <Flex align="center" justify="between">
                      <Heading size="4" className="text-white group-hover:text-indigo-300 transition">
                        {room.name}
                      </Heading>
                      <Badge color="gray" size="1" variant="surface">{room.capacity}</Badge>
                    </Flex>
                    <Text size="2" color="gray" className="line-clamp-2">
                      {room.description}
                    </Text>

                    <Flex wrap="wrap" gap="1" pt="1">
                      {room.amenities.map((am) => (
                        <Badge key={am} size="1" color="gray" variant="soft">
                          {am}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                </Box>

                <Box p="3" pt="0">
                  <Separator size="4" my="3" className="opacity-20" />
                  <Flex align="center" justify="between">
                    <Box>
                      <Text size="1" color="gray" className="uppercase tracking-wider block">
                        TOTAL ({nights} {nights === 1 ? 'NIGHT' : 'NIGHTS'})
                      </Text>
                      <Heading size="5" className="text-white">
                        ${totalPrice}
                      </Heading>
                    </Box>

                    <Button
                      size="3"
                      color="iris"
                      variant="solid"
                      onClick={() => setSelectedRoom(room)}
                      className="cursor-pointer"
                    >
                      Book Now <ChevronRightIcon />
                    </Button>
                  </Flex>
                </Box>
              </Card>
            );
          })}
        </Grid>
      </Container>

      {/* Paystack Checkout Dialog */}
      <Dialog.Root open={!!selectedRoom} onOpenChange={(open) => !open && setSelectedRoom(null)}>
        <Dialog.Content maxWidth="480px" className="bg-[#0b0f19] border border-white/10 p-6">
          <Dialog.Title>
            <Flex align="center" gap="2" className="text-indigo-400">
              <LockClosedIcon className="w-5 h-5" />
              <Heading size="5" className="text-white">Instant Checkout</Heading>
            </Flex>
          </Dialog.Title>
          <Dialog.Description size="2" color="gray" mb="4">
            Direct reservation with instant mobile wallet and card settlement.
          </Dialog.Description>

          {selectedRoom && (
            <Card size="1" variant="surface" className="bg-[#070a12] border border-white/10 mb-4 p-3">
              <Flex justify="between" align="center">
                <Box>
                  <Text size="2" weight="bold" className="text-white">
                    {selectedRoom.name}
                  </Text>
                  <Text size="1" color="gray" className="block">
                    {checkIn} to {checkOut} ({nights} {nights === 1 ? 'night' : 'nights'})
                  </Text>
                </Box>
                <Heading size="5" className="text-emerald-400">
                  ${selectedRoom.price * nights}
                </Heading>
              </Flex>
            </Card>
          )}

          <form onSubmit={handlePaystackCheckout} className="space-y-3">
            <Box>
              <Text as="label" size="2" weight="bold" color="gray" className="mb-1 block">
                Full Name
              </Text>
              <TextField.Root
                required
                placeholder="e.g. Ama Serwah"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                size="3"
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" color="gray" className="mb-1 block">
                Mobile Money Phone Number
              </Text>
              <TextField.Root
                type="tel"
                required
                placeholder="024 000 0000"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                size="3"
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" color="gray" className="mb-1 block">
                Email Address (Optional)
              </Text>
              <TextField.Root
                type="email"
                placeholder="ama@gmail.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                size="3"
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" color="gray" className="mb-1 block">
                Payment Provider
              </Text>
              <Select.Root value={momoProvider} onValueChange={setMomoProvider} size="3">
                <Select.Trigger className="w-full" />
                <Select.Content position="popper">
                  <Select.Item value="MTN Mobile Money">MTN Mobile Money</Select.Item>
                  <Select.Item value="Telecel Cash">Telecel Cash</Select.Item>
                  <Select.Item value="AT Money">AT Money</Select.Item>
                  <Select.Item value="Visa / Mastercard">Debit / Credit Card</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            <Flex justify="end" gap="3" mt="5">
              <Dialog.Close>
                <Button variant="soft" color="gray" type="button">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                color="iris"
                size="3"
                disabled={isProcessing}
                className="cursor-pointer"
              >
                {isProcessing ? 'Authorizing Payment...' : `Pay $${(selectedRoom?.price || 0) * nights} via Paystack`}
              </Button>
            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Root>

      {/* Confirmation Dialog */}
      <Dialog.Root open={!!confirmedBooking} onOpenChange={(open) => !open && setConfirmedBooking(null)}>
        <Dialog.Content maxWidth="440px" className="bg-[#0b0f19] border border-emerald-500/30 text-center p-6">
          <Flex direction="column" align="center" gap="3">
            <Flex
              align="center"
              justify="center"
              className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400"
            >
              <CheckCircledIcon className="w-8 h-8" />
            </Flex>

            <Heading size="6" className="text-white">Booking Confirmed!</Heading>
            <Text size="2" color="gray">
              Your reservation has been secured and sent directly to the front desk master hub.
            </Text>

            {confirmedBooking && (
              <Card size="2" variant="surface" className="w-full bg-[#070a12] border border-white/10 text-left space-y-2 mt-2">
                <Flex justify="between">
                  <Text size="2" color="gray">Booking Ref:</Text>
                  <Text size="2" weight="bold" color="iris" className="font-mono">{confirmedBooking.ref}</Text>
                </Flex>
                <Flex justify="between">
                  <Text size="2" color="gray">Room Type:</Text>
                  <Text size="2" weight="bold" className="text-white">{confirmedBooking.roomName}</Text>
                </Flex>
                <Flex justify="between">
                  <Text size="2" color="gray">Dates:</Text>
                  <Text size="2" color="gray">{confirmedBooking.checkIn} to {confirmedBooking.checkOut}</Text>
                </Flex>
                <Flex justify="between">
                  <Text size="2" color="gray">Payment Status:</Text>
                  <Badge color="green" size="1">{confirmedBooking.provider} (Paid)</Badge>
                </Flex>
              </Card>
            )}

            <Button
              size="3"
              color="iris"
              className="w-full mt-4 cursor-pointer"
              onClick={() => setConfirmedBooking(null)}
            >
              Done
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Footer */}
      <Box className="border-t border-white/5 py-6 px-6 text-center">
        <Text size="1" color="gray">
          Grand Horizon Hotel & Suites • Powered by Hospware Cloud Direct Booking Engine
        </Text>
      </Box>
    </Box>
  );
};

export default App;
