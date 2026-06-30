import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: "ASTRA — 별들 사이의 커뮤니티",
  description:
    "우주를 닮은 Discord 친목 커뮤니티, ASTRA. 길드를 만들고, 새로운 인연과 모험을 시작하세요.",
  openGraph: {
    title: "ASTRA",
    description: "The dark was never empty.",
    type: "website",
  },
  other: { "color-scheme": "dark" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050508",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&family=Noto+Sans+KR:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
