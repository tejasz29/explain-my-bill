import type { Metadata } from "next";
import { Space_Grotesk, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Explain My Bill - AI Bill Analyzer",
  description: "Upload any bill and get a plain-English breakdown of every charge with suspicious fees flagged instantly.",
  openGraph: {
    title: "Explain My Bill",
    description: "Your bill has secrets. We expose the charges that deserve a closer look.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} antialiased`}
        style={{
          fontFamily: "var(--font-body), Georgia, serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
