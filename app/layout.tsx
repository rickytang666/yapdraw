import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Architects_Daughter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

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
  description:
    "Speak your idea — watch it become a diagram. YapDraw turns voice into Excalidraw diagrams in real time.",
  icons: {
    icon: "/yapdraw_logo.png",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://yapdraw.vercel.app"
  ),
  openGraph: {
    title: "YapDraw",
    description:
      "Speak your idea — watch it become a diagram. YapDraw turns voice into Excalidraw diagrams in real time.",
    siteName: "YapDraw",
    images: [
      {
        url: "/yapdraw_og.png",
        width: 1200,
        height: 630,
        alt: "YapDraw — voice-to-diagram",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YapDraw",
    description:
      "Speak your idea — watch it become a diagram. YapDraw turns voice into Excalidraw diagrams in real time.",
    images: ["/yapdraw_og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${architectsDaughter.variable}`}
    >
      <body className="antialiased h-full">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
