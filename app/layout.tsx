import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Huntlyst — Find the companies worth knowing.',
  description: 'Autonomous Company Discovery & Lead Intelligence platform that discovers, researches, and validates high-potential technology companies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}