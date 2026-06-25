# Task 007: Supabase 설정 및 데이터 모델/RLS 구축

- **Phase**: 3 (핵심 기능 구현)
- **상태**: 완료
- **우선순위**: 우선순위 (Phase 3 진입점)
- **유형**: 인프라/데이터 계층 (DB·클라이언트 헬퍼). 실제 인증 플로우·세션 저장 로직은 제외

## 개요 (고수준 명세서)

Phase 1~2에서 설계 문서로만 존재하던 **데이터 모델(`docs/DATA_MODEL.md`)을 실제 Supabase에 구축**하고, App Router에서 Supabase에 접근할 **브라우저/서버 클라이언트 헬퍼**를 세운다. 즉 이 작업은 "DB가 실제로 존재하고, 본인 데이터만 접근 가능하며, Next.js에서 타입 안전하게 호출할 수 있는 토대"를 만드는 것이 목적이다. 이후 인증(Task 008)·세션 저장(Task 011)이 이 토대 위에서 동작한다.

범위와 경계:

- **DB 구축**: `focus_sessions` 테이블 + CHECK 제약 + 인덱스 + RLS 정책 + 정원 뷰를 **실제 SQL로 생성**한다. SQL은 버전 관리되는 마이그레이션 파일로 커밋한다.
- **클라이언트 헬퍼**: `@supabase/supabase-js`·`@supabase/ssr`를 설치하고 `lib/supabase/client.ts`(브라우저)·`lib/supabase/server.ts`(서버 컴포넌트/액션)를 작성한다.
- **인증 플로우 없음**: 회원가입/로그인/로그아웃 `signUp`/`signInWithPassword`·`getClaims()` 보호 라우트·헤더 이메일 표시는 **Task 008**. 본 작업은 클라이언트 "생성"까지만 책임진다.
- **`proxy.ts` 세션 갱신 없음**: 만료 토큰 갱신(`updateSession`)·optimistic 리디렉션 로직은 **Task 008**. 본 작업은 `proxy.ts`를 수정하지 않는다(빈 골격 유지). 단, Task 008이 바로 쓸 수 있도록 SSR 쿠키 처리 패턴을 server 헬퍼에 맞춰 둔다.
- **세션 저장·정원 쿼리 없음**: 타이머 완료 시 INSERT, 정원 페이지의 실제 SELECT 쿼리, snake_case↔camelCase 매핑 함수는 **Task 011**. 본 작업은 더미 데이터(`lib/mock-data.ts`)를 교체하지 않는다.
- **DB 생성 SQL 자동화 검증**: 본 작업의 "테스트"는 RLS·CHECK 제약이 의도대로 동작하는지 **SQL 레벨 검증**이다(애플리케이션 UI 변화 없음).

## 선행 조건 (대부분 Supabase MCP로 자동 처리)

> **변경**: 이 프로젝트에는 Supabase **MCP 서버가 연결·인증**되어 있다(`.mcp.json`, project_ref=`nklqdefkditbamxossyr`). 따라서 아래 항목 대부분은 사용자의 대시보드 수동 작업 없이 MCP 도구로 처리한다.

- **Supabase 프로젝트 생성**: ✅ 완료. 프로젝트 `nklqdefkditbamxossyr` 생성됨(`https://nklqdefkditbamxossyr.supabase.co`).
- **Project URL·anon/publishable 키**: MCP `get_project_url`·`get_publishable_keys`로 조회해 `.env.local`에 기입한다(사용자 수동 복사 불필요). `.env.local`은 커밋하지 않으며, 키 이름만 담은 `.env.example`을 커밋한다.
- **인증 설정("Confirm email" 비활성화)**: 대시보드 **Authentication → Providers → Email** 전용 설정으로 **MCP 도구로 변경·확인 불가** → **유일한 사용자 수동 액션**. 단 이는 **Task 008(회원가입 자동 로그인) 전제**이며 **본 Task 007에는 불필요**하다. 지금 미리 꺼 두거나 Task 008 직전에 처리한다(007 진행을 막지 않음).

## 현재 상태 (파악 결과)

