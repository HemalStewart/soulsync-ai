import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthContext";
import { CoinProvider } from "@/components/coins/CoinContext";

export const metadata: Metadata = {
  title: "SoulFun",
  description: "Meet curated AI companions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <CoinProvider>{children}</CoinProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
