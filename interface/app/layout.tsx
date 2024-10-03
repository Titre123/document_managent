"use client";

import {
  AptosWalletAdapterProvider,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { Toaster } from "@/app/ui/components/toaster";

import WalletSelector from "@/app/ui/wallet_selector";
import '@/app/ui/global.css';

const wallets = [new PetraWallet(), new MartianWallet()];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
          <div className="flex flex-col items-center justify-center pt-6">
            <div className="self-end px-6">
              <WalletSelector />
            </div>
            {children}
          </div>
          <Toaster />
        </AptosWalletAdapterProvider>
      </body>
    </html>
  );
}