- **Supabase MCP**: `.mcp.json`에 연결·인증 완료. 원격 `public` 스키마는 **비어 있고**(`focus_sessions` 없음), 마이그레이션 이력 **0건**. `auth` 스키마만 Supabase 기본 세팅됨(사용자 0명).
- `docs/DATA_MODEL.md`: `focus_sessions` 컬럼·CHECK·인덱스·RLS(operation별 USING/WITH CHECK)·정원 전략 A(View, 권장)/B(별도 테이블) 비교가 **설계 완료**. 본 작업은 이 문서를 **그대로 실행**한다.
- `lib/types.ts`·`lib/constants.ts`: `PlantType`/`SessionStatus`(`PersistedSessionStatus`)·`FocusSession`·`GardenPlant` 정의됨. CHECK 목록(`tulip/sunflower/cactus`, `completed/abandoned`)이 constants `as const`와 동기화되어야 함.
- `proxy.ts`: 빈 골격(`NextResponse.next()`) + matcher만 존재. 세션 갱신 로직 주석에 "Task 008"로 명시됨 → **건드리지 않음**.
- `package.json`: Supabase 의존성 **없음**. `@supabase/supabase-js`·`@supabase/ssr` 추가 필요.
- `.env*`: 존재하지 않음 → `.env.local`(비커밋)·`.env.example`(커밋) 신규 생성.
- `.gitignore`: **34행 `.env*`가 `.env.example`까지 무시**한다 → `!.env.example` 예외를 추가해야 커밋 가능(아래 관련 파일 참고).
- `lib/supabase/`: 디렉터리 없음 → 신규.

## 설계 결정

### 정원(garden) 전략: A안 — View 채택
- `docs/DATA_MODEL.md`의 권장안대로 **`garden_plants` View**(= `status='completed'`인 `focus_sessions`의 투영)를 채택한다. 데이터 중복·동기화 비용이 없고 현재 요구사항(아이콘 + 날짜 + 집중 시간)에 충분하다.
- **`security_invoker = true`** 로 생성하여 뷰가 기반 테이블(`focus_sessions`)의 RLS를 따르도록 한다(별도 정책 불필요). B안(별도 테이블) 전환은 정원 전용 메타데이터가 필요해질 때로 미룬다.

### SQL 관리 방식: 버전 관리 마이그레이션 파일 + MCP 적용
- `supabase/migrations/0001_init.sql`에 DDL·RLS·View를 **멱등적이지 않은 초기 마이그레이션**으로 작성하고 커밋한다(SQL이 코드 리뷰·이력 추적 가능). 이 파일이 **버전 관리상의 단일 진실 공급원**이다.
- **적용은 MCP `apply_migration`을 기본 경로**로 한다(파일과 동일한 SQL을 전달). MCP가 원격 DB에 적용하고 Supabase 마이그레이션 이력에도 기록한다(원격 이력의 타임스탬프 명칭은 로컬 `0001_init`과 다를 수 있으며 무방).
- 대체 경로(참고용): 대시보드 **SQL Editor** 붙여넣기 또는 `supabase db push`(CLI). MCP가 연결돼 있으므로 **본 작업에선 사용하지 않는다**.

### 클라이언트 헬퍼 아키텍처 (`@supabase/ssr`)
- **브라우저용** `lib/supabase/client.ts`: `createBrowserClient`를 감싸는 `createClient()`. 클라이언트 컴포넌트에서 사용.
- **서버용** `lib/supabase/server.ts`: `createServerClient` + `next/headers`의 `cookies()`를 사용하는 **async `createClient()`**. `getAll`/`setAll` 쿠키 핸들러를 구현하되, 서버 컴포넌트에서 `setAll`이 호출될 때의 try/catch 패턴(쓰기 불가 컨텍스트 무시)을 포함한다 — Task 008의 `proxy.ts` 세션 갱신이 쿠키를 책임진다는 전제.
- **환경 변수 접근**은 두 헬퍼에서만 수행하고, 누락 시 명확한 에러를 던지도록 한다(런타임 초기 실패 → 디버깅 용이).

### 환경 변수 명세
| 변수 | 노출 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 공개(클라이언트 번들 포함) | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개(anon/publishable 키, RLS로 보호) | `get_publishable_keys`로 조회. **publishable 키(`sb_publishable_...`) 권장**, legacy anon(JWT) 키도 호환 |

