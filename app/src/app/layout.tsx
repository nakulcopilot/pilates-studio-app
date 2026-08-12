import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pilates With Neelam",
  description:
    "Private and small-group pilates guided by Neelam — tailored classes, personal attention, and progress that grows with you.",
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
