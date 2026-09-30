import type { Metadata } from 'next';
import './globals.css';
import { CrmProvider } from '@/context/CrmContext';

export const metadata: Metadata = {
  title: 'Wellwith CRM - Clinic & Telecaller Suite',
  description:
    'Custom omnichannel CRM for Wellwith wellness brand. Speed-to-call Hot queue, Kanban pipeline, POS counter order attribution, and analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        <CrmProvider>{children}</CrmProvider>
      </body>
    </html>
  );
}
