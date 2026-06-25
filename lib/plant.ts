// 식물 성장 단계 계산 — progress(0.0~1.0)를 성장 단계로 매핑하는 단일 진실 공급원.
// 경계값은 `GROWTH_STAGE_RANGES`(lib/constants)와 동일하며, Task 010(성장 애니메이션)도
// 이 함수를 재사용한다. `withered`(시들기)는 progress 기반이 아니므로 여기서 다루지 않는다.

import { GROWTH_STAGE_RANGES } from "@/lib/constants";
import type { GrowthStage } from "@/lib/types";

/**
 * progress(0.0~1.0)에 해당하는 성장 단계를 반환한다.
 * 각 구간은 `[min, max)` 반열림이며, 마지막 만개 구간만 1.0을 포함한다.
 * 범위를 벗어난 입력은 0~1로 클램프한다.
 */
export function getGrowthStage(progress: number): GrowthStage {
  const clamped = Math.min(1, Math.max(0, progress));

  for (const range of GROWTH_STAGE_RANGES) {
    // 마지막 구간(만개)은 1.0을 포함하도록 max 경계를 포함 처리한다.
    const includesMax = range.max === 1.0;
    if (
      clamped >= range.min &&
      (includesMax ? clamped <= range.max : clamped < range.max)
    ) {
      return range.stage;
    }
  }

  // 이론상 도달하지 않음(클램프된 값은 항상 한 구간에 속함).
  return "bloom";
}
