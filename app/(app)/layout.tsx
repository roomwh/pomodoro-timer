import Link from "next/link";

import { Container } from "@/components/container";

// 로그인 필수 영역 레이아웃 (Route Group: URL 미포함)
// 서버 측 세션 검증(getClaims)은 Task 008에서 추가, 헤더 내비는 Task 003에서 컴포넌트화
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      {/* 헤더 내비 placeholder — 테두리는 전체 폭, 콘텐츠는 컨테이너로 중앙 정렬 */}
      <header className="border-b">
        <Container className="flex items-center justify-between py-4">
          <Link href="/timer" className="font-heading text-lg font-semibold">
            🌱 뽀모도로 정원
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/timer" className="hover:text-foreground">
              타이머
            </Link>
            <Link href="/garden" className="hover:text-foreground">
              정원
            </Link>
            {/* 사용자 이메일/로그아웃 placeholder — Task 008 */}
            <span aria-hidden>·</span>
          </nav>
        </Container>
      </header>
      <main className="flex flex-1 flex-col">
        <Container className="flex flex-1 flex-col">{children}</Container>
      </main>
    </div>
  );
}
