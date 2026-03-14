import { Providers } from "@/components/Providers";
import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "PantryMonium",
  description: "Your Pantry, Perfectly Remembered",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
