import type { Metadata, Viewport } from "next";
import {
  ALQIS_APPLE_TOUCH_ICON,
  ALQIS_FAVICON,
  ALQIS_ICON,
  ALQIS_ICON_192,
  ALQIS_ICON_512,
  ALQIS_OG_IMAGE,
} from "@/lib/brand/assets";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "ALQIS",
    template: "%s | ALQIS",
  },
  description: "AI-powered market intelligence that explains why stocks move.",
  applicationName: "ALQIS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ALQIS",
  },
  openGraph: {
    title: "ALQIS",
    description: "AI-powered market intelligence that explains why stocks move.",
    type: "website",
    images: [
      {
        url: ALQIS_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "ALQIS market intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALQIS",
    description: "AI-powered market intelligence that explains why stocks move.",
    images: [ALQIS_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: ALQIS_FAVICON, type: "image/svg+xml" },
      { url: ALQIS_ICON, type: "image/svg+xml" },
      { url: ALQIS_ICON_192, sizes: "192x192", type: "image/png" },
      { url: ALQIS_ICON_512, sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: ALQIS_FAVICON, type: "image/svg+xml" }],
    apple: [{ url: ALQIS_APPLE_TOUCH_ICON, sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#081019",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-ink font-sans antialiased h-full">
        {children}
      </body>
    </html>
  );
}
