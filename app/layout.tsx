import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Listing Optimizer",
  description:
    "Optimize Amazon product listings with compliance-verified copy and gap audits.",
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
