import type { Metadata } from 'next'
import { LogoProvider } from '@/app/logoContext'; // Adjust path if needed
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
        <LogoProvider>
          {children}
        </LogoProvider>
      </body>
    </html>
  );
}

