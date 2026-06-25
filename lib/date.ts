// 날짜/시각 포맷 헬퍼 — SSR/CSR 하이드레이션 불일치 방지를 위해 timeZone을 "Asia/Seoul"로 고정.
// Task 011에서 실제 Supabase 데이터를 사용할 때도 동일하게 재사용한다.

const TIMEZONE = "Asia/Seoul";

/** ISO 8601 → "2026년 6월 24일" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TIMEZONE,
  }).format(new Date(iso));
}

/** ISO 8601 → "오전 9:00" */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIMEZONE,
  }).format(new Date(iso));
}

/** ISO 8601 → "2026-06-24" (날짜별 그룹핑 키) */
export function getDateKey(iso: string): string {
  const d = new Date(iso);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIMEZONE,
  });
  return formatter.format(d);
}

/** "2026-06-24" → "2026년 6월 24일" (날짜 헤딩 표시용) */
export function formatDateKey(dateKey: string): string {
  return formatDate(dateKey + "T00:00:00+09:00");
}
