import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layouts/app-layout/app.layout";
import SmoothScroll from "@/components/layouts/smooth-scroll";

// The brand typeface, Plus Jakarta Sans, in every weight the app uses (the
// mobile app uses the same family).
const brandSans = Plus_Jakarta_Sans({
  variable: "--font-brand-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Turnupz",
  // Phones turn emails, numbers and addresses on the page into links by
  // rewriting it, and React can crash when it next updates that text (it did:
  // closing the sign-up popup on an iPhone). Our own links are added on purpose.
  formatDetection: { email: false, telephone: false, address: false, date: false },
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
      {/* Extensions like Grammarly add attributes to <body> before React loads;
          only this tag's own attributes are excused, nothing inside it. */}
      <body className="font-sans antialiased bg-background" suppressHydrationWarning>
        <SmoothScroll />
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
