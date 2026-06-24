// 전역 로딩 UI — 라우트 세그먼트 전환 중 표시되는 골격
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        불러오는 중...
      </p>
    </div>
  );
}
