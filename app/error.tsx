"use client"; // 에러 바운더리는 클라이언트 컴포넌트여야 함

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

// 전역 에러 바운더리 — 세그먼트 전용 바운더리(예: garden/error.tsx)가 잡지 못한
// 모든 에러의 최후 fallback. Next.js 16: error / unstable_retry prop.
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
      {/* digest는 서버 로그 대조용 식별자 — 개발 환경에서만 노출(프로덕션 민감정보 누출 방지) */}
      {process.env.NODE_ENV === "development" && error.digest ? (
        <p className="font-mono text-xs text-muted-foreground/70">
          digest: {error.digest}
        </p>
      ) : null}
      <Button onClick={() => unstable_retry()}>
        <RotateCcw /> 다시 시도
      </Button>
    </div>
  );
}
