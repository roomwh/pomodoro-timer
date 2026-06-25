"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { signupSchema, type SignupInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { AuthCard } from "@/components/auth/auth-card";

// 회원가입 폼 — signupSchema 기반 React Hook Form + Zod 클라이언트 검증.
// 실제 Supabase Auth 연동은 Task 008에서 onSubmit을 교체한다(현재는 더미 비동기).
export function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // 더미 제출: 실제 인증 호출 없이 지연 후 안내 토스트만 노출(Task 008에서 교체).
  // 입력값은 Task 008에서 Supabase signUp 인자로 사용 예정(현재는 미사용).
  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast.success("입력이 확인되었습니다.", {
      description: "데모 모드입니다 — 실제 가입 처리는 추후 연결됩니다.",
    });
  }

  return (
    <AuthCard
      title="회원가입"
      description="집중을 시작하고 나만의 정원을 가꿔보세요."
      footer={
        <>
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            로그인
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="signup-email">이메일</FieldLabel>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="signup-password">비밀번호</FieldLabel>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="최소 8자 이상"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="signup-confirm">비밀번호 확인</FieldLabel>
            <Input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호 재입력"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "처리 중…" : "회원가입"}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
