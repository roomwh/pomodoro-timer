import { Loader2 } from "lucide-react";

// 전역 로딩 UI — 라우트 세그먼트 전환 중 표시되는 fallback.
// (세그먼트별 정교한 스켈레톤은 해당 폴더의 loading.tsx가 담당한다. 예: garden/loading.tsx)
export default function Loading() {
  return (
    <div
      className="flex flex-1 items-center justify-center gap-2 p-8"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
      <span className="text-sm text-muted-foreground">불러오는 중…</span>
    </div>
  );
}
