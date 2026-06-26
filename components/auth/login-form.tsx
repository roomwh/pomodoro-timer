"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
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
// onSubmit에서 Supabase signInWithPassword를 호출하고 성공 시 /timer로 이동한다.
export function LoginForm() {
  const router = useRouter();
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

  // Supabase 브라우저 클라이언트로 로그인. 세션 쿠키는 @supabase/ssr가 자동으로 쓴다.
  // 실패 시 폼 상단 인라인 에러, 성공 시 /timer로 클라이언트 라우팅한다.
  async function onSubmit(values: LoginInput) {
    setFormError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    // 서버 컴포넌트(레이아웃)가 새 세션을 반영하도록 갱신 후 이동.
    router.push("/timer");
    router.refresh();
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
      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting}>
        <FieldGroup>
          {formError ? (
            <div
              id="login-form-error"
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
              autoFocus
              aria-invalid={!!errors.email}
              aria-describedby={formError ? "login-form-error" : undefined}
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
              aria-describedby={formError ? "login-form-error" : undefined}
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> 처리 중…
              </>
            ) : (
              "로그인"
            )}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
