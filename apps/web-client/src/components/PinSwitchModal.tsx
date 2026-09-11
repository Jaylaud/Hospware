import React, { useState } from 'react';
import { useHub } from '../context/HubContext';
import { 
  Dialog, 
  Flex, 
  Box, 
  Text, 
  Heading, 
  Button, 
  IconButton, 
  Callout, 
  Grid,
  Card,
  Badge
} from '@radix-ui/themes';
import { Delete, Lock, AlertCircle, X } from 'lucide-react';

interface PinSwitchModalProps {
  onClose: () => void;
}

export const PinSwitchModal: React.FC<PinSwitchModalProps> = ({ onClose }) => {
  const { switchUser } = useHub();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const verifyPin = (enteredPin: string) => {
    const success = switchUser(enteredPin);
    if (success) {
      onClose();
    } else {
      setError('Invalid PIN Code. Try: 1234 (Owner), 2222 (Front Desk), 3333 (Housekeeping), 4444 (Bar)');
      setPin('');
    }
  };

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content size="2" maxWidth="380px" className="p-6">
        
        {/* Header */}
        <Flex justify="between" align="center" mb="4">
          <Flex align="center" gap="2">
            <Badge color="iris" variant="surface" size="2" radius="full">
              <Lock className="w-3.5 h-3.5" />
            </Badge>
            <Dialog.Title className="m-0">
              <Heading size="4" className="font-heading text-white">Staff PIN Switch</Heading>
            </Dialog.Title>
          </Flex>
          <Dialog.Close>
            <IconButton variant="ghost" color="gray" size="2" radius="medium" onClick={onClose}>
              <X className="w-4 h-4" />
            </IconButton>
          </Dialog.Close>
        </Flex>

        <Dialog.Description size="2" color="gray" className="mb-5 text-center">
          Enter your 4-digit staff PIN code to switch active operator profile
        </Dialog.Description>

        {/* Masked PIN Indicator */}
        <Flex align="center" justify="center" gap="3" my="4">
          {[0, 1, 2, 3].map((idx) => (
            <Box
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                pin.length > idx
                  ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-lg shadow-indigo-500/50'
                  : 'border-slate-700 bg-slate-900/80'
              }`}
            />
          ))}
        </Flex>

        {error && (
          <Callout.Root color="ruby" size="1" className="mb-4">
            <Callout.Icon>
              <AlertCircle className="w-4 h-4" />
            </Callout.Icon>
            <Callout.Text size="1">{error}</Callout.Text>
          </Callout.Root>
        )}

        {/* Touch Keypad Grid */}
        <Grid columns="3" gap="2" mb="4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <Button
              key={d}
              variant="surface"
              color="gray"
              size="4"
              radius="large"
              className="keypad-btn text-xl font-bold h-14"
              onClick={() => handleDigit(d)}
            >
              {d}
            </Button>
          ))}
          <Button
            variant="soft"
            color="gray"
            size="4"
            radius="large"
            className="keypad-btn text-xs font-semibold h-14"
            onClick={() => setPin('')}
          >
            CLEAR
          </Button>
          <Button
            variant="surface"
            color="gray"
            size="4"
            radius="large"
            className="keypad-btn text-xl font-bold h-14"
            onClick={() => handleDigit('0')}
          >
            0
          </Button>
          <Button
            variant="soft"
            color="ruby"
            size="4"
            radius="large"
            className="keypad-btn h-14"
            onClick={handleDelete}
          >
            <Delete className="w-5 h-5" />
          </Button>
        </Grid>

        {/* Demo Staff Hints */}
        <Card variant="surface" size="1" className="bg-slate-900/60 border-slate-800">
          <Text size="1" weight="bold" color="gray" className="block mb-1">
            Demo Operator Credentials:
          </Text>
          <Grid columns="2" gap="1">
            <Text size="1" color="gray">🔑 1234: GM / Owner</Text>
            <Text size="1" color="gray">🔑 2222: Front Desk</Text>
            <Text size="1" color="gray">🔑 3333: Housekeeper</Text>
            <Text size="1" color="gray">🔑 4444: Bar / POS</Text>
          </Grid>
        </Card>

      </Dialog.Content>
    </Dialog.Root>
  );
};
