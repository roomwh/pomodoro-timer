import { cn } from "@/lib/utils";
import type { GrowthStage, PlantType } from "@/lib/types";
import { tulipParts } from "@/components/plant/assets/tulip";
import { sunflowerParts } from "@/components/plant/assets/sunflower";
import { cactusParts } from "@/components/plant/assets/cactus";

// 식물 디스패처 — plantType + stage 조합으로 해당 SVG를 렌더한다.
// 녹색 파츠는 text-primary 토큰을 상속(fill-primary/stroke-primary)하며,
// `withered`는 시들기 정적 표현(채도↓ + 기울임)으로 표시한다.
// 단계 간 부드러운 보간/시들기 트랜지션은 Task 010에서 추가한다.

// 식물 종류별 파츠 빌더 매핑. 정적 Plant(정원용)와 GrowingPlant(타이머 애니메이션)가
// 공유하므로 export 한다 — 중복 정의 금지.
export const PARTS_BY_TYPE: Record<
  PlantType,
  (stage: GrowthStage) => React.ReactNode
> = {
  tulip: tulipParts,
  sunflower: sunflowerParts,
  cactus: cactusParts,
};

const SIZE_CLASS = {
  sm: "size-24",
  md: "size-40",
  lg: "size-56",
} as const;

export function Plant({
  plantType,
  stage,
  withered = false,
  size = "md",
  className,
}: {
  plantType: PlantType;
  stage: GrowthStage;
  withered?: boolean;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  // withered가 명시되면 시들기 우선, 아니면 stage 그대로 렌더.
  const effectiveStage: GrowthStage = withered ? "withered" : stage;
  const parts = PARTS_BY_TYPE[plantType](effectiveStage);

  return (
    <svg
      viewBox="0 0 120 140"
      role="img"
      aria-label={`${plantType} ${effectiveStage}`}
      className={cn(
        "text-primary",
        SIZE_CLASS[size],
        withered && "[filter:grayscale(0.6)_sepia(0.35)] rotate-6 opacity-70",
        className,
      )}
    >
      {/* 화분 흙(공통 베이스) */}
      <g data-part="soil">
        <ellipse cx="60" cy="122" rx="34" ry="8" className="fill-primary/15" />
        <ellipse cx="60" cy="120" rx="26" ry="5" className="fill-primary/25" />
      </g>
      {parts}
    </svg>
  );
}
