"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
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
// onSubmit에서 Supabase signUp을 호출한다. 이메일 확인 비활성화(대시보드 설정)이므로
// 가입 즉시 자동 로그인되어 /timer로 이동한다.
export function SignupForm() {
  const router = useRouter();
  // 가입 실패(이미 가입된 이메일 등) 시 폼 상단에 표시할 전역 에러 메시지.
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // Supabase 브라우저 클라이언트로 회원가입. 이메일 확인 비활성화 가정으로 즉시 세션 생성.
  // 실패 시 인라인 에러, 성공 시 /timer로 이동한다.
  async function onSubmit(values: SignupInput) {
    setFormError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError("회원가입에 실패했습니다. 이미 사용 중인 이메일일 수 있습니다.");
      return;
    }

    // 서버 컴포넌트(레이아웃)가 새 세션을 반영하도록 갱신 후 이동.
    router.push("/timer");
    router.refresh();
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
      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting}>
        <FieldGroup>
          {formError ? (
            <div
              id="signup-form-error"
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="signup-email">이메일</FieldLabel>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              autoFocus
              aria-invalid={!!errors.email}
              aria-describedby={formError ? "signup-form-error" : undefined}
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
              aria-describedby={formError ? "signup-form-error" : undefined}
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
              aria-describedby={formError ? "signup-form-error" : undefined}
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> 처리 중…
              </>
            ) : (
              "회원가입"
            )}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
