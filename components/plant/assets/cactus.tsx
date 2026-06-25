import type { GrowthStage } from "@/lib/types";

// 선인장 식물 파츠 — 단계별 정적 SVG.
// 몸통은 테마 토큰(primary), 꽃봉오리 단계는 가시/돌기로 표현하고 만개 시 작은 꽃을 얹는다.
const CACTUS_FLOWER = "#ef6aa6";
const SEED_BROWN = "#7c5a3a";

// 몸통 양옆 가시(돌기) 표현.
function spines() {
  return (
    <g data-part="leaf" className="stroke-primary/50" strokeWidth="1.5" strokeLinecap="round">
      <path d="M46 96 L40 94" />
      <path d="M46 82 L40 80" />
      <path d="M46 68 L40 66" />
      <path d="M74 96 L80 94" />
      <path d="M74 82 L80 80" />
      <path d="M74 68 L80 66" />
    </g>
  );
}

export function cactusParts(stage: GrowthStage): React.ReactNode {
  switch (stage) {
    case "seed":
      return (
        <g data-part="seed">
          <ellipse cx="60" cy="112" rx="5" ry="4" fill={SEED_BROWN} />
        </g>
      );
    case "sprout":
      return (
        <g data-part="stem">
          <path
            d="M52 118 Q52 100 60 100 Q68 100 68 118 Z"
            className="fill-primary"
          />
        </g>
      );
    case "bud":
      return (
        <>
          <g data-part="stem">
            <path
              d="M48 118 Q48 64 60 64 Q72 64 72 118 Z"
              className="fill-primary"
            />
            {/* 팔(곁가지) */}
            <path
              d="M72 92 Q86 92 86 80 L86 74"
              className="stroke-primary"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          {spines()}
        </>
      );
    case "bloom":
    case "withered":
      return (
        <>
          <g data-part="stem">
            <path
              d="M48 118 Q48 60 60 60 Q72 60 72 118 Z"
              className="fill-primary"
            />
            <path
              d="M72 92 Q86 92 86 80 L86 72"
              className="stroke-primary"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          {spines()}
          <g data-part="petal">
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse
                key={deg}
                cx="60"
                cy="50"
                rx="4"
                ry="8"
                fill={CACTUS_FLOWER}
                transform={`rotate(${deg} 60 58)`}
              />
            ))}
            <circle cx="60" cy="58" r="4" fill="#fde047" />
          </g>
        </>
      );
  }
}
