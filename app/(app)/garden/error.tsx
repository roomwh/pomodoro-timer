"use client"; // 에러 바운더리는 클라이언트 컴포넌트여야 함

import { useEffect } from "react";
import { RotateCcw, SproutIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

// 정원 세그먼트 전용 에러 바운더리 — getGardenData() 조회 실패 등 정원 맥락 에러를 처리한다.
// 전역 app/error.tsx와 달리 "정원" 맥락의 메시지와 복구 경로를 제공한다.
export default function GardenError({
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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <SproutIcon className="size-12 text-muted-foreground/50" aria-hidden />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          정원을 불러오지 못했어요
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          일시적인 문제일 수 있어요. 잠시 후 다시 시도해 주세요.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => unstable_retry()}>
          <RotateCcw /> 다시 시도
        </Button>
        <Button variant="outline" asChild>
          <Link href="/timer">타이머로 돌아가기</Link>
        </Button>
      </div>
    </div>
  );
}
