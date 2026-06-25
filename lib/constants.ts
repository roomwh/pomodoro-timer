// 도메인 상수 — 식물 종류 / 성장 단계 / 집중 시간 한계의 단일 진실 공급원.
// 리터럴 집합은 여기서 `as const`로 한 번만 선언하고, 유니온 타입은 `lib/types.ts`에서 파생한다.

// ── 식물 종류 ────────────────────────────────────────────────
/** 지원하는 식물 종류 식별자 (DB `plant_type` 값과 1:1 대응) */
export const PLANT_TYPES = ["tulip", "sunflower", "cactus"] as const;

/** 식물별 표시용 메타데이터 (한글 라벨 / 이모지) */
export const PLANT_META = {
  tulip: { label: "튤립", emoji: "🌷" },
  sunflower: { label: "해바라기", emoji: "🌻" },
  cactus: { label: "선인장", emoji: "🌵" },
} as const;

// ── 성장 단계 ────────────────────────────────────────────────
/**
 * 식물 성장 단계 식별자.
 * `seed`~`bloom`은 progress(0~1) 구간에 매핑되고,
 * `withered`(시들기)는 progress 구간이 아니라 포기(abandoned) 시의 특수 상태다.
 */
export const GROWTH_STAGES = [
  "seed",
  "sprout",
  "bud",
  "bloom",
  "withered",
] as const;

/** 성장 단계별 한글 라벨 */
export const GROWTH_STAGE_META = {
  seed: { label: "씨앗" },
  sprout: { label: "새싹" },
  bud: { label: "꽃봉오리" },
  bloom: { label: "만개" },
  withered: { label: "시들기" },
} as const;

/**
 * progress(0.0~1.0) → 성장 단계 매핑 구간.
 * 각 구간은 `[min, max)` 반열림 구간이며, 마지막 만개 구간만 1.0을 포함한다.
 * Task 010(식물 성장 애니메이션)의 단계 분기와 동일한 경계값을 사용한다.
 * `withered`는 progress 기반이 아니므로 여기에 포함하지 않는다.
 */
export const GROWTH_STAGE_RANGES = [
  { stage: "seed", min: 0.0, max: 0.1 },
  { stage: "sprout", min: 0.1, max: 0.4 },
  { stage: "bud", min: 0.4, max: 0.8 },
  { stage: "bloom", min: 0.8, max: 1.0 },
] as const;

// ── 집중 시간 ────────────────────────────────────────────────
/** 집중 시간 최소값(분) — DB CHECK 제약 및 Zod 검증과 일치 */
export const MIN_DURATION_MINUTES = 1;
/** 집중 시간 최대값(분) — DB CHECK 제약 및 Zod 검증과 일치 */
export const MAX_DURATION_MINUTES = 180;
/** 타이머 설정 기본값(분) — 전통적 포모도로 1세트 */
export const DEFAULT_DURATION_MINUTES = 25;

/**
 * 타이머 표시 갱신 주기(ms).
 * 카운트다운(MM:SS)을 1초 간격으로 갱신한다. 정밀도는 인터벌 빈도가 아니라
 * `Date.now()` 차분에서 나오므로(틱 누적 금지), throttle 보정은 visibilitychange/focus가 담당한다.
 */
export const TIMER_TICK_INTERVAL_MS = 1000;
