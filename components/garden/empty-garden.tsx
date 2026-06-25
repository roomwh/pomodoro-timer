import Link from "next/link";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyGarden() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <Sprout className="size-12 text-muted-foreground/50" />
      <div className="space-y-1">
        <p className="font-medium">아직 심어진 식물이 없어요</p>
        <p className="text-sm text-muted-foreground">
          첫 집중을 완료하면 이곳에 식물이 자라납니다.
        </p>
      </div>
      <Button asChild>
        <Link href="/timer">타이머 시작하기</Link>
      </Button>
    </div>
  );
}
