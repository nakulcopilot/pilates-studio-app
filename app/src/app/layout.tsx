import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pilates Studio",
  description:
    "AI-Enhanced Pilates Studio — movement intelligence powered by instructor observations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
