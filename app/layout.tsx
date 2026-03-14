import type { Metadata } from "next";
import { Baloo_2, Nunito, ZCOOL_KuaiLe } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const bodyFont = Nunito({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const displayFont = Baloo_2({
  variable: "--font-display",
  weight: ["500", "700"],
  subsets: ["latin"],
});

const handwrittenFont = ZCOOL_KuaiLe({
  variable: "--font-handwritten",
  weight: ["400"],
  subsets: ["chinese-simplified"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI小当家",
  description: "AI小当家：面向中小学生的AI学习闯关游戏",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable} ${handwrittenFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
