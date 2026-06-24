// 도메인 타입 — 앱 전반(화면/타이머/세션 저장)이 공유하는 데이터 모델.
// 리터럴 유니온은 `lib/constants.ts`의 `as const` 배열에서 파생해 중복 선언을 피한다.

import type { GROWTH_STAGES, PLANT_TYPES } from "@/lib/constants";

/** 식물 종류: "tulip" | "sunflower" | "cactus" */
export type PlantType = (typeof PLANT_TYPES)[number];

/** 성장 단계: "seed" | "sprout" | "bud" | "bloom" | "withered" */
export type GrowthStage = (typeof GROWTH_STAGES)[number];

/**
 * 세션 상태.
 * - `in_progress`: 클라이언트 상태 머신 전용 (DB에 저장하지 않음)
 * - `completed` / `abandoned`: DB `focus_sessions.status`에 영속되는 값
 */
export type SessionStatus = "in_progress" | "completed" | "abandoned";

/** DB에 영속되는 세션 상태 (진행 중 세션은 저장하지 않음) */
export type PersistedSessionStatus = Exclude<SessionStatus, "in_progress">;

/**
 * 집중 세션 — `focus_sessions` 테이블의 한 행에 대응.
 * 타임스탬프는 Supabase가 반환하는 ISO 8601 문자열(timestamptz) 기준.
 */
export interface FocusSession {
  id: string;
  /** 소유자 (auth.users.id) */
  userId: string;
  /** 집중 시간(분) — 1~180 */
  durationMinutes: number;
  /** 영속 상태 (완료/포기) */
  status: PersistedSessionStatus;
  /** 배정된 식물 종류 */
  plantType: PlantType;
  /** 시작 절대 시각 (ISO 8601) */
  startedAt: string;
  /** 완료/포기 확정 시각 (ISO 8601) — 미확정 시 null */
  completedAt: string | null;
  /** 레코드 생성 시각 (ISO 8601) */
  createdAt: string;
}

/**
 * 정원에 전시되는 완성된 식물 (뷰 모델).
 * 본질적으로 `status='completed'`인 FocusSession의 투영이며,
 * 별도 테이블 vs View 중 실제 데이터 소스 결정은 Task 007에 위임한다.
 */
export interface GardenPlant {
  id: string;
  userId: string;
  plantType: PlantType;
  /** 정원에 심긴 시각(= 세션 완료 시각, ISO 8601) */
  plantedAt: string;
  /** 해당 세션의 집중 시간(분) */
  durationMinutes: number;
}
