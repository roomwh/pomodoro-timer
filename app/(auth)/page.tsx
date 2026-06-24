import Link from "next/link";

// 랜딩 페이지 골격 (/) — 실제 UI는 Task 004에서 구현
export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        집중하는 동안 식물이 자라납니다
      </h1>
      <p className="max-w-md text-muted-foreground">
        커스텀 집중 시간 동안 씨앗에서 만개까지, 몰입의 결과를 정원에 심어보세요.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          시작하기
        </Link>
        <Link
          href="/login"
          className="rounded-md border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          로그인
        </Link>
      </div>
    </div>
  );
}
