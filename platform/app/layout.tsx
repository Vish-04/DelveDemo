import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Delve - Supabase Compliance Checker",
  description: "Check your Supabase configuration for compliance with security best practices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
