"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { getGrowthStage } from "@/lib/plant";
import type { GrowthStage, PlantType } from "@/lib/types";
import { PARTS_BY_TYPE } from "@/components/plant/plant";

// 타이머 전용 성장 애니메이션 식물 (Task 010).
// progress(0~1)를 `--progress` CSS 변수로 바인딩하면, 흙을 제외한 파츠를 감싼
// `.plant-growth` 그룹의 transform/opacity가 이를 참조하고 CSS transition이 1초 틱
// 사이를 60fps로 보간한다 → 애니메이션을 위한 초당 다회 리렌더 회피.
// 정적 렌더(정원)는 기존 Plant를 그대로 사용한다.

const SIZE_CLASS = {
  sm: "size-24",
  md: "size-40",
  lg: "size-56",
} as const;

export function GrowingPlant({
  plantType,
  progress,
  withered = false,
  size = "lg",
  className,
  animate = false,
}: {
  plantType: PlantType;
  /** 진행도 0.0~1.0 — 1초마다 갱신되며 CSS 변수로 전달된다 */
  progress: number;
  withered?: boolean;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  /** 진행 중일 때만 true — `will-change`로 합성 레이어를 승격한다.
   *  idle/완료/정원처럼 매초 갱신이 없는 정적 상태에서는 false로 두어
   *  불필요한 상시 레이어 승격(메모리·합성 비용)을 피한다. */
  animate?: boolean;
}) {
  // 시들기가 명시되면 시들기 파츠(만개와 동일 형태), 아니면 progress 기반 단계.
  const stage = getGrowthStage(progress);
  const effectiveStage: GrowthStage = withered ? "withered" : stage;

  // 파츠는 plantType+effectiveStage에만 의존 → 같은 단계 동안 동일 참조를 반환해
  // React가 SVG 파츠 서브트리 재조정을 건너뛴다. 매초 바뀌는 건 래퍼의 인라인 변환뿐.
  const parts = useMemo(
    () => PARTS_BY_TYPE[plantType](effectiveStage),
    [plantType, effectiveStage],
  );

  // progress → 크기/투명도. React는 1초에 한 번만 이 값을 갱신하고,
  // .plant-growth의 CSS transition이 틱 사이를 60fps로 보간한다.
  const scale = 0.72 + progress * 0.28;
  const opacity = 0.45 + progress * 0.55;

  return (
    // 성장 변환(scale/opacity)은 HTML 래퍼에 인라인으로 적용한다 — SVG <g>나
    // 스타일시트 calc(var()) 경로는 이 엔진에서 변수 변경 시 재계산되지 않기 때문.
    // 시들기 시에는 만개 keyframe이 재생되지 않도록 data-stage를 분리한다.
    <div
      className={cn("plant-growth", className)}
      data-stage={withered ? "withered" : stage}
      data-animate={animate ? "true" : undefined}
      style={
        { "--progress": progress, transform: `scale(${scale})`, opacity } as React.CSSProperties
      }
    >
      <svg
        viewBox="0 0 120 140"
        role="img"
        aria-label={`${plantType} ${effectiveStage}`}
        className={cn(
          "text-primary",
          SIZE_CLASS[size],
          withered && "plant-withered",
        )}
      >
        {/* 화분 흙(공통 베이스) */}
        <g data-part="soil">
          <ellipse cx="60" cy="122" rx="34" ry="8" className="fill-primary/15" />
          <ellipse cx="60" cy="120" rx="26" ry="5" className="fill-primary/25" />
        </g>
        {parts}
      </svg>
    </div>
  );
}
