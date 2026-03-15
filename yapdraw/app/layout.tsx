import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Architects_Daughter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const architectsDaughter = Architects_Daughter({
  variable: "--font-hand",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "YapDraw",
  description: "Draw diagrams in real-time as you work",
  icons: {
    icon: "/yapdraw_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${architectsDaughter.variable}`}>
      <body className="antialiased h-full">
        {children}
      </body>
    </html>
  );
}
