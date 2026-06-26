import { cn } from "@/lib/utils"

// 스켈레톤 기본 블록 — 데이터 로딩 중 자리표시자.
// muted 배경 + animate-pulse. prefers-reduced-motion 사용자는 Tailwind가 pulse를 자동 정지한다.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
