import { NextResponse } from "next/server";

// Next.js 16 Proxy (구 middleware) 빈 골격.
// 세션 토큰 갱신 및 보호/비보호 라우트 리디렉션 로직은 Phase 3(Task 008)에서 구현한다.
// 그때 `request: NextRequest` 인자를 받아 세션을 검사하도록 확장한다.
export function proxy() {
  return NextResponse.next();
}

export const config = {
  // 정적 자산(_next/static, _next/image), favicon, public 에셋을 제외한 모든 경로에서 실행
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