> anon/publishable 키는 공개되어도 RLS가 데이터를 보호한다(공개 전제로 설계됨). 환경 변수 **이름은 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 관례를 유지**하되, 값은 modern publishable 키를 넣는다(`@supabase/ssr`은 둘 다 동작). service_role 키는 **사용하지 않으며 커밋·클라이언트 노출 절대 금지**.

## 목표 파일 구조

```
lib/supabase/
├── client.ts            # 신규: createBrowserClient 래퍼 (브라우저 컴포넌트용)
└── server.ts            # 신규: createServerClient 래퍼 (서버 컴포넌트/액션용, async)
supabase/
└── migrations/
    └── 0001_init.sql    # 신규: focus_sessions DDL + 인덱스 + RLS + garden_plants View
.env.example             # 신규(커밋): 키 이름만 (값 없음)
.env.local               # 신규(비커밋): 실제 자격 증명
```

> `proxy.ts`·`lib/mock-data.ts`·정원/타이머 페이지는 본 작업에서 수정하지 않는다. import alias는 `@/lib/supabase/client`·`@/lib/supabase/server`.

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `package.json` | 수정 | `@supabase/supabase-js`·`@supabase/ssr` 의존성 추가 |
| `lib/supabase/client.ts` | 신규 | `createBrowserClient` 기반 브라우저 클라이언트 |
| `lib/supabase/server.ts` | 신규 | `createServerClient` + `cookies()` 기반 async 서버 클라이언트 |
| `supabase/migrations/0001_init.sql` | 신규 | 테이블·CHECK·인덱스·RLS 정책·정원 View DDL |
| `.env.example` | 신규(커밋) | `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 키 이름 |
| `.env.local` | 신규(비커밋) | 실제 URL·anon 키 (사용자 발급값) |
| `.gitignore` | **수정 필요** | 34행 `.env*`가 `.env.example`까지 무시함 → `!.env.example` 예외 추가(`.env.local` 비커밋은 유지) |
| `docs/DATA_MODEL.md` | 수정(소폭) | 정원 전략 **A안(View) 최종 확정** 및 "Task 007 적용 완료" 상태 갱신 |

## 마이그레이션 SQL 명세 (`supabase/migrations/0001_init.sql`)

`docs/DATA_MODEL.md`의 DDL 초안을 그대로 적용한다.

1. **테이블**: `public.focus_sessions`
   - `id uuid pk default gen_random_uuid()`
   - `user_id uuid not null references auth.users(id) on delete cascade`
   - `duration_minutes int not null check (between 1 and 180)`
   - `status text not null check (in ('completed','abandoned'))`
   - `plant_type text not null check (in ('tulip','sunflower','cactus'))`
   - `started_at timestamptz not null` / `completed_at timestamptz` / `created_at timestamptz not null default now()`
2. **인덱스**: `focus_sessions_user_created_idx on (user_id, created_at desc)`
3. **RLS**: `enable row level security` + operation별 정책 4종
   - SELECT `using (auth.uid() = user_id)`
   - INSERT `with check (auth.uid() = user_id)`
   - UPDATE `using (...) with check (...)`
   - DELETE `using (auth.uid() = user_id)`
4. **정원 View**: `create view public.garden_plants with (security_invoker = true) as select id, user_id, plant_type, completed_at as planted_at, duration_minutes from public.focus_sessions where status = 'completed';`

## 수락 기준 (Acceptance Criteria)

- [ ] `@supabase/supabase-js`·`@supabase/ssr`가 `package.json`에 추가된다.
- [ ] `lib/supabase/client.ts`(브라우저)·`lib/supabase/server.ts`(서버, async + `cookies()`)가 작성되고, 환경 변수 누락 시 명확히 실패한다.
- [ ] `.gitignore`에 `!.env.example` 예외가 추가되어 `.env.example`이 커밋되고(키 이름만), `.env.local`은 비커밋 처리되어 자격 증명이 노출되지 않는다.
- [ ] `supabase/migrations/0001_init.sql`이 `focus_sessions` 테이블·CHECK 제약·인덱스·RLS 정책 4종·`garden_plants` View(`security_invoker`)를 포함한다.
- [ ] MCP `apply_migration`으로 마이그레이션이 적용되어 `list_tables`/`list_migrations`로 테이블·뷰·정책 생성이 확인되고, `get_advisors(security)`에 RLS 관련 경고가 없다.
- [ ] CHECK 목록(`plant_type`·`status`)이 `lib/constants.ts`의 `as const` 집합과 일치한다.
- [ ] `docs/DATA_MODEL.md`에 정원 전략 A안(View) 최종 확정 및 적용 상태가 반영된다.
- [ ] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과(클라이언트 헬퍼 타입·import 오류 없음).

## 구현 단계

> 코드 작성 전 `@supabase/ssr`의 App Router 패턴(`createBrowserClient`/`createServerClient`, `cookies()` getAll/setAll)을 재확인할 것. service_role 키는 어떤 경우에도 클라이언트·저장소에 넣지 않는다.

- [ ] `npm install @supabase/supabase-js @supabase/ssr`
- [ ] `.gitignore`에 `!.env.example` 예외 추가, `.env.example`(키 이름만) 작성
- [ ] MCP `get_project_url`·`get_publishable_keys`로 URL·publishable 키 조회 → `.env.local`에 기입(비커밋)
- [ ] `lib/supabase/client.ts` 작성(`createBrowserClient` 래퍼 + env 검증)
- [ ] `lib/supabase/server.ts` 작성(async `createServerClient` + `cookies()` getAll/setAll, 서버 컴포넌트 setAll try/catch)
- [ ] `supabase/migrations/0001_init.sql` 작성(테이블·인덱스·RLS·View)
- [ ] MCP `apply_migration`으로 적용 후 `list_tables`/`list_migrations`로 생성 확인
- [ ] MCP `get_advisors(security)`로 RLS 누락 등 경고 점검
- [ ] `docs/DATA_MODEL.md` 상태/정원 전략 확정 갱신
- [ ] `npx tsc --noEmit`·`npm run lint`·`npm run build` 실행 및 통과 확인

## 테스트 체크리스트 (SQL 기반 검증)

> 본 작업은 UI 변화가 없으므로 Playwright E2E 대신 **SQL 레벨에서 RLS·CHECK를 검증**한다. MCP `execute_sql`로 수행하며, 검증 후 테스트 데이터는 정리한다.
>
> **MCP 검증의 한계(중요)**: MCP `execute_sql`은 권한 있는 역할로 실행되어 `auth.uid()`가 null이고 RLS를 우회한다. 따라서 **사용자 A/B 간 실제 격리(SELECT/INSERT 차단)는 MCP만으로 충실히 재현하기 어렵다**. 본 작업에선 ① RLS 활성화·정책 존재, ② CHECK 제약(인증 무관), ③ View 정의/필터를 검증하고, **실제 사용자 격리 동작 검증은 진짜 인증 세션이 생기는 Task 008로 이관**한다(또는 `set role authenticated; set request.jwt.claims ...`로 JWT를 모사해 보조 검증).

- [ ] **RLS 활성화 확인**: `focus_sessions`에 `rowsecurity = true`이고 정책 4종(select/insert/update/delete)이 존재하는지 `pg_policies`/`list_tables`로 확인.
- [ ] **CHECK 제약(duration)**: `duration_minutes = 0` / `181` INSERT가 거부되고, `1`/`180`은 허용되는지 확인(인증 무관, MCP로 검증 가능).
- [ ] **CHECK 제약(enum 집합)**: `plant_type`/`status`에 목록 밖 값 INSERT가 거부되는지 확인.
- [ ] **정원 View 정의**: `garden_plants`가 `status='completed'` 행만 투영하고 `security_invoker = true`로 생성됐는지 확인(`pg_views`/뷰 옵션 조회).
- [ ] **(Task 008 이관) 사용자 격리**: 인증 세션 기준 A가 B의 행을 못 보고 타인 명의 INSERT가 거부되는지 — 실제 auth 세션 확보 후 검증.
- [ ] **클라이언트 헬퍼 연결**: 서버 컴포넌트에서 `createClient()`로 `garden_plants`를 빈 결과라도 에러 없이 SELECT할 수 있는지(자격 증명·쿠키 처리 정상) 확인.
