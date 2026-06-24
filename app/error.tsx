"use client"; // 에러 바운더리는 클라이언트 컴포넌트여야 함

import { useEffect } from "react";

// 전역 에러 바운더리 골격 — Next.js 16: error / unstable_retry prop
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // 추후 에러 리포팅 서비스 연동 지점
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-semibold tracking-tight">
        문제가 발생했어요
      </h2>
      <p className="max-w-md text-muted-foreground">
        잠시 후 다시 시도해 주세요.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        다시 시도
      </button>
    </div>
  );
}
