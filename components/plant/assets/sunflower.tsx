import type { GrowthStage } from "@/lib/types";

// 해바라기 식물 파츠 — 단계별 정적 SVG.
// 녹색은 테마 토큰(primary), 꽃잎 노랑/중심 갈색은 명시적으로 지정한다.
const SUNFLOWER_YELLOW = "#f5b301";
const SUNFLOWER_CENTER = "#7c4a1e";
const SEED_BROWN = "#7c5a3a";

// 중심 둘레로 꽃잎을 12장 배치한 만개 형태.
function petals(cx: number, cy: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const deg = (360 / 12) * i;
    return (
      <ellipse
        key={deg}
        cx={cx}
        cy={cy - 18}
        rx="5"
        ry="11"
        fill={SUNFLOWER_YELLOW}
        transform={`rotate(${deg} ${cx} ${cy})`}
      />
    );
  });
}

export function sunflowerParts(stage: GrowthStage): React.ReactNode {
  const leaves = (
    <g data-part="leaf">
      <path
        d="M60 116 C42 110 38 94 48 88 C62 94 62 108 60 116 Z"
        className="fill-primary/80"
      />
      <path
        d="M60 110 C78 104 82 88 72 82 C58 88 58 102 60 110 Z"
        className="fill-primary/80"
      />
    </g>
  );

  switch (stage) {
    case "seed":
      return (
        <g data-part="seed">
          <ellipse cx="60" cy="112" rx="5" ry="4" fill={SEED_BROWN} />
        </g>
      );
    case "sprout":
      return (
        <>
          <g data-part="stem">
            <path
              d="M60 118 L60 94"
              className="stroke-primary"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          <g data-part="leaf">
            <path
              d="M60 102 C49 98 45 88 53 84 C61 88 61 98 60 102 Z"
              className="fill-primary/80"
            />
            <path
              d="M60 106 C71 102 75 92 67 88 C59 92 59 102 60 106 Z"
              className="fill-primary/80"
            />
          </g>
        </>
      );
    case "bud":
      return (
        <>
          <g data-part="stem">
            <path
              d="M60 118 L60 56"
              className="stroke-primary"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          {leaves}
          <g data-part="bud">
            <circle cx="60" cy="50" r="13" className="fill-primary" />
            <circle cx="60" cy="50" r="7" fill={SUNFLOWER_CENTER} opacity="0.4" />
          </g>
        </>
      );
    case "bloom":
    case "withered":
      return (
        <>
          <g data-part="stem">
            <path
              d="M60 118 L60 52"
              className="stroke-primary"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          {leaves}
          <g data-part="petal">{petals(60, 44)}</g>
          <g data-part="bud">
            <circle cx="60" cy="44" r="11" fill={SUNFLOWER_CENTER} />
          </g>
        </>
      );
  }
}
