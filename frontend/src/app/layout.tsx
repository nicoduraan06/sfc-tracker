import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import InstalarApp from "@/components/InstalarApp";
import Navegacion from "@/components/Navegacion";
import OneSignalInit from "@/components/OneSignalInit";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SFC Tracker",
  description: "Dashboard visual del Sevilla FC",
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: {
    capable: true,
    title: "SFC Tracker",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-neutral-950 text-white antialiased`}
      >
        <Navegacion />
        <InstalarApp />
        {children}
        <OneSignalInit />
      </body>
    </html>
  );
}