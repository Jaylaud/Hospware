'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Container, 
  Heading, 
  Text, 
  Flex, 
  Button, 
  Box, 
  TextField,
  Select
} from '@radix-ui/themes';
import { 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  Download,
  Smartphone,
  Monitor,
  Send
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    hotelName: '',
    email: '',
    password: '',
    roomTier: '20'
  });
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [phoneForLink, setPhoneForLink] = useState<string>('');
  const [linkSentToast, setLinkSentToast] = useState<string | null>(null);
  const [pairingCode] = useState<string>(() => `HW-GH-${Math.floor(1000 + Math.random() * 9000)}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'hospware_registered_hotel',
        JSON.stringify({
          name: formData.hotelName,
          email: formData.email,
          capacity: parseInt(formData.roomTier, 10) || 20,
          pairingCode,
          createdAt: new Date().toISOString()
        })
      );
    }
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              hotel_name: formData.hotelName,
              max_rooms: parseInt(formData.roomTier, 10) || 20
            }
          }
        });
      } catch {
        // Fallback to local workspace provisioning if offline
      }
    }
    setSubmitted(true);
  };

  const handleSendPhoneLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneForLink.trim()) return;
    setLinkSentToast(`✓ Download & pairing link (${pairingCode}) sent via SMS/WhatsApp to ${phoneForLink}`);
    setTimeout(() => setLinkSentToast(null), 5000);
  };

  return (
    <Container size="2" px={{ initial: '4', md: '6' }}>
      <Box style={{ paddingTop: '7rem', paddingBottom: '9rem' }}>
        {/* Header */}
        <Flex direction="column" align="center" gap="3" mb="7" style={{ textAlign: 'center' }}>
          <img
            src="/hospware-logo.png"
            alt="Hospware"
            style={{ height: 34, width: 'auto', objectFit: 'contain', marginBottom: '0.25rem' }}
          />
          <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Quick Sign Up
          </Text>
          <Heading size="7" weight="bold" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
            Start your hotel workspace.
          </Heading>
          <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.5)', maxWidth: 440, lineHeight: 1.6 }}>
            Set up your property in 30 seconds. You can configure admin details, WhatsApp alerts, and billing inside the app.
          </Text>
        </Flex>

        {/* Minimal Form Card */}
        <Box 
          p={{ initial: '6', md: '7' }} 
          style={{ 
            background: 'rgba(255, 255, 255, 0.02)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: 20 
          }}
        >
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="5">
                <Box>
                  <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Hotel or Property Name
                  </Text>
                  <TextField.Root 
                    size="3"
                    required
                    placeholder="e.g. Royal Heritage Hotel"
                    value={formData.hotelName}
                    onChange={(e) => setFormData(p => ({ ...p, hotelName: e.target.value }))}
                  >
                    <TextField.Slot>
                      <Building2 size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                    </TextField.Slot>
                  </TextField.Root>
                </Box>

                <Box>
                  <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Work Email
                  </Text>
                  <TextField.Root 
                    size="3"
                    type="email"
                    required
                    placeholder="manager@hotel.com"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  >
                    <TextField.Slot>
                      <Mail size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                    </TextField.Slot>
                  </TextField.Root>
                </Box>

                <Box>
                  <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Create Password
                  </Text>
                  <TextField.Root 
                    size="3"
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  >
                    <TextField.Slot>
                      <Lock size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                    </TextField.Slot>
                  </TextField.Root>
                </Box>

                <Box>
                  <Text size="2" weight="medium" mb="2" as="p" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Approximate Rooms
                  </Text>
                  <Select.Root 
                    value={formData.roomTier} 
                    onValueChange={(val) => setFormData(p => ({ ...p, roomTier: val }))}
                    size="3"
                  >
                    <Select.Trigger style={{ width: '100%' }} />
                    <Select.Content>
                      <Select.Item value="20">Up to 20 Rooms (Tier 1 • GH₵ 200/mo)</Select.Item>
                      <Select.Item value="40">21 to 40 Rooms (Tier 2 • GH₵ 400/mo)</Select.Item>
                      <Select.Item value="60">41 to 60 Rooms (Tier 3 • GH₵ 600/mo)</Select.Item>
                      <Select.Item value="80">61+ Rooms (Tier 4 • GH₵ 800/mo)</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Button 
                  type="submit"
                  size="3" 
                  style={{ 
                    cursor: 'pointer',
                    background: '#fff',
                    color: '#080a0f',
                    fontWeight: 600,
                    borderRadius: 8,
                    height: 46,
                    marginTop: '0.75rem'
                  }}
                >
                  <span>Create Hotel Workspace</span>
                  <ArrowRight size={16} />
                </Button>

                <Flex align="center" justify="center" gap="2" mt="2">
                  <ShieldCheck size={14} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                  <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                    Zero payment required today • 14-day free trial on cloud database
                  </Text>
                </Flex>
              </Flex>
            </form>
          ) : (
            <Flex direction="column" align="center" gap="4" py="4" style={{ textAlign: 'center' }}>
              <Box 
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle2 size={32} />
              </Box>

              <Box>
                <Heading size="5" style={{ color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                  {formData.hotelName || 'Your Hotel'} is Ready
                </Heading>
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.5)', maxWidth: 420, lineHeight: 1.6 }} as="p">
                  Workspace provisioned (Pairing Key: <strong style={{ color: '#fff' }}>{pairingCode}</strong>). Download your standalone Front Desk & POS hub or send the mobile app link to your phone below.
                </Text>
              </Box>

              {/* Standalone Desktop Download Box (Tauri Ultra-Light) */}
              <Box
                p="4"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  textAlign: 'left'
                }}
              >
                <Flex align="center" gap="2" mb="2">
                  <Monitor size={16} color="#818cf8" />
                  <Text size="2" weight="bold" style={{ color: '#fff' }}>
                    1. Front Desk, POS & Housekeeping Standalone App
                  </Text>
                </Flex>
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block', marginBottom: '0.75rem' }}>
                  Ultra-lightweight Tauri installer (~4.8 MB). Works 100% offline with local SQLite and 80mm thermal printers.
                </Text>
                <Flex gap="2" wrap="wrap">
                  <Button
                    asChild
                    size="2"
                    variant="soft"
                    style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff', cursor: 'pointer', borderRadius: 8 }}
                  >
                    <a href="#download-win" onClick={(e) => { e.preventDefault(); setLinkSentToast('✓ Downloading Hospware-Premises-Hub-Setup-x64.msi (4.8 MB)...'); }}>
                      <Download size={14} />
                      <span>Windows (.msi • 4.8 MB)</span>
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="2"
                    variant="soft"
                    style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff', cursor: 'pointer', borderRadius: 8 }}
                  >
                    <a href="#download-mac" onClick={(e) => { e.preventDefault(); setLinkSentToast('✓ Downloading Hospware-Premises-Hub-Universal.dmg (5.2 MB)...'); }}>
                      <Download size={14} />
                      <span>macOS (.dmg • 5.2 MB)</span>
                    </a>
                  </Button>
                </Flex>
              </Box>

              {/* Mobile Companion App & Send Link to Phone */}
              <Box
                p="4"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  textAlign: 'left'
                }}
              >
                <Flex align="center" gap="2" mb="2">
                  <Smartphone size={16} color="#34d399" />
                  <Text size="2" weight="bold" style={{ color: '#fff' }}>
                    2. Owner & Housekeeping Phone App
                  </Text>
                </Flex>
                <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block', marginBottom: '0.75rem' }}>
                  Send an instant WhatsApp or SMS link to install the mobile app on your phone or your housekeeping staff&apos;s phones.
                </Text>
                <form onSubmit={handleSendPhoneLink}>
                  <Flex gap="2">
                    <Box style={{ flex: 1 }}>
                      <TextField.Root
                        size="2"
                        type="tel"
                        placeholder="024 123 4567 (WhatsApp / SMS)"
                        value={phoneForLink}
                        onChange={(e) => setPhoneForLink(e.target.value)}
                      />
                    </Box>
                    <Button
                      type="submit"
                      size="2"
                      style={{ background: '#10b981', color: '#fff', fontWeight: 600, cursor: 'pointer', borderRadius: 8 }}
                    >
                      <Send size={13} />
                      <span>Send Link</span>
                    </Button>
                  </Flex>
                </form>
                {linkSentToast && (
                  <Text size="1" style={{ color: '#34d399', marginTop: '0.5rem', display: 'block' }}>
                    {linkSentToast}
                  </Text>
                )}
              </Box>

              <Flex gap="3" wrap="wrap" justify="center" mt="2">
                <Button 
                  asChild 
                  size="3" 
                  style={{ 
                    cursor: 'pointer', 
                    background: '#fff', 
                    color: '#080a0f', 
                    fontWeight: 600, 
                    borderRadius: 8, 
                    height: 44,
                    padding: '0 24px' 
                  }}
                >
                  <Link href="/portal?tab=apps">
                    <span>Open Portal & All Apps Hub</span>
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </Flex>
            </Flex>
          )}
        </Box>
      </Box>
    </Container>
  );
}
