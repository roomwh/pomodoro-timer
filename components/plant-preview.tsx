import { cn } from "@/lib/utils";

// 랜딩용 정적(static) 식물 성장 미리보기 — 씨앗 → 새싹 → 꽃봉오리 → 만개.
// 장식 요소이므로 aria-hidden. green 디자인 토큰(currentColor) 기반의 단순 일러스트로,
// 3종×4단계 실제 SVG 에셋과 progress 연동은 Task 005에서 제작·교체한다.

const STAGES = ["seed", "sprout", "bud", "bloom"] as const;

// 단계별 줄기 높이/장식 — 오른쪽으로 갈수록 자란 모습을 표현.
const STAGE_VISUAL: Record<
  (typeof STAGES)[number],
  { stemY: number; crown: React.ReactNode }
> = {
  seed: {
    stemY: 40,
    crown: <circle cx="24" cy="40" r="3" className="fill-current opacity-70" />,
  },
  sprout: {
    stemY: 30,
    crown: (
      <>
        <path
          d="M24 32 C18 30 16 24 20 22 C24 24 24 28 24 32 Z"
          className="fill-current opacity-80"
        />
        <path
          d="M24 32 C30 30 32 24 28 22 C24 24 24 28 24 32 Z"
          className="fill-current opacity-80"
        />
      </>
    ),
  },
  bud: {
    stemY: 22,
    crown: (
      <>
        <ellipse cx="24" cy="18" rx="5" ry="8" className="fill-current opacity-90" />
        <path d="M19 20 C16 18 16 14 19 13" className="fill-none stroke-current opacity-50" strokeWidth="1.5" />
      </>
    ),
  },
  bloom: {
    stemY: 22,
    crown: (
      <g>
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="24"
            cy="9"
            rx="3.5"
            ry="7"
            className="fill-current opacity-90"
            transform={`rotate(${deg} 24 16)`}
          />
        ))}
        <circle cx="24" cy="16" r="3" className="fill-current" />
      </g>
    ),
  },
};

function PlantPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-end justify-center gap-4 text-primary sm:gap-8",
        className,
      )}
    >
      {STAGES.map((stage) => {
        const { stemY, crown } = STAGE_VISUAL[stage];
        return (
          <svg
            key={stage}
            viewBox="0 0 48 56"
            className="h-16 w-12 sm:h-20 sm:w-16"
            fill="none"
          >
            {/* 화분 흙 */}
            <ellipse cx="24" cy="50" rx="13" ry="4" className="fill-current opacity-15" />
            {/* 줄기 */}
            <line
              x1="24"
              y1="50"
              x2="24"
              y2={stemY}
              className="stroke-current opacity-60"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {crown}
          </svg>
        );
      })}
    </div>
  );
}

export { PlantPreview };
