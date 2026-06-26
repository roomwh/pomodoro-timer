"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// 포기 확인 다이얼로그 — 진행 중 세션을 포기할지 확인한다.
// 확인 시 onConfirm(시들기 표현 → 세션 'abandoned' 저장 → 초기화)을 호출한다.
// Radix Dialog가 포커스 트랩/Esc 닫기/스크롤 잠금을 기본 제공한다.
export function AbandonDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>정말 포기할까요?</DialogTitle>
          <DialogDescription>
            지금 멈추면 자라던 식물이 시들어요. 집중을 이어가는 건 어떨까요?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">계속 집중하기</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            포기하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
