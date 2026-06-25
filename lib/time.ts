// 시간 포맷 헬퍼 — 카운트다운 표시(MM:SS)의 단일 진실 공급원.
// Task 009(타이머 신뢰성 로직)의 카운트다운 표시 갱신도 이 함수를 재사용한다.

/**
 * 총 초(seconds)를 `MM:SS` 문자열로 포맷한다.
 * 음수는 0으로 클램프하고, 분이 99를 넘어도 두 자리 이상으로 그대로 표기한다.
 * 예) 0 → "00:00", 65 → "01:05", 1500 → "25:00"
 */
export function formatMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * 총 분(minutes)을 "N시간 M분" 또는 "M분"으로 포맷한다.
 * 집계 타일과 식물 카드의 집중 시간 표시에 사용한다.
 * 예) 0 → "0분", 25 → "25분", 90 → "1시간 30분", 60 → "1시간"
 */
export function formatMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.floor(totalMinutes));
  if (safe === 0) return "0분";
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}
