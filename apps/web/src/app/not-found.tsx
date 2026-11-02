import Link from 'next/link';
import { Container, Flex, Heading, Text, Button, Box } from '@radix-ui/themes';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <Container size="2" px={{ initial: '4', md: '6' }}>
      <Box style={{ textAlign: 'center', paddingTop: '10rem', paddingBottom: '10rem' }}>
        <Flex direction="column" align="center" gap="4">
          <Text size="8" weight="bold" style={{ color: '#fff', letterSpacing: '-0.04em' }}>404</Text>
          <Heading size="6" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
            Page Not Found
          </Heading>
          <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.45)', maxWidth: 420, lineHeight: 1.6 }}>
            The page you are looking for does not exist or has been moved.
          </Text>
          <Flex gap="3" mt="3">
            <Button asChild size="3" style={{ background: '#fff', color: '#080a0f', fontWeight: 600, borderRadius: 8 }}>
              <Link href="/">
                <ArrowLeft size={16} /> Return Home
              </Link>
            </Button>
            <Button asChild size="3" variant="outline" style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', borderRadius: 8 }}>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Container>
  );
}
