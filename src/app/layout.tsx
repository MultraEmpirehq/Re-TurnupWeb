import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import AppLayout from "@/components/layouts/app-layout/app.layout";

// The platform font. The files on hand are Light, 45 Book, 55 Roman and 95 Black,
// with no Medium or Semibold, so they're spread over the weights the app uses:
// Book reads as regular body text, Roman as medium, and Black covers semibold and
// bold. Adding Avenir 65 Medium and 85 Heavy later would give those their own cuts.
const brandSans = localFont({
  variable: "--font-brand-sans",
  display: "swap",
  src: [
    { path: "../assets/fonts/avenir/Avenir-Light.ttf", weight: "300" },
    { path: "../assets/fonts/avenir/Avenir-Normal.otf", weight: "400" },
    { path: "../assets/fonts/avenir/Avenir-Regular.otf", weight: "500" },
    { path: "../assets/fonts/avenir/Avenir-Bold.otf", weight: "700" },
  ],
  fallback: ["Avenir Next", "Avenir", "Helvetica Neue", "Arial", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Turnupz",
  description:
    "Find what's on near you, from concerts and conferences to sports, food, comedy and family days. Book tickets in a few taps and walk in with one scan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // On <html>, not <body>: Tailwind sets the page font there, so the variables
      // have to exist at that level for it to resolve.
      className={`${brandSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased bg-background">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
