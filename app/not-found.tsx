import Link from "next/link";

// 404 UI — 존재하지 않는 경로 접근 시 표시되는 골격
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        페이지를 찾을 수 없어요
      </h1>
      <p className="max-w-md text-muted-foreground">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
