import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multi-Agent Research System | AI-Powered Corporate Intelligence",
  description:
    "A production-grade multi-agent AI research system powered by CrewAI. Enter any industry or topic and receive a comprehensive Corporate Intelligence Briefing in seconds.",
  keywords: [
    "AI research",
    "CrewAI",
    "multi-agent",
    "corporate intelligence",
    "market research",
    "AI briefing",
  ],
  authors: [{ name: "Multi-Agent Research System" }],
  openGraph: {
    title: "Multi-Agent Research System",
    description: "AI-powered corporate intelligence briefings in seconds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased min-h-screen bg-[#0a0a0f]">{children}</body>
    </html>
  );
}
