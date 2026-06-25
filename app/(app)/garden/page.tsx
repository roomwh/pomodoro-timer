// 정원 페이지 — 서버 컴포넌트.
// 로그인 사용자의 실제 세션을 조회해 정원 격자·기록·집계를 렌더한다(Task 011).
import { getGardenData } from "@/lib/garden";
import { GardenView } from "@/components/garden/garden-view";

export default async function GardenPage() {
  const { sessions, plants, completedCount, totalMinutes } =
    await getGardenData();

  return (
    <GardenView
      plants={plants}
      sessions={sessions}
      completedCount={completedCount}
      totalMinutes={totalMinutes}
    />
  );
}
