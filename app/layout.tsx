import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALQIS",
  description:
    "ALQIS is a premium stock market intelligence app focused on AI-powered explanations, market context, and signal over noise.",
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
