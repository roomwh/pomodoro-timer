"use client";

import { Minus, Plus } from "lucide-react";

import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 집중 시간 입력 — 숫자 입력 + -/+ 버튼. 값은 1~180분으로 클램프한다.
// 실제 타이머 시작 로직은 Task 009. 여기서는 설정값(분) 상태만 다룬다.

function clamp(value: number): number {
  if (Number.isNaN(value)) return MIN_DURATION_MINUTES;
  return Math.min(MAX_DURATION_MINUTES, Math.max(MIN_DURATION_MINUTES, value));
}

export function DurationInput({
  value,
  onChange,
  step = 5,
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`${step}분 감소`}
        disabled={disabled || value <= MIN_DURATION_MINUTES}
        onClick={() => onChange(clamp(value - step))}
      >
        <Minus />
      </Button>

      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          min={MIN_DURATION_MINUTES}
          max={MAX_DURATION_MINUTES}
          value={value}
          disabled={disabled}
          aria-label="집중 시간(분)"
          className="w-24 pr-9 text-center text-base tabular-nums"
          onChange={(e) => onChange(clamp(e.target.valueAsNumber))}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          분
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`${step}분 증가`}
        disabled={disabled || value >= MAX_DURATION_MINUTES}
        onClick={() => onChange(clamp(value + step))}
      >
        <Plus />
      </Button>
    </div>
  );
}
