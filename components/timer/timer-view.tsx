"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Flag, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  DEFAULT_DURATION_MINUTES,
  PLANT_META,
  PLANT_TYPES,
} from "@/lib/constants";
import { getGrowthStage } from "@/lib/plant";
import { formatMMSS } from "@/lib/time";
import type { PlantType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plant } from "@/components/plant/plant";
import { DurationInput } from "@/components/timer/duration-input";
import { AbandonDialog } from "@/components/timer/abandon-dialog";

type TimerStatus = "idle" | "running" | "completed" | "abandoned";

// 타이머 화면 상태 머신 (UI 더미).
// 실제 카운트다운/절대 시각 로직은 Task 009, progress→CSS 변수 애니메이션은 Task 010,
// 세션 저장·식물 랜덤 배정은 Task 011에서 연결한다.
// 여기서는 수동 progress 슬라이더로 단계 전환을 시연한다(자동 타이밍 없음).
export function TimerView() {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION_MINUTES);
  const [progress, setProgress] = useState(0);
  const [plantType, setPlantType] = useState<PlantType>("tulip");
  const [abandonOpen, setAbandonOpen] = useState(false);

  const stage = getGrowthStage(progress);
  const remainingSeconds = Math.round((1 - progress) * durationMinutes * 60);

  // 완료 진입 시 토스트 (실제 "정원에 심기" 저장은 Task 011).
  useEffect(() => {
    if (status === "completed") {
      toast.success("집중 완료! 🌷", {
        description: "데모 모드입니다 — 정원 저장은 추후 연결됩니다.",
      });
    }
  }, [status]);

  function handleStart() {
    setProgress(0);
    setStatus("running");
  }

  function handleProgressChange(next: number) {
    setProgress(next);
    if (next >= 1) {
      setStatus("completed");
    }
  }

  function handleConfirmAbandon() {
    setAbandonOpen(false);
    setStatus("abandoned");
  }

  function handleReset() {
    setProgress(0);
    setStatus("idle");
  }

  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const isAbandoned = status === "abandoned";

  // 화면에 표시할 식물 상태 결정.
  const plantStage = isAbandoned ? "withered" : isCompleted ? "bloom" : stage;

  return (
    <div className="flex flex-1 flex-col py-8">
      <div className="grid flex-1 items-center gap-8 lg:grid-cols-2">
        {/* ── 식물 시각 영역 ───────────────────────── */}
        <div className="flex flex-col items-center justify-center gap-4">
          <Plant
            plantType={plantType}
            stage={plantStage}
            withered={isAbandoned}
            size="lg"
          />
          {isRunning ? (
            <p className="text-5xl font-semibold tabular-nums tracking-tight">
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
            {/* 식물 종류 선택 (데모용 — 실제 랜덤 배정은 Task 011) */}
            {(status === "idle" || isRunning) && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  식물 종류 (미리보기)
                </span>
                <div className="flex gap-2">
                  {PLANT_TYPES.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={plantType === type ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setPlantType(type)}
                    >
                      {PLANT_META[type].emoji} {PLANT_META[type].label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

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
              </div>
            )}

            {isRunning && (
              <div className="flex flex-col gap-5">
                {/* 더미 진행도 슬라이더 — 실제 카운트다운은 Task 009 */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="demo-progress"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    데모 진행도 (실제 타이머는 추후 연결) ·{" "}
                    <span className="tabular-nums">{Math.round(progress * 100)}%</span>
                  </label>
                  <input
                    id="demo-progress"
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(progress * 100)}
                    onChange={(e) => handleProgressChange(Number(e.target.value) / 100)}
                    className="accent-primary"
                  />
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
              <div className="flex flex-col items-center gap-4 text-center">
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
              <div className="flex flex-col items-center gap-4 text-center">
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
