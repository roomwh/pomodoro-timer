import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PlantPreview } from "@/components/plant-preview";

// 랜딩 페이지 (/) — 헤드라인 + 정적 식물 성장 미리보기 + CTA.
// 실제 인증 연동은 Task 008, 식물 SVG 풀세트는 Task 005에서 다룬다.
export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12 text-center sm:gap-10 sm:py-16">
      <div className="flex flex-col items-center gap-4">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          집중하는 동안 식물이 자라납니다
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          커스텀 집중 시간 동안 씨앗에서 만개까지, 몰입의 결과를 정원에 심어보세요.
        </p>
      </div>

      <PlantPreview />

      <div className="flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:flex-row">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/signup">시작하기</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
          <Link href="/login">로그인</Link>
        </Button>
      </div>
    </div>
  );
}
