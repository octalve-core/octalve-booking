import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Octalve Booking Demo | Your time, better managed',
  description: 'Manage services, appointments, availability and client enquiries in one workspace.',
  icons: { icon: '/brand/favicon.svg' },
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
