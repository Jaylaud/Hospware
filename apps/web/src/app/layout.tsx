import type { Metadata } from 'next';
import '@radix-ui/themes/styles.css';
import './globals.css';
import { Theme } from '@radix-ui/themes';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Hospware - Cloud Hotel Management System for Ghana',
  description: 'Zero-downtime offline-first hotel front desk software, Mobile Money billing, and cloud analytics built for Ghana and West Africa.',
  keywords: 'hotel management software ghana, hospitality POS accra, hotel software offline, hospware',
  icons: {
    icon: '/hospware-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <Theme appearance="dark" accentColor="indigo" grayColor="slate" radius="large" scaling="100%">
          <Navbar />
          <main style={{ minHeight: '80vh' }}>{children}</main>
          <Footer />
        </Theme>
      </body>
    </html>
  );
}
