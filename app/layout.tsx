import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Sans_Condensed } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import "./globals.css";

const plexSansCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-plex-sans-condensed",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Triger frame sequence",
  description: "Scroll-driven frame sequence using the frame assets in the project folder.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSansCondensed.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
