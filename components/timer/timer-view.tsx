"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Flag, RotateCcw, Info } from "lucide-react";
import { toast } from "sonner";

import { DEFAULT_DURATION_MINUTES, PLANT_META } from "@/lib/constants";
import { formatMMSS } from "@/lib/time";
import { pickRandomPlantType } from "@/lib/plant";
import type { PlantType } from "@/lib/types";
import { saveSession } from "@/app/actions/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GrowingPlant } from "@/components/plant/growing-plant";
import { DurationInput } from "@/components/timer/duration-input";
import { AbandonDialog } from "@/components/timer/abandon-dialog";
import { useTimer } from "@/components/timer/use-timer";

// 타이머 화면.
// 카운트다운/절대 시각 로직은 useTimer 훅(Task 009)이, progress→CSS 변수 애니메이션은
// GrowingPlant(Task 010)이 담당한다. 세션 저장·식물 랜덤 배정은 Task 011에서 연결한다.
export function TimerView() {
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION_MINUTES);
  // 식물 종류는 start 시점에 랜덤 배정한다. idle 미리보기는 기본값(progress 0 = 씨앗이라 종류 무관).
  const [plantType, setPlantType] = useState<PlantType>("tulip");
  const [abandonOpen, setAbandonOpen] = useState(false);

  const { status, progress, remainingSeconds, startedAt, start, abandon, reset } =
    useTimer(durationMinutes);

  // 한 세션당 정확히 1회만 저장하기 위한 가드(완료/포기 콜백·리렌더·Strict Mode 이중 호출 대비).
  const savedRef = useRef(false);

  // 완료/포기 종결 시 focus_sessions에 1회 저장한다.
  useEffect(() => {
    if (status !== "completed" && status !== "abandoned") return;
    if (savedRef.current) return;
    if (startedAt === null) return; // 시작 시각 없으면 저장 불가(방어)
    savedRef.current = true;

    const sessionStatus = status === "completed" ? "completed" : "abandoned";
    void saveSession({
      durationMinutes,
      plantType,
      status: sessionStatus,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date().toISOString(),
    }).then((result) => {
      if (!result.ok) {
        toast.error("세션 저장에 실패했어요", { description: result.error });
        return;
      }
      if (sessionStatus === "completed") {
        toast.success("정원에 심기 완료! 🌷", {
          description: "방금 키운 식물이 정원에 추가됐어요.",
        });
      }
    }).catch(() => {
      // 전송 계층 실패(네트워크 단절, 세션 만료로 Server Action이 리디렉션되어 받는
      // "unexpected response" 등)는 saveSession의 {ok:false}에 도달하지 못하고 Promise를
      // reject한다. catch가 없으면 unhandled rejection으로 토스트 없이 콘솔 에러만 남으므로,
      // 여기서 사용자에게 실패를 알린다(정원 데이터는 저장되지 않은 상태).
      toast.error("세션 저장에 실패했어요", {
        description: "네트워크 또는 로그인 세션 문제로 저장하지 못했어요. 다시 로그인 후 시도해주세요.",
      });
    });
  }, [status, startedAt, durationMinutes, plantType]);

  // 시작 — 식물을 랜덤 배정하고 저장 가드를 초기화한다.
  function handleStart() {
    savedRef.current = false;
    setPlantType(pickRandomPlantType());
    start();
  }

  // 초기화 — 저장 가드를 풀고 idle로 복귀한다("다시 집중"/"새로 시작" 공통).
  function handleReset() {
    savedRef.current = false;
    reset();
  }

  function handleConfirmAbandon() {
    setAbandonOpen(false);
    abandon();
  }

  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const isAbandoned = status === "abandoned";

  // 스크린리더용 상태 전환 안내 — 매초 카운트다운은 announce하지 않고(소음 방지),
  // 시작/완료/포기 같은 상태 변화만 polite 영역으로 전달한다.
  const statusAnnouncement = isRunning
    ? "집중을 시작했어요."
    : isCompleted
      ? `${durationMinutes}분 집중을 완료했어요.`
      : isAbandoned
        ? "집중을 포기했어요."
        : "";

  return (
    <div className="flex flex-1 flex-col py-8">
      {/* 상태 전환 announce (시각적으로 숨김) */}
      <p className="sr-only" role="status" aria-live="polite">
        {statusAnnouncement}
      </p>

      <div className="grid flex-1 items-center gap-8 lg:grid-cols-2">
        {/* ── 식물 시각 영역 ───────────────────────── */}
        <div className="flex flex-col items-center justify-center gap-4">
          <GrowingPlant
            plantType={plantType}
            progress={progress}
            withered={isAbandoned}
            size="lg"
          />
          {isRunning ? (
            <p
              role="timer"
              aria-label={`남은 시간 ${formatMMSS(remainingSeconds)}`}
              className="text-5xl font-semibold tabular-nums tracking-tight"
            >
              {formatMMSS(remainingSeconds)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {PLANT_META[plantType].emoji} {PLANT_META[plantType].label}
            </p>
          )}
        </div>

        {/* ── 컨트롤 영역 ───────────────────────────── */}
        <Card className="mx-auto w-full max-w-md">
          <CardContent className="flex flex-col gap-6">
            {status === "idle" && (
              <div className="flex flex-col items-center gap-5">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    집중 시간
                  </span>
                  <DurationInput
                    value={durationMinutes}
                    onChange={setDurationMinutes}
                  />
                </div>
                <Button size="lg" className="w-full" onClick={handleStart}>
                  <Play /> 집중 시작
                </Button>

                {/* 알려진 한계 안내 — 일부 모바일 브라우저는 화면 잠금/장시간 백그라운드 시
                    타이머 갱신이 멈출 수 있다. 복귀 시 절대 시각 기준으로 자동 보정됨(Task 009)을 알려 안심시킨다. */}
                <p className="flex items-start gap-1.5 text-center text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    화면을 끄거나 다른 앱을 오래 사용해도, 돌아오면 실제 시각
                    기준으로 남은 시간이 자동 보정돼요.
                  </span>
                </p>
              </div>
            )}

            {isRunning && (
              <div className="flex flex-col gap-5">
                {/* 진행도 표시 — 식물 시각 영역의 카운트다운과 동기화 */}
                <div className="flex flex-col gap-2 text-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    집중하는 중 ·{" "}
                    <span className="tabular-nums">{Math.round(progress * 100)}%</span>
                  </span>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setAbandonOpen(true)}
                >
                  <Flag /> 포기하기
                </Button>
              </div>
            )}

            {isCompleted && (
              <div className="flex flex-col items-center gap-4 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
                <p className="text-lg font-semibold">
                  {durationMinutes}분 집중을 완료했어요!
                </p>
                <p className="text-sm text-muted-foreground">
                  멋진 식물이 정원에 피어났어요.
                </p>
                <div className="flex w-full flex-col gap-2 sm:flex-row">
                  <Button asChild className="flex-1">
                    <Link href="/garden">정원으로</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleReset}
                  >
                    <RotateCcw /> 다시 집중
                  </Button>
                </div>
              </div>
            )}

            {isAbandoned && (
              <div className="flex flex-col items-center gap-4 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
                <p className="text-lg font-semibold">집중을 포기했어요</p>
                <p className="text-sm text-muted-foreground">
                  괜찮아요. 다음 집중에서 다시 멋진 식물을 키워봐요.
                </p>
                <Button className="w-full" onClick={handleReset}>
                  <RotateCcw /> 새로 시작
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AbandonDialog
        open={abandonOpen}
        onOpenChange={setAbandonOpen}
        onConfirm={handleConfirmAbandon}
      />
    </div>
  );
}
