import type { Metadata, Viewport } from "next";
import {
  ALQIS_APPLE_TOUCH_ICON,
  ALQIS_FAVICON,
  ALQIS_ICON,
  ALQIS_ICON_192,
  ALQIS_ICON_512,
  ALQIS_OG_IMAGE,
} from "@/lib/brand/assets";
import { PwaRegister } from "@/components/pwa-register";
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
  themeColor: "#13224A",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#13224A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ALQIS" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        {/* iOS Splash Screens — logical CSS pixels in media queries, physical pixels in filenames */}

        {/* iPhone SE 1st gen — 320×568 logical @2x */}
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/splash-640-1136.png"
        />

        {/* iPhone 8 — 375×667 logical @2x */}
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/splash-750-1334.png"
        />

        {/* iPhone X / XS — 375×812 logical @3x */}
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splashscreens/splash-1125-2436.png"
        />

        {/* iPhone 12 / 13 / 14 / 15 / 16 — 390×844 logical @3x */}
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splashscreens/splash-1170-2532.png"
        />

        {/* iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max — 430×932 logical @3x */}
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splashscreens/splash-1290-2796.png"
        />

        {/* iPad Mini — 768×1024 logical @2x, device-width/height fixed regardless of orientation */}
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/splash-1536-2048.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          href="/splashscreens/splash-2048-1536.png"
        />

        {/* iPad Pro 11" — 834×1194 logical @2x */}
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/splash-1668-2388.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          href="/splashscreens/splash-2388-1668.png"
        />

        {/* iPad Pro 12.9" — 1024×1366 logical @2x */}
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/splash-2048-2732.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          href="/splashscreens/splash-2732-2048.png"
        />
      </head>
      <body className="bg-bg text-ink font-sans antialiased h-full">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
