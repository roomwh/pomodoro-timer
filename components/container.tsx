import { cn } from "@/lib/utils";

// 페이지·헤더 콘텐츠를 가운데로 정렬하는 반응형 컨테이너.
// 좌우 여백은 모바일(px-4) → 데스크톱(sm:px-6)으로 단계 적용하고, 최대 폭을 제한해 중앙 배치한다.
function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="container"
      className={cn("mx-auto w-full max-w-5xl px-4 sm:px-6", className)}
      {...props}
    />
  );
}

export { Container };
