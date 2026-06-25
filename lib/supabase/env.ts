// Supabase 환경 변수 접근의 단일 지점.
// 누락 시 런타임 초기에 명확한 에러를 던져 디버깅을 쉽게 한다.
// 브라우저/서버 헬퍼 양쪽에서만 import 한다.

/** 검증된 Supabase 연결 자격 증명을 반환한다. 누락 시 throw. */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "환경 변수 NEXT_PUBLIC_SUPABASE_URL이(가) 설정되지 않았습니다. .env.local을 확인하세요.",
    );
  }
  if (!anonKey) {
    throw new Error(
      "환경 변수 NEXT_PUBLIC_SUPABASE_ANON_KEY이(가) 설정되지 않았습니다. .env.local을 확인하세요.",
    );
  }

  return { url, anonKey };
}
