import type { Metadata } from "next";
import { Bebas_Neue, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const displayFont = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

const telemetryFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-telemetry",
});

export const metadata: Metadata = {
  title: "Next-Gen JDM Street Racing Car Configurator",
  description:
    "Cyberpunk-grade real-time 3D car configurator built with Next.js, R3F, Zustand, GSAP, Lenis, and Framer Motion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${displayFont.variable} ${telemetryFont.variable} bg-obsidian text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
