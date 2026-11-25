import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "dhun — download JioSaavn songs from your terminal",
  description:
    "dhun is a tiny, blazing-fast CLI that searches, streams and downloads songs from JioSaavn at up to 320 kbps — album art and tags baked in. No account, no ads, no browser.",
  keywords: [
    "jiosaavn downloader",
    "saavn cli",
    "dhun",
    "music downloader",
    "terminal music",
    "cli tool",
    "hindi songs download",
  ],
  authors: [{ name: "dhun contributors" }],
  openGraph: {
    title: "dhun — download JioSaavn songs from your terminal",
    description:
      "Search, stream and download songs from JioSaavn at up to 320 kbps. No account, no ads, no browser.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "dhun — JioSaavn in your terminal",
    description:
      "Search, stream and download songs from JioSaavn at up to 320 kbps.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
