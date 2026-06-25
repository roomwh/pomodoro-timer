import { TimerView } from "@/components/timer/timer-view";

// 타이머 페이지 (/timer) — 서버 컴포넌트로 유지하고 클라이언트 타이머 UI를 마운트.
// 실제 타이머 로직은 Task 009, 식물 성장 애니메이션은 Task 010, 세션 저장은 Task 011.
export default function TimerPage() {
  return <TimerView />;
}
