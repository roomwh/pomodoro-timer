"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { loginSchema, type LoginInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { AuthCard } from "@/components/auth/auth-card";

// 로그인 폼 — loginSchema 기반 React Hook Form + Zod 클라이언트 검증.
// 폼 상단 인라인 에러 영역(role="alert")은 자격 증명 실패 메시지 자리다.
// 실제 인증 결과 배선은 Task 008에서 onSubmit을 교체하며 연결한다(현재는 더미).
export function LoginForm() {
  // 자격 증명 실패 등 필드 단위가 아닌 폼 전역 에러 메시지.
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  // 더미 제출: 데모 센티넬(비밀번호 "error")일 때만 인라인 에러를 시연한다.
  // 실제 Supabase signInWithPassword 결과로 교체될 자리(Task 008).
  async function onSubmit(values: LoginInput) {
    setFormError(null);
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (values.password === "error") {
      setFormError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    toast.success("입력이 확인되었습니다.", {
      description: "데모 모드입니다 — 실제 로그인 처리는 추후 연결됩니다.",
    });
  }

  return (
    <AuthCard
      title="로그인"
      description="다시 오신 것을 환영해요. 오늘도 집중을 심어볼까요?"
      footer={
        <>
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            회원가입
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {formError ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="login-email">이메일</FieldLabel>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="login-password">비밀번호</FieldLabel>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "처리 중…" : "로그인"}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
