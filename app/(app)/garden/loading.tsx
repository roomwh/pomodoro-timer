import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// 정원 페이지 로딩 스켈레톤 — getGardenData() 조회 동안 표시된다.
// GardenView/GardenStats의 실제 레이아웃 클래스를 그대로 따라 레이아웃 시프트를 최소화한다.
export default function GardenLoading() {
  return (
    <div
      className="flex flex-col gap-6 py-6"
      role="status"
      aria-busy="true"
      aria-label="정원을 불러오는 중"
    >
      {/* 집계 카드 2개 (GardenStats 동형) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col items-center justify-center gap-2 p-4">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 탭 바 */}
      <Skeleton className="h-9 w-full sm:w-48" />

      {/* 식물 격자 (PlantCard 동형, 2/3/4 컬럼) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="flex flex-col items-center gap-2 p-4">
            <CardContent className="flex flex-col items-center gap-2 p-0">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-10" />
            </CardContent>
          </Card>
        ))}
      </div>

      <span className="sr-only">정원을 불러오는 중입니다…</span>
    </div>
  );
}
