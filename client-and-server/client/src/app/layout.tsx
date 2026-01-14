import type { Metadata } from "next";
import { headers } from 'next/headers';
import './globals.css';
import ContextProvider from '@/context';
import { NavBar } from '@/components/layout/NavBar';

export const metadata: Metadata = {
  title: "ZK Yield Vault - Privacy-Preserving Yield Distribution",
  description: "Privacy-preserving yield distribution on Mantle using zero-knowledge proofs",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers();
  const cookies = headersData.get('cookie');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50">
        <ContextProvider cookies={cookies}>
          <NavBar />
          <main className="min-h-screen">
            {children}
          </main>
        </ContextProvider>
      </body>
    </html>
  );
}
