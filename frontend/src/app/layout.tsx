import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientNavbarWrapper from "../components/ClientNavbarWrapper";
import { MessagingProvider } from "../contexts/MessagingContext";
// import Footer from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeLink - B2B Trading Platform",
  description: "Connect producers and buyers in a seamless B2B trading experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MessagingProvider>
          <ClientNavbarWrapper />
          {children}
        </MessagingProvider>
      </body>
    </html>
  );
}
