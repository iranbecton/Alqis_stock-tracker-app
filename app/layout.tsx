import type { Metadata, Viewport } from "next";
import {
  ALQIS_APPLE_TOUCH_ICON,
  ALQIS_FAVICON,
  ALQIS_ICON,
  ALQIS_ICON_192,
  ALQIS_ICON_512,
} from "@/lib/brand/assets";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALQIS",
  description: "AI-powered market intelligence that explains why stocks move.",
  icons: {
    icon: [
      { url: ALQIS_FAVICON, type: "image/svg+xml" },
      { url: ALQIS_ICON, type: "image/svg+xml" },
      { url: ALQIS_ICON_192, sizes: "192x192", type: "image/png" },
      { url: ALQIS_ICON_512, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: ALQIS_APPLE_TOUCH_ICON, sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#070f14",
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
