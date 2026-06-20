import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ResQ — Rescue Food, Save the Planet",
  description: "Buy surplus food from local stores at a fraction of the price. Fight food waste with ResQ.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ResQ",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" className={`${outfit.variable} ${inter.variable} h-full`}>
      <body className="font-sans antialiased bg-slate-50 h-full">
      <AuthProvider>
        <CartProvider>
          {/* Contenedor global fluido para toda la pantalla */}
          <div className="w-full min-h-screen bg-slate-50 relative flex flex-col">
            <Navbar />
            {/* Eliminamos las restricciones rígidas y flex-col restrictivos */}
            <main className="flex-1 w-full min-w-0 block pb-16">
              {children}
            </main>
          </div>
        </CartProvider>
      </AuthProvider>
      </body>
      </html>
  );
}