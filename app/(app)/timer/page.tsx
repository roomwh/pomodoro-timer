// 타이머 페이지 골격 (/timer) — 실제 UI는 Task 005, 타이머 로직은 Task 009에서 구현
export default function TimerPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">타이머</h1>
      <p className="text-muted-foreground">
        집중 타이머와 식물 성장 화면은 추후 구현됩니다.
      </p>
    </div>
  );
}
