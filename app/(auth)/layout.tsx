import Link from "next/link";

import { Container } from "@/components/container";

// 비로그인 전용 영역 레이아웃 (Route Group: URL 미포함)
// 헤더 내비는 placeholder — 실제 컴포넌트는 Task 003에서 구현
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      {/* 헤더 내비 placeholder — 테두리는 전체 폭, 콘텐츠는 컨테이너로 중앙 정렬 */}
      <header className="border-b">
        <Container className="flex items-center justify-between py-4">
          <Link href="/" className="font-heading text-lg font-semibold">
            🌱 뽀모도로 정원
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              로그인
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              회원가입
            </Link>
          </nav>
        </Container>
      </header>
      <main className="flex flex-1 flex-col">
        <Container className="flex flex-1 flex-col">{children}</Container>
      </main>
    </div>
  );
}
