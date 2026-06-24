// 더미 데이터 유틸리티 — Phase 2 화면(Task 005/006) 개발용.
// 실제 Supabase 쿼리로의 교체는 Task 011에서 수행한다.
// 모든 값은 렌더 안정성을 위해 결정적(deterministic)으로 고정한다.

import type { FocusSession, GardenPlant } from "@/lib/types";

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

/** 더미 집중 세션 (완료/포기 혼합, 날짜 내림차순) */
export const MOCK_FOCUS_SESSIONS: FocusSession[] = [
  {
    id: "s-008",
    userId: MOCK_USER_ID,
    durationMinutes: 25,
    status: "completed",
    plantType: "tulip",
    startedAt: "2026-06-24T09:00:00.000Z",
    completedAt: "2026-06-24T09:25:00.000Z",
    createdAt: "2026-06-24T09:25:00.000Z",
  },
  {
    id: "s-007",
    userId: MOCK_USER_ID,
    durationMinutes: 50,
    status: "completed",
    plantType: "sunflower",
    startedAt: "2026-06-24T11:10:00.000Z",
    completedAt: "2026-06-24T12:00:00.000Z",
    createdAt: "2026-06-24T12:00:00.000Z",
  },
  {
    id: "s-006",
    userId: MOCK_USER_ID,
    durationMinutes: 15,
    status: "abandoned",
    plantType: "cactus",
    startedAt: "2026-06-23T14:30:00.000Z",
    completedAt: "2026-06-23T14:38:00.000Z",
    createdAt: "2026-06-23T14:38:00.000Z",
  },
  {
    id: "s-005",
    userId: MOCK_USER_ID,
    durationMinutes: 30,
    status: "completed",
    plantType: "cactus",
    startedAt: "2026-06-23T16:00:00.000Z",
    completedAt: "2026-06-23T16:30:00.000Z",
    createdAt: "2026-06-23T16:30:00.000Z",
  },
  {
    id: "s-004",
    userId: MOCK_USER_ID,
    durationMinutes: 45,
    status: "completed",
    plantType: "sunflower",
    startedAt: "2026-06-22T10:00:00.000Z",
    completedAt: "2026-06-22T10:45:00.000Z",
    createdAt: "2026-06-22T10:45:00.000Z",
  },
  {
    id: "s-003",
    userId: MOCK_USER_ID,
    durationMinutes: 25,
    status: "completed",
    plantType: "tulip",
    startedAt: "2026-06-22T13:20:00.000Z",
    completedAt: "2026-06-22T13:45:00.000Z",
    createdAt: "2026-06-22T13:45:00.000Z",
  },
  {
    id: "s-002",
    userId: MOCK_USER_ID,
    durationMinutes: 20,
    status: "abandoned",
    plantType: "tulip",
    startedAt: "2026-06-21T19:00:00.000Z",
    completedAt: "2026-06-21T19:07:00.000Z",
    createdAt: "2026-06-21T19:07:00.000Z",
  },
  {
    id: "s-001",
    userId: MOCK_USER_ID,
    durationMinutes: 60,
    status: "completed",
    plantType: "sunflower",
    startedAt: "2026-06-21T08:00:00.000Z",
    completedAt: "2026-06-21T09:00:00.000Z",
    createdAt: "2026-06-21T09:00:00.000Z",
  },
];

/** 완료 세션 → 정원 식물 투영 (정원 뷰 더미) */
export const MOCK_GARDEN_PLANTS: GardenPlant[] = MOCK_FOCUS_SESSIONS.filter(
  (s) => s.status === "completed",
).map((s) => ({
  id: s.id,
  userId: s.userId,
  plantType: s.plantType,
  plantedAt: s.completedAt ?? s.createdAt,
  durationMinutes: s.durationMinutes,
}));

/** 총 완료 세션 수 */
export function getCompletedSessionCount(
  sessions: FocusSession[] = MOCK_FOCUS_SESSIONS,
): number {
  return sessions.filter((s) => s.status === "completed").length;
}

/** 총 집중 시간(분) — 완료 세션 기준 */
export function getTotalFocusMinutes(
  sessions: FocusSession[] = MOCK_FOCUS_SESSIONS,
): number {
  return sessions
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

/** 빈 정원 상태(신규 사용자) 시연용 빈 배열 */
export const MOCK_EMPTY_SESSIONS: FocusSession[] = [];
