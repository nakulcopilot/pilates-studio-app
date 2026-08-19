import type { Metadata } from "next";
import "./globals.css";

const DB_KEY = "zenpilates_data_v3";
const SESSION_KEY = "zenpilates_session_v1";

function buildOfflineBannerHTML(): string {
  const tokens: string[] = [];
  tokens.push('<div className="offline-banner"');
  tokens.push(' style="position:fixed;top:0;left:0;right:0;background:var(--primary);color:var(--text-white);padding:0.75rem 1rem;font-size:0.875rem;z-index:9999;box-shadow:0 2px 4px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:space-between;"');
  tokens.push('>');
  tokens.push('<span>You are offline. Some features may be limited.</span>');
  tokens.push('<button className="btn btn-outline text-xs" style="marginLeft:0.5rem" onclick="window.location.reload()">Back online</button>');
  tokens.push('</div>');
  return tokens.join("");
}

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
      <body className="min-h-screen">
        {buildOfflineBannerHTML()}
        {children}
      </body>
    </html>
  );
}
