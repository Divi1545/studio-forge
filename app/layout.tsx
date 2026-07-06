import type { Metadata } from "next";
import { Inter, Barlow } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "StudioForge",
  description: "Private AI creative production studio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${barlow.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
