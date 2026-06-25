// 정원 데이터 조회 — 서버 전용 데이터 계층.
// focus_sessions를 한 번 조회(RLS가 본인 행만 반환)해 기록·정원·집계를 모두 파생한다.
// 정원 식물은 garden_plants View 별도 조회 대신 완료 세션 투영으로 만들어 왕복을 줄인다.

import { createClient } from "@/lib/supabase/server";
import type {
  FocusSession,
  GardenPlant,
  PersistedSessionStatus,
  PlantType,
} from "@/lib/types";

/** focus_sessions 테이블 한 행(snake_case) */
interface FocusSessionRow {
  id: string;
  user_id: string;
  duration_minutes: number;
  status: string;
  plant_type: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

/** DB 행(snake_case) → 도메인 타입(camelCase) 매핑 */
function mapFocusSession(row: FocusSessionRow): FocusSession {
  return {
    id: row.id,
    userId: row.user_id,
    durationMinutes: row.duration_minutes,
    status: row.status as PersistedSessionStatus,
    plantType: row.plant_type as PlantType,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

export interface GardenData {
  /** 전체 세션 (완료/포기, created_at 내림차순) — 기록 뷰용 */
  sessions: FocusSession[];
  /** 완료 세션의 정원 식물 투영 — 정원 격자용 */
  plants: GardenPlant[];
  /** 총 완료 세션 수 */
  completedCount: number;
  /** 총 집중 시간(분) — 완료 세션 기준 */
  totalMinutes: number;
}

/**
 * 로그인 사용자의 정원 데이터를 조회한다(서버 컴포넌트에서 호출).
 * RLS가 본인 행만 반환하므로 별도 user_id 필터는 불필요하다.
 */
export async function getGardenData(): Promise<GardenData> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`정원 데이터 조회 실패: ${error.message}`);
  }

  const sessions = (data as FocusSessionRow[]).map(mapFocusSession);
  const completedSessions = sessions.filter((s) => s.status === "completed");

  // 완료 세션 → 정원 식물 투영 (garden_plants View와 동일한 의미)
  const plants: GardenPlant[] = completedSessions.map((s) => ({
    id: s.id,
    userId: s.userId,
    plantType: s.plantType,
    plantedAt: s.completedAt ?? s.createdAt,
    durationMinutes: s.durationMinutes,
  }));

  const totalMinutes = completedSessions.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );

  return {
    sessions,
    plants,
    completedCount: completedSessions.length,
    totalMinutes,
  };
}
