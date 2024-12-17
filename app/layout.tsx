import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Pirata_One, MedievalSharp } from 'next/font/google';

const pirataOne = Pirata_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pirata',
});

const medievalSharp = MedievalSharp({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-medieval',
});

export const metadata: Metadata = {
  title: 'ETH Chests',
  description: 'Discover treasures in mystical ETH chests!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pirataOne.variable} ${medievalSharp.variable}`}>
      <body className="font-medieval bg-background dark">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
