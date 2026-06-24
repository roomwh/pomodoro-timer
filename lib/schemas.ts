// Zod 검증 스키마 — 폼 입력 검증의 단일 출처.
// 추론된 입력 타입(z.infer)을 React Hook Form 연동(Task 004)에서 그대로 재사용한다.
// Zod v4 idiom 사용: 최상위 z.email() (구 z.string().email()은 deprecated).

import { z } from "zod";

import { MAX_DURATION_MINUTES, MIN_DURATION_MINUTES } from "@/lib/constants";

/** 회원가입 폼: 이메일 + 비밀번호(최소 8자) + 비밀번호 확인(일치 검증) */
export const signupSchema = z
  .object({
    email: z.email({ message: "올바른 이메일 형식이 아닙니다." }),
    password: z
      .string()
      .min(8, { message: "비밀번호는 최소 8자 이상이어야 합니다." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

/** 로그인 폼: 이메일 + 비밀번호(미입력만 차단, 길이 정책은 강제하지 않음) */
export const loginSchema = z.object({
  email: z.email({ message: "올바른 이메일 형식이 아닙니다." }),
  password: z.string().min(1, { message: "비밀번호를 입력해주세요." }),
});

/** 타이머 집중 시간 설정: 1~180 정수(분) */
export const focusSettingsSchema = z.object({
  durationMinutes: z
    .int({ message: "집중 시간은 정수로 입력해주세요." })
    .min(MIN_DURATION_MINUTES, {
      message: `집중 시간은 최소 ${MIN_DURATION_MINUTES}분입니다.`,
    })
    .max(MAX_DURATION_MINUTES, {
      message: `집중 시간은 최대 ${MAX_DURATION_MINUTES}분입니다.`,
    }),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type FocusSettingsInput = z.infer<typeof focusSettingsSchema>;
