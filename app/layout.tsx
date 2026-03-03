import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Memur Maaş Zammı Hesaplama',
  description: 'Kümülatif enflasyon ve toplu sözleşme oranlarına göre maaş zammınızı hesaplayın',
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Memur Maaş Zammı',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
