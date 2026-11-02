'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Container, Flex, Button } from '@radix-ui/themes';
import { ExternalLink } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <Box 
      position="sticky" 
      top="0" 
      style={{
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(7, 9, 14, 0.75)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}
    >
      <Container size="4" px={{ initial: '4', md: '6' }}>
        <Flex justify="between" align="center" style={{ height: '80px' }}>
          {/* Official Hospware Brand Logo */}
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Flex align="center" gap="3">
              <img
                src="/hospware-logo.png"
                alt="Hospware"
                style={{
                  height: 30,
                  width: 'auto',
                  display: 'block',
                  objectFit: 'contain'
                }}
              />
            </Flex>
          </Link>

          {/* Navigation Links with large spacing */}
          <Flex gap="6" align="center" display={{ initial: 'none', md: 'flex' }}>
            <Link 
              href="/" 
              style={{
                fontSize: '0.875rem',
                color: isActive('/') && !pathname.includes('#') ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: isActive('/') && !pathname.includes('#') ? 600 : 400,
                transition: 'color 0.2s ease'
              }}
            >
              Overview
            </Link>
            <Link 
              href="/#architecture" 
              style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                transition: 'color 0.2s ease'
              }}
            >
              Architecture
            </Link>
            <Link 
              href="/pricing" 
              style={{
                fontSize: '0.875rem',
                color: isActive('/pricing') ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: isActive('/pricing') ? 600 : 400,
                transition: 'color 0.2s ease'
              }}
            >
              Pricing
            </Link>
            <Link 
              href="/register" 
              style={{
                fontSize: '0.875rem',
                color: isActive('/register') ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: isActive('/register') ? 600 : 400,
                transition: 'color 0.2s ease'
              }}
            >
              Register
            </Link>
          </Flex>

          {/* Minimalist Actions */}
          <Flex align="center" gap="3">
            <Button
              asChild
              variant="ghost"
              color="gray"
              size="2"
              style={{ color: 'rgba(255, 255, 255, 0.65)', cursor: 'pointer' }}
            >
              <a href="http://localhost:3000" target="_blank" rel="noreferrer">
                <span>Front Desk</span>
                <ExternalLink size={12} style={{ opacity: 0.5 }} />
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              color="gray"
              size="2"
              style={{ 
                cursor: 'pointer',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: 8
              }}
            >
              <Link href="/portal">
                <span>Owner Portal</span>
              </Link>
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
