import { Container } from "@/components/container";
import { SiteHeader } from "@/components/site-header";

// 비로그인 전용 영역 레이아웃 (Route Group: URL 미포함)
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader variant="public" />
      <main className="flex flex-1 flex-col">
        <Container className="flex flex-1 flex-col">{children}</Container>
      </main>
    </div>
  );
}
