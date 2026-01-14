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
      <body style={{background: "linear-gradient(180deg, rgba(21, 24, 26, 0.00) 63.77%, rgba(255, 255, 255, 0.04) 89.72%), #F9FAFB"}}>
        <ContextProvider cookies={cookies}>
          <div className="container-fluid" style={{maxWidth: '1280px', padding: '0.25rem'}}>
            <NavBar />
            <main>
              {children}
            </main>
          </div>
        </ContextProvider>
      </body>
    </html>
  );
}
