import { Container } from "@/components/container";
import { SiteHeader } from "@/components/site-header";

// 로그인 필수 영역 레이아웃 (Route Group: URL 미포함)
// 서버 측 세션 검증(getClaims)은 Task 008에서 추가
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader variant="private" />
      <main className="flex flex-1 flex-col">
        <Container className="flex flex-1 flex-col">{children}</Container>
      </main>
    </div>
  );
}
