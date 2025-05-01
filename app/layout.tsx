import type { Metadata } from 'next'
import { LogoProvider } from '@/app/logoContext'; // Adjust path if needed
import { ZelleLogoProvider } from './zellLogoContext';
import './globals.css'

export const metadata: Metadata = {
  title: 'Free International Banking',
  description: 'Created by Venhash',
  generator: 'v0.dev',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ZelleLogoProvider>
          <LogoProvider>
            {children}
          </LogoProvider>
        </ZelleLogoProvider>
      </body>
    </html>
  );
}

