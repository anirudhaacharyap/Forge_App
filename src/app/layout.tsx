import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PageTransition from "@/components/ui/PageTransition";
import InteractiveBackground from "@/components/ui/InteractiveBackground";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Forge — Construction Materials Intelligence",
  description:
    "Forge recommends the most suitable construction material based on plain language, voice, photo, or advanced property specification. Standards compliance, failure analysis, cost comparison, and local vendors — all in one flow.",
  keywords: ["construction", "materials", "intelligence", "steel", "concrete", "standards", "compliance"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)] relative">
        <ThemeProvider>
          <InteractiveBackground />
          <LanguageProvider>
            <Header />
            <main className="flex-grow">
              <PageTransition>{children}</PageTransition>
            </main>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
