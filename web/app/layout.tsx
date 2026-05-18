import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { ToastHost } from "@/components/ui/Toast";

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-serif-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "성진북스 — 한국어 단행본 자동조판",
  description: "원고를 넣으면 인쇄 가능한 책이 됩니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSerifKR.variable} antialiased bg-bg text-text-primary`}>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
