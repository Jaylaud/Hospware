import Link from 'next/link';
import { Container, Grid, Flex, Box, Text, Separator } from '@radix-ui/themes';

export default function Footer() {
  return (
    <Box 
      asChild
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'transparent',
        marginTop: '10rem',
        paddingTop: '5rem',
        paddingBottom: '4rem'
      }}
    >
      <footer>
        <Container size="4" px={{ initial: '4', md: '6' }}>
          <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="8" mb="9">
            {/* Col 1 */}
            <Box>
              <Box mb="3">
                <img
                  src="/hospware-logo.png"
                  alt="Hospware"
                  style={{
                    height: 28,
                    width: 'auto',
                    display: 'block',
                    objectFit: 'contain'
                  }}
                />
              </Box>
              <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.7 }} as="p">
                Offline-first hotel management and cloud reporting platform built for Ghana and West Africa.
              </Text>
            </Box>

            {/* Col 2 */}
            <Box>
              <Text size="2" weight="medium" style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '1.25rem' }}>
                Platform
              </Text>
              <Flex direction="column" gap="3">
                <Link href="/" style={{ color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  Overview
                </Link>
                <Link href="/#architecture" style={{ color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  Architecture
                </Link>
                <Link href="/pricing" style={{ color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  Pricing & Plans
                </Link>
                <Link href="/register" style={{ color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  Register Hotel
                </Link>
                <Link href="/portal" style={{ color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  Owner Portal
                </Link>
              </Flex>
            </Box>

            {/* Col 3 */}
            <Box>
              <Text size="2" weight="medium" style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '1.25rem' }}>
                Add-on Modules
              </Text>
              <Flex direction="column" gap="3">
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Restaurant & Bar POS</Text>
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>WhatsApp & SMS Receipts</Text>
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Mobile Housekeeping</Text>
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Staff Shift PIN Security</Text>
              </Flex>
            </Box>

            {/* Col 4 */}
            <Box>
              <Text size="2" weight="medium" style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '1.25rem' }}>
                Contact & Support
              </Text>
              <Flex direction="column" gap="3">
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Accra, Ghana</Text>
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>+233 24 555 0199</Text>
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>support@hospware.com</Text>
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>MTN MoMo & Telecel Cash</Text>
              </Flex>
            </Box>
          </Grid>

          <Separator size="4" mb="6" style={{ opacity: 0.05 }} />

          <Flex justify="between" align="center" wrap="wrap" gap="4">
            <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
              © {new Date().getFullYear()} Hospware Technologies Ltd.
            </Text>
            <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
              Engineered for hospitality operations in Ghana.
            </Text>
          </Flex>
        </Container>
      </footer>
    </Box>
  );
}
