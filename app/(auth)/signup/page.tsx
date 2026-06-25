import { SignupForm } from "@/components/auth/signup-form";

// 회원가입 페이지 (/signup) — 서버 컴포넌트로 유지하고 클라이언트 폼을 마운트.
// 실제 인증 연동은 Task 008.
export default function SignupPage() {
  return <SignupForm />;
}
