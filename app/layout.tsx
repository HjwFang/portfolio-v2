import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const generalSans = localFont({
  src: "./fonts/GeneralSans-Variable.ttf",
  variable: "--font-general",
  display: "swap",
});

export const metadata: Metadata = {
  title: "horst fang",
  description: "swe @QuickPOS, syde @uwaterloo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${generalSans.variable} font-general`}>
        {children}
      </body>
    </html>
  );
}
