// 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
// `@supabase/ssr`의 createBrowserClient를 감싸 환경 변수 검증을 더한다.
// 서버 컴포넌트/액션에서는 대신 `@/lib/supabase/server`의 createClient를 사용한다.

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./env";

/** 클라이언트 컴포넌트에서 호출하는 브라우저 Supabase 클라이언트 생성자. */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
