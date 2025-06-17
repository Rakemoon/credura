"use client";
import "@rainbow-me/rainbowkit/styles.css";

import { http, WagmiProvider } from "wagmi";
import {
  lightTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { monadTestnet } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const wagmiConfig = getDefaultConfig({
  appName: "Credura",
  projectId: "YOUR_PROJECT_ID",
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

if (typeof window === undefined) {
  process.on("unhandledRejection", console.error);
}

export function Providers(props: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "var(--primary)",
          })}
        >
          {props.children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
