// 정원 페이지 — 서버 컴포넌트.
// Task 011에서 아래 import를 실제 Supabase 쿼리 함수로 교체하면 된다.
import {
  MOCK_GARDEN_PLANTS,
  MOCK_FOCUS_SESSIONS,
  getCompletedSessionCount,
  getTotalFocusMinutes,
} from "@/lib/mock-data";
import { GardenView } from "@/components/garden/garden-view";

export default function GardenPage() {
  const plants = MOCK_GARDEN_PLANTS;
  const sessions = MOCK_FOCUS_SESSIONS;
  const completedCount = getCompletedSessionCount(sessions);
  const totalMinutes = getTotalFocusMinutes(sessions);

  return (
    <GardenView
      plants={plants}
      sessions={sessions}
      completedCount={completedCount}
      totalMinutes={totalMinutes}
    />
  );
}
