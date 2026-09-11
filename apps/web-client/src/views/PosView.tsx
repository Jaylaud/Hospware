import React, { useState, useEffect } from 'react';
import { useHub } from '../context/HubContext';
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
  SegmentedControl,
  Callout,
  Separator,
  ScrollArea
} from '@radix-ui/themes';
import { 
  UtensilsCrossed, 
  Plus, 
  Minus, 
  Printer, 
  CheckCircle2, 
  BedDouble, 
  DollarSign, 
  CreditCard,
  ChefHat
} from 'lucide-react';

export const PosView: React.FC = () => {
  const { postPosOrder } = useHub();
  const [menu, setMenu] = useState<any[]>([]);
  const [occupiedRooms, setOccupiedRooms] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Cart state
  const [cart, setCart] = useState<{ item: any; quantity: number; notes?: string }[]>([]);
  const [destinationType, setDestinationType] = useState<'ROOM_CHARGE' | 'WALK_IN_CASH' | 'PAYSTACK'>('ROOM_CHARGE');
  const [selectedRoomFolio, setSelectedRoomFolio] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOrderSlip, setLastOrderSlip] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/pos/menu')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMenu(d.data);
      });

    fetch('/api/pos/occupied-rooms')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setOccupiedRooms(d.data);
          if (d.data.length > 0) {
            setSelectedRoomFolio(d.data[0]);
          }
        }
      });
  }, []);

  const categories = ['ALL', ...Array.from(new Set(menu.map((m) => m.category)))];

  const filteredMenu = menu.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as any[];
    });
  };

  const cartSubtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    if (destinationType === 'ROOM_CHARGE' && !selectedRoomFolio) {
      alert('Please select an occupied room to post room charge.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        destinationType,
        targetRoomFolioId: destinationType === 'ROOM_CHARGE' ? selectedRoomFolio?.folioId : null,
        roomNumber: destinationType === 'ROOM_CHARGE' ? selectedRoomFolio?.roomNumber : null,
        items: cart.map((c) => ({
          id: c.item.id,
          name: c.item.name,
          price: c.item.price,
          quantity: c.quantity,
          notes: c.notes,
        })),
      };

      const result = await postPosOrder(orderPayload);
      setLastOrderSlip(result);
      setCart([]);
    } catch (err: any) {
      alert(err.message || 'Order submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Grid columns={{ initial: '1', lg: '3' }} gap="6" className="max-w-7xl mx-auto">
      
      {/* Left: Menu Catalog (2 Cols) */}
      <Box className="lg:col-span-2 space-y-4">
        
        {/* Category Filter */}
        <Card size="2" className="glass-panel border-slate-800">
          <Flex align="center" gap="2" wrap="wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "solid" : "soft"}
                color={selectedCategory === cat ? "iris" : "gray"}
                size="2"
                radius="large"
                className="cursor-pointer font-medium"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </Flex>
        </Card>

        {/* Menu Items Grid */}
        <Grid columns={{ initial: '2', sm: '3' }} gap="3">
          {filteredMenu.map((item) => (
            <Card
              key={item.id}
              size="2"
              className="room-card relative overflow-hidden transition-all flex flex-col justify-between h-32 cursor-pointer group hover:border-indigo-500/50 bg-slate-900/60"
              onClick={() => addToCart(item)}
            >
              <Box>
                <Badge color="iris" variant="surface" size="1" radius="medium" className="mb-1 uppercase">
                  {item.category}
                </Badge>
                <Heading size="3" className="font-heading font-bold text-white line-clamp-2 group-hover:text-indigo-200 transition-colors">
                  {item.name}
                </Heading>
              </Box>

              <Flex justify="between" align="center" pt="2" className="border-t border-slate-800/80">
                <Text size="3" weight="bold" className="text-emerald-400 font-heading">
                  ${item.price.toFixed(2)}
                </Text>
                <Badge color="iris" variant="solid" size="1" radius="medium">
                  <Plus className="w-3.5 h-3.5" />
                </Badge>
              </Flex>
            </Card>
          ))}
        </Grid>

      </Box>

      {/* Right: Order Cart & Routing */}
      <Box className="space-y-4">
        
        <Card size="3" className="glass-panel border-slate-800 sticky top-20">
          <Flex direction="column" gap="4">
            
            {/* Header */}
            <Flex justify="between" align="center" pb="3" className="border-b border-slate-800">
              <Flex align="center" gap="2">
                <Badge color="iris" variant="surface" size="2" radius="full">
                  <ChefHat className="w-4 h-4" />
                </Badge>
                <Heading size="3" className="font-heading text-white">Current Order</Heading>
              </Flex>
              <Badge color="gray" variant="surface" size="2" radius="medium">
                {cart.reduce((sum, c) => sum + c.quantity, 0)} items
              </Badge>
            </Flex>

            {/* Cart Items List */}
            <Box className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <Box className="text-center py-8">
                  <UtensilsCrossed className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <Text size="2" color="gray">
                    Tap items on the left to add to order
                  </Text>
                </Box>
              ) : (
                cart.map((c) => (
                  <Card key={c.item.id} variant="surface" size="1" className="bg-slate-900/80 border-slate-800 p-2.5">
                    <Flex justify="between" align="center" gap="2">
                      <Box className="flex-1 min-w-0">
                        <Text size="2" weight="bold" className="text-white truncate block">
                          {c.item.name}
                        </Text>
                        <Text size="1" color="gray">
                          ${c.item.price.toFixed(2)} × {c.quantity} = <span className="text-emerald-400 font-bold">${(c.item.price * c.quantity).toFixed(2)}</span>
                        </Text>
                      </Box>

                      {/* Quantity Steppers */}
                      <Flex align="center" gap="1.5">
                        <IconButton
                          variant="soft"
                          color="gray"
                          size="1"
                          radius="medium"
                          onClick={(e) => { e.stopPropagation(); updateQuantity(c.item.id, -1); }}
                        >
                          <Minus className="w-3 h-3" />
                        </IconButton>
                        <Text size="2" weight="bold" className="w-5 text-center text-white">
                          {c.quantity}
                        </Text>
                        <IconButton
                          variant="soft"
                          color="iris"
                          size="1"
                          radius="medium"
                          onClick={(e) => { e.stopPropagation(); updateQuantity(c.item.id, 1); }}
                        >
                          <Plus className="w-3 h-3" />
                        </IconButton>
                      </Flex>
                    </Flex>
                  </Card>
                ))
              )}
            </Box>

            {/* Routing Destination */}
            <Box className="space-y-3 pt-2 border-t border-slate-800">
              <Text size="1" weight="bold" color="gray" className="block">Payment & Room Routing</Text>
              
              <SegmentedControl.Root
                value={destinationType}
                onValueChange={(val: any) => setDestinationType(val)}
                size="2"
                radius="large"
              >
                <SegmentedControl.Item value="ROOM_CHARGE">
                  <Flex align="center" gap="1.5">
                    <BedDouble className="w-3.5 h-3.5" />
                    <span>Room Folio</span>
                  </Flex>
                </SegmentedControl.Item>
                <SegmentedControl.Item value="WALK_IN_CASH">
                  <Flex align="center" gap="1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Direct Cash</span>
                  </Flex>
                </SegmentedControl.Item>
                <SegmentedControl.Item value="PAYSTACK">
                  <Flex align="center" gap="1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Paystack</span>
                  </Flex>
                </SegmentedControl.Item>
              </SegmentedControl.Root>

              {/* Room Selector if Room Charge */}
              {destinationType === 'ROOM_CHARGE' && (
                <Box className="pt-1">
                  <Text size="1" color="gray" className="mb-1 block">Assign to Occupied Room:</Text>
                  {occupiedRooms.length === 0 ? (
                    <Callout.Root color="amber" size="1">
                      <Callout.Text size="1">No occupied rooms currently in-house.</Callout.Text>
                    </Callout.Root>
                  ) : (
                    <select
                      value={selectedRoomFolio?.folioId || ''}
                      onChange={(e) => {
                        const sel = occupiedRooms.find((r) => r.folioId === e.target.value);
                        setSelectedRoomFolio(sel);
                      }}
                      className="input-field text-xs"
                    >
                      {occupiedRooms.map((r) => (
                        <option key={r.folioId} value={r.folioId}>
                          Room {r.roomNumber} - {r.guestName}
                        </option>
                      ))}
                    </select>
                  )}
                </Box>
              )}
            </Box>

            {/* Subtotal & Submit */}
            <Box className="pt-2 border-t border-slate-800 space-y-3">
              <Flex justify="between" align="center">
                <Text size="3" weight="bold" color="gray">Total Due:</Text>
                <Text size="6" weight="bold" className="text-emerald-400 font-heading">
                  ${cartSubtotal.toFixed(2)}
                </Text>
              </Flex>

              <Button
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleSubmitOrder}
                variant="solid"
                color="iris"
                size="3"
                radius="large"
                className="w-full cursor-pointer font-bold shadow-lg shadow-indigo-600/30"
              >
                <Printer className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending to Kitchen...' : 'Send to Kitchen (Print KOT)'}</span>
              </Button>
            </Box>

          </Flex>
        </Card>

        {/* Last KOT Order Confirmation Slip */}
        {lastOrderSlip && (
          <Callout.Root color="green" size="2">
            <Callout.Icon>
              <CheckCircle2 className="w-5 h-5" />
            </Callout.Icon>
            <Callout.Text size="2">
              <Text weight="bold" className="block mb-0.5">Order #{lastOrderSlip.orderNumber} Sent</Text>
              Kitchen Order Ticket printed. Total: ${lastOrderSlip.totalAmount.toFixed(2)} ({lastOrderSlip.destinationType})
            </Callout.Text>
          </Callout.Root>
        )}

      </Box>

    </Grid>
  );
};
