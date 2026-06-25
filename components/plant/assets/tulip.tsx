import type { GrowthStage } from "@/lib/types";

// 튤립 식물 파츠 — 단계별 정적(discrete) SVG.
// 공통 viewBox(0 0 120 140), 줄기 베이스 (60,118). 녹색은 테마 토큰(primary),
// 포인트 색(분홍)은 명시적으로 지정한다. 그룹(data-part)으로 분리해 Task 010 연동을 돕는다.
const TULIP_PINK = "#ec4899";
const SEED_BROWN = "#7c5a3a";

export function tulipParts(stage: GrowthStage): React.ReactNode {
  const leaves = (
    <g data-part="leaf">
      <path
        d="M60 118 C44 110 40 92 50 86 C62 92 62 108 60 118 Z"
        className="fill-primary/80"
      />
      <path
        d="M60 118 C76 110 80 92 70 86 C58 92 58 108 60 118 Z"
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
              d="M60 118 L60 92"
              className="stroke-primary"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          <g data-part="leaf">
            <path
              d="M60 100 C50 96 46 86 54 82 C62 86 62 96 60 100 Z"
              className="fill-primary/80"
            />
            <path
              d="M60 104 C70 100 74 90 66 86 C58 90 58 100 60 104 Z"
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
              d="M60 118 L60 60"
              className="stroke-primary"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          {leaves}
          <g data-part="bud">
            <ellipse cx="60" cy="52" rx="10" ry="16" fill={TULIP_PINK} />
            <path
              d="M50 52 C50 44 54 38 60 36 C66 38 70 44 70 52"
              fill="none"
              stroke={TULIP_PINK}
              strokeWidth="2"
              opacity="0.55"
            />
          </g>
        </>
      );
    case "bloom":
    case "withered":
      return (
        <>
          <g data-part="stem">
            <path
              d="M60 118 L60 58"
              className="stroke-primary"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          {leaves}
          <g data-part="petal">
            <path d="M60 58 C46 56 42 36 52 28 C58 38 60 48 60 58 Z" fill={TULIP_PINK} />
            <path d="M60 58 C74 56 78 36 68 28 C62 38 60 48 60 58 Z" fill={TULIP_PINK} />
            <ellipse cx="60" cy="40" rx="9" ry="16" fill={TULIP_PINK} />
            <ellipse cx="60" cy="40" rx="9" ry="16" fill="#fff" opacity="0.12" />
          </g>
        </>
      );
  }
}
