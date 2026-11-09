import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { themeInitScript } from "@/components/layout/theme-toggle";
import { MotionProvider } from "@/components/motion/motion";
import { siteConfig } from "@/config/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-jetbrains", display: "swap" });

const title = "OCD Live — Réserve ton live de vente à Lomé ou à distance";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: title, template: "%s · OCD Live" },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "live shopping",
    "live de vente",
    "Lomé",
    "Togo",
    "studio live",
    "TikTok live",
    "vendre en ligne Afrique",
    "marketing",
    "OCD Live",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image", title, description: siteConfig.description },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf9f6",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh">
        <a
          href="#contenu"
          className="sr-only z-50 rounded-xl bg-ocd-black px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Aller au contenu
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
