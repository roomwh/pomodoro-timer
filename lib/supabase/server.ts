// 서버 컴포넌트/서버 액션/라우트 핸들러용 Supabase 클라이언트.
// `@supabase/ssr`의 createServerClient + next/headers의 cookies()로 SSR 쿠키를 처리한다.
// Next.js 16에서 cookies()는 async이므로 이 헬퍼도 async다.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./env";

/** 서버 컨텍스트에서 호출하는 Supabase 클라이언트 생성자(async). */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // 서버 컴포넌트에서는 쿠키 쓰기가 불가능하다(읽기 전용 컨텍스트).
        // 이 경우 발생하는 에러는 무시한다 — 세션 갱신은 proxy.ts가 책임진다(Task 008).
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // 서버 컴포넌트 렌더 중 호출 — 무시 안전.
        }
      },
    },
  });
}
