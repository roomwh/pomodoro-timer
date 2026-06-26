# 식물이 자라는 뽀모도로 타이머

집중하는 동안 화면 속 식물이 씨앗에서 만개까지 실시간으로 자라나는 몰입형 뽀모도로 타이머입니다. 완료한 식물은 정원에 누적 전시되고, 날짜별 집중 이력을 조회할 수 있습니다.

- **배포**: https://pomodoro-timer-cyan-eight.vercel.app

## 기술 스택

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (CSS-first) · **shadcn/ui v4** · **Radix UI** · **lucide-react**
- **React Hook Form + Zod** (폼 검증)
- **Supabase** (인증 / PostgreSQL / RLS) — `@supabase/supabase-js` + `@supabase/ssr`
- **Vercel** 배포 · **Vercel Analytics / Speed Insights** 모니터링

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 Supabase 자격 증명을 채웁니다.

```bash
cp .env.example .env.local
```

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개(publishable/anon) 키 — RLS로 보호됨 |

> `NEXT_PUBLIC_*` 변수는 **빌드 시점에 클라이언트 번들로 인라인**됩니다. 값을 바꾸면 재빌드가 필요합니다.

### 3. 개발 서버 실행

```bash
npm run dev      # 개발 서버 (Turbopack)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
npm run lint     # ESLint
```

[http://localhost:3000](http://localhost:3000)을 엽니다.

## 배포 (Vercel)

GitHub 리포가 Vercel 프로젝트에 연결되어 있어 **`main` 브랜치 푸시 시 프로덕션이 자동 배포**됩니다(PR은 프리뷰 배포).

- Vercel 프로젝트에 위 환경 변수 2종을 **Production / Preview**에 등록해야 합니다.
- 이 앱은 이메일/비밀번호 인증(이메일 확인 비활성화)을 직접 호출하고 OAuth·이메일 링크를 쓰지 않으므로, Supabase Auth Redirect URL 등록은 필수가 아닙니다(비밀번호 재설정·소셜 로그인 추가 시 Site URL 등록 권장).

## 성공 지표 모니터링

배포 후 성공 지표는 Vercel 대시보드에서 확인합니다.

| 지표 | 확인 위치 |
|------|-----------|
| **재방문율 / 방문 추이** | Vercel 프로젝트 → **Analytics** 탭 |
| **LCP 등 Web Vitals** | Vercel 프로젝트 → **Speed Insights** 탭 |
| **집중 완료율** | Analytics → **Events**의 `focus_completed` 커스텀 이벤트 (완료 시점 1회 발사, `durationMinutes`/`plantType` 포함, PII 없음) |

> Analytics/Speed Insights는 프로덕션 Vercel 환경에서만 데이터를 전송하며, 로컬/개발 환경에는 영향이 없습니다.

## 프로젝트 구조

- `app/` — App Router 라우트·레이아웃. `(auth)` 비로그인 전용 / `(app)` 로그인 필수 그룹
- `components/` — UI·도메인 컴포넌트 (`ui/` shadcn, `plant/` 식물 SVG·성장 애니메이션, `timer/`, `garden/`, `auth/`)
- `lib/` — 도메인 타입·상수·Supabase 클라이언트·유틸
- `app/actions/` — 서버 액션 (인증, 세션 저장)
- `proxy.ts` — 세션 토큰 갱신 및 보호/비보호 라우트 리디렉션
- `tasks/` — 단계별 개발 작업 명세 · `docs/ROADMAP.md` — 개발 로드맵
