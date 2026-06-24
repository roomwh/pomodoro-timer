// 정원 페이지 골격 (/garden) — 실제 UI는 Task 006, 데이터 연동은 Task 011에서 구현
export default function GardenPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">정원</h1>
      <p className="text-muted-foreground">
        완성한 식물과 집중 기록은 추후 구현됩니다.
      </p>
    </div>
  );
}
