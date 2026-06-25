import { LoginForm } from "@/components/auth/login-form";

// 로그인 페이지 (/login) — 서버 컴포넌트로 유지하고 클라이언트 폼을 마운트.
// 실제 인증 연동은 Task 008.
export default function LoginPage() {
  return <LoginForm />;
}
