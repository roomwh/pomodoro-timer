import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

// 본문/제목 모두 Geist Sans 하나로 충분하다. Mono는 dev 전용 digest 한 곳에만
// 쓰여 전용 변수 폰트를 로드할 가치가 없으므로 시스템 monospace 스택으로 대체했다
// (globals.css의 --font-mono). next/font가 self-host + display:swap(기본)으로 즉시 표시.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// 배포 도메인 기준 절대 URL 해석용 베이스.
// Vercel은 VERCEL_PROJECT_PRODUCTION_URL을 주입하고, 로컬은 localhost로 폴백한다.
// 커스텀 도메인 사용 시 NEXT_PUBLIC_SITE_URL로 명시 가능.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

const SITE_NAME = "식물이 자라는 뽀모도로 타이머";
const SITE_DESCRIPTION =
  "집중하는 동안 화면 속 식물이 실시간으로 자라나는 몰입형 뽀모도로 타이머";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // 이미지 없는 텍스트 OG — 대부분의 플랫폼이 title/description을 표시한다.
  // (동적 OG 이미지는 next/og 기본 폰트가 한글 글리프를 포함하지 않아 보류)
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
        {/* Vercel Analytics(방문/재방문)·Speed Insights(Web Vitals·LCP).
            프로덕션 Vercel 환경에서만 데이터를 전송하며 개발 환경은 영향 없음. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
