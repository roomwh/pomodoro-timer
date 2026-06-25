import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

// 로그인 필수 영역 레이아웃 (Route Group: URL 미포함)
// proxy.ts optimistic 체크에 더해 서버 측에서 getUser()로 세션을 재검증한다.
// 미인증 시 /login으로 리디렉션하고, 인증 시 이메일을 헤더에 전달한다.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader variant="private" email={user.email} />
      <main className="flex flex-1 flex-col">
        <Container className="flex flex-1 flex-col">{children}</Container>
      </main>
    </div>
  );
}
