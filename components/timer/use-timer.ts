"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { TIMER_TICK_INTERVAL_MS } from "@/lib/constants";

// 절대 시각(wall-clock) 기반 타이머 훅.
// 틱 카운팅(누적) 대신 시작 시각만 저장하고 매 갱신마다 `Date.now() - startTime`으로
// 경과 시간을 재계산한다 → 백그라운드 탭 throttle 상황에서도 정확.
// progress→CSS 변수 바인딩(Task 010), 세션 DB 저장(Task 011)은 이 훅의 범위 밖이다.

export type TimerStatus = "idle" | "running" | "completed" | "abandoned";

export interface UseTimerResult {
  /** 상태 머신: idle → running → (completed | abandoned) → idle(reset) */
  status: TimerStatus;
  /** 진행도 0.0~1.0 (elapsed / total) */
  progress: number;
  /** 남은 시간(초, 올림) — 카운트다운 표시용 */
  remainingSeconds: number;
  /** idle/완료/포기 상태에서 호출 — 카운트다운 시작 */
  start: () => void;
  /** running 상태에서 호출 — 진행 중단 후 abandoned로 전환 */
  abandon: () => void;
  /** 완료/포기 상태에서 호출 — idle로 초기화 */
  reset: () => void;
}

/**
 * 절대 시각 기반 카운트다운 타이머.
 * @param durationMinutes 집중 시간(분). running 진입 시점의 값으로 총 시간이 고정된다.
 */
export function useTimer(durationMinutes: number): UseTimerResult {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // 시작 절대 시각(ms)과 총 시간(ms). 인터벌/리스너 콜백이 참조하므로 ref로 보관한다.
  const startTimeRef = useRef<number | null>(null);
  const totalMsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 인터벌 정리 — 좀비 타이머 방지.
  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 절대 시각 차분으로 경과 시간을 재계산하고 상태를 갱신한다.
  // elapsed >= total 이면 완료를 확정하고 true를 반환(호출부가 인터벌/리스너를 정리).
  const sync = useCallback((): boolean => {
    if (startTimeRef.current === null) return false;

    const total = totalMsRef.current;
    const elapsed = Date.now() - startTimeRef.current;

    if (elapsed >= total) {
      // 종료 확정 — progress 1, 카운트다운 00:00.
      setProgress(1);
      setRemainingSeconds(0);
      setStatus("completed");
      return true;
    }

    setProgress(elapsed / total);
    // 남은 시간은 올림 → 1초 미만이 남았을 때도 "00:01"로 표시되다 00:00로 떨어진다.
    setRemainingSeconds(Math.ceil((total - elapsed) / 1000));
    return false;
  }, []);

  // running 동안만 인터벌(1초)과 백그라운드 복귀 리스너를 건다.
  useEffect(() => {
    if (status !== "running") return;

    // 진입 즉시 1회 동기화(시작 직후 0초 대기 없이 표시 갱신).
    if (sync()) {
      clearTick();
      return;
    }

    intervalRef.current = setInterval(() => {
      if (sync()) clearTick();
    }, TIMER_TICK_INTERVAL_MS);

    // 백그라운드에서 인터벌이 throttle 되어도, 복귀 시 즉시 재계산해 시간을 따라잡는다.
    const handleResume = () => {
      if (document.visibilityState === "hidden") return;
      if (sync()) clearTick();
    };
    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);

    return () => {
      clearTick();
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
    };
  }, [status, sync, clearTick]);

  const start = useCallback(() => {
    totalMsRef.current = durationMinutes * 60 * 1000;
    startTimeRef.current = Date.now();
    setProgress(0);
    setRemainingSeconds(durationMinutes * 60);
    setStatus("running");
  }, [durationMinutes]);

  const abandon = useCallback(() => {
    clearTick();
    startTimeRef.current = null;
    setStatus("abandoned");
  }, [clearTick]);

  const reset = useCallback(() => {
    clearTick();
    startTimeRef.current = null;
    setProgress(0);
    setRemainingSeconds(0);
    setStatus("idle");
  }, [clearTick]);

  return { status, progress, remainingSeconds, start, abandon, reset };
}
