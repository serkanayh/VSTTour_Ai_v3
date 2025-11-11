import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VSTTour AI - Process Automation & ROI Platform",
  description: "Enterprise-grade process automation and ROI estimation platform powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
