"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { PersistedSessionStatus, PlantType } from "@/lib/types";

// 집중 세션 저장 Server Action.
// 타이머가 완료/포기로 종결될 때 TimerView(클라이언트)가 호출한다.
// user_id는 서버에서 getUser()로 확정한다 — 클라이언트가 타인 명의를 주입할 수 없고,
// RLS `with check (auth.uid() = user_id)`와 이중으로 방어된다.

export interface SaveSessionInput {
  /** 집중 시간(분) — 1~180 */
  durationMinutes: number;
  /** 배정된 식물 종류 (완료 시 진행 중 자란 식물과 동일) */
  plantType: PlantType;
  /** 영속 상태 (완료/포기) */
  status: PersistedSessionStatus;
  /** 시작 절대 시각 (ISO 8601) */
  startedAt: string;
  /** 완료/포기 확정 시각 (ISO 8601) */
  completedAt: string;
}

export type SaveSessionResult = { ok: true } | { ok: false; error: string };

/**
 * focus_sessions에 세션 한 행을 INSERT한다.
 * 예외는 throw 대신 결과 객체로 반환해, 호출부(타이머 화면)가 토스트로 처리하고
 * 화면이 깨지지 않게 한다.
 */
export async function saveSession(
  input: SaveSessionInput,
): Promise<SaveSessionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "인증 세션이 없습니다. 다시 로그인해주세요." };
  }

  const { error } = await supabase.from("focus_sessions").insert({
    user_id: user.id,
    duration_minutes: input.durationMinutes,
    status: input.status,
    plant_type: input.plantType,
    started_at: input.startedAt,
    completed_at: input.completedAt,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // 정원 라우터 캐시를 무효화해 다음 방문 시 방금 심은 식물이 보이게 한다.
  revalidatePath("/garden");

  return { ok: true };
}
