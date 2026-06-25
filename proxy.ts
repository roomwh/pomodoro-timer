import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";

// 보호 라우트: 미인증 사용자는 /login으로 리디렉션.
const PROTECTED = ["/timer", "/garden"];
// 비보호(인증 전용) 라우트: 이미 로그인한 사용자는 /timer로 리디렉션.
const PUBLIC_AUTH = ["/", "/login", "/signup"];

// Next.js 16 Proxy (구 middleware) — @supabase/ssr 공식 패턴.
// 요청마다 세션 토큰을 갱신하고, 쿠키를 응답에 전파한 뒤
// 보호/비보호 라우트에 대한 optimistic 리디렉션을 수행한다.
export async function proxy(request: NextRequest) {
  // 갱신된 쿠키를 실어 보낼 응답 객체. 아래에서 setAll로 쿠키를 덧붙인다.
  let supabaseResponse = NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // 요청 쿠키와 응답 쿠키 양쪽에 동기화 — SSR 문서 권장 패턴.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // 중요: createServerClient와 getUser() 호출 사이에 어떤 코드도 두지 말 것.
  // 분기/early return을 끼우면 세션 무작위 로그아웃 같은 디버깅 난해한 버그가 발생한다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isPublicAuth = PUBLIC_AUTH.includes(pathname);

  // 미인증 사용자가 보호 라우트 접근 → /login으로.
  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // 인증 사용자가 인증 전용 라우트 접근 → /timer로.
  if (user && isPublicAuth) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/timer";
    return NextResponse.redirect(redirectUrl);
  }

  // 반드시 supabaseResponse를 그대로 반환해야 갱신된 세션 쿠키가 보존된다.
  return supabaseResponse;
}

export const config = {
  // 정적 자산(_next/static, _next/image), favicon, public 에셋을 제외한 모든 경로에서 실행
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
