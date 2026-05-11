import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import InteractiveBackground from "@/components/InteractiveBackground";
import CustomCursor from "@/components/CustomCursor";

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
      <body className={`antialiased ${generalSans.variable} font-general min-h-screen bg-background`}>
        <CustomCursor />
        <InteractiveBackground />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
