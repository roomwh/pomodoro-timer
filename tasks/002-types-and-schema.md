# Task 002: 타입 정의 및 데이터 모델 설계

- **Phase**: 1 (애플리케이션 골격 구축)
- **상태**: 완료
- **우선순위**: 일반
- **유형**: 타입/데이터 모델 설계 (런타임 비즈니스 로직 아님)

## 개요 (고수준 명세서)

앱 전반에서 공유될 **도메인 타입 시스템**, **Zod 검증 스키마**, **식물/세션 상수**를 정의하고, Supabase **데이터베이스 스키마 + RLS 정책을 설계 문서로 명세**한다. 이 작업은 이후 모든 화면(Task 004~006)과 핵심 기능(Task 007~011)이 동일한 데이터 모델 위에서 동작하도록 **단일 진실 공급원(single source of truth)** 을 세우는 것이 목적이다.

범위와 경계:

- **TypeScript 타입·상수·Zod 스키마는 실제 코드로 작성**한다(`lib/`).
- **Supabase 테이블/RLS는 "설계 문서"만** 작성한다 — 실제 `CREATE TABLE`·정책 적용은 **Task 007**에서 수행한다(이번 작업에서 DB 연결·SQL 실행 없음).
- **React Hook Form 연동, 폼 UI**는 포함하지 않는다(Task 004). 이번엔 Zod 스키마와 그로부터 추론된 입력 타입만 정의한다.
- **타이머 상태 머신·성장 단계 계산 로직**은 정의하지 않는다(Task 009/010). 이번엔 단계 구간을 표현하는 **상수와 타입**만 둔다.

## 설계 결정

### 단일 진실 공급원 원칙
- 식물 종류·성장 단계 같은 리터럴 집합은 `as const` 배열로 한 곳에 선언하고, 유니온 타입은 `typeof ARR[number]`로 **파생**한다. 문자열을 코드 곳곳에 중복 기입하지 않는다.
- Zod 스키마에서 추론한 입력 타입(`z.infer`)을 폼 입력 타입의 단일 출처로 삼는다.

### 식물·성장 단계 모델
- **식물 종류(PlantType)**: `tulip`(튤립) / `sunflower`(해바라기) / `cactus`(선인장).
- **성장 단계(GrowthStage)**: `seed`(씨앗) / `sprout`(새싹) / `bud`(꽃봉오리) / `bloom`(만개) / `withered`(시들기).
- **progress 구간 매핑**(Task 010 애니메이션과 일치): 씨앗 `0~0.10` / 새싹 `0.10~0.40` / 꽃봉오리 `0.40~0.80` / 만개 `0.80~1.00`. `withered`는 **progress 구간이 아니라 포기(abandoned) 시의 특수 상태**이므로 구간 테이블에서 제외하고 별도로 표기한다.

### 세션 상태 모델
- **SessionStatus(클라이언트 상태 머신)**: `in_progress` / `completed` / `abandoned`.
- **DB 영속 상태**: 진행 중 세션은 저장하지 않으므로 `focus_sessions.status`에는 `completed` / `abandoned`만 저장한다(`in_progress`는 클라이언트 전용 상태). 이 구분을 타입 주석과 설계 문서에 명시한다.

### 정원(garden) 데이터 전략
- 완성된 식물은 본질적으로 `status='completed'`인 `focus_sessions`의 투영이다. **별도 `garden_plants` 테이블 vs `focus_sessions` 기반 View** 중 최종 선택은 **Task 007로 위임**한다.
- 이번 작업에서는 정원 카드가 필요로 하는 필드를 담은 `GardenPlant` **TS 인터페이스(뷰 모델)** 만 정의하고, 설계 문서에 두 전략의 장단점을 기록한다.

## 목표 파일 구조

```
lib/
├── types.ts          # 도메인 타입: FocusSession, GardenPlant, SessionStatus, PlantType, GrowthStage
├── constants.ts      # 식물/성장 단계/집중 시간 상수 (as const 배열 + 메타데이터)
└── schemas.ts        # Zod 스키마 (signup/login/focus settings) + z.infer 입력 타입
docs/
└── DATA_MODEL.md     # Supabase 스키마 + RLS 정책 설계 문서 (구현은 Task 007)
```

> `lib/utils.ts`(`cn()`)는 기존 유지. 신규 파일은 import alias `@/*` 기준 `@/lib/types`, `@/lib/constants`, `@/lib/schemas`로 참조한다.

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `lib/constants.ts` | 신규 | `PLANT_TYPES`, `GROWTH_STAGES`, `PLANT_META`(한글 라벨), `GROWTH_STAGE_RANGES`(progress 구간), 집중 시간 한계(`MIN/MAX/DEFAULT_DURATION_MINUTES`) |
| `lib/types.ts` | 신규 | `PlantType`·`GrowthStage`·`SessionStatus` 유니온, `FocusSession`·`GardenPlant` 인터페이스. 리터럴 유니온은 constants의 `as const`에서 파생 |
| `lib/schemas.ts` | 신규 | `signupSchema`, `loginSchema`, `focusSettingsSchema` + `SignupInput`/`LoginInput`/`FocusSettingsInput` 추론 타입 |
| `docs/DATA_MODEL.md` | 신규 | `focus_sessions` DDL 설계, 정원 전략 비교, operation별 RLS 정책 명세 |
| `package.json` | 수정 | `zod` 의존성 추가 |

## 데이터 모델 명세 (DATA_MODEL.md에 기록)

### `focus_sessions` 테이블 (설계)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, `default gen_random_uuid()` | 세션 ID |
| `user_id` | `uuid` | `not null`, `references auth.users(id) on delete cascade` | 소유자 |
| `duration_minutes` | `int` | `not null`, `check (duration_minutes between 1 and 180)` | 집중 시간(분) |
| `status` | `text` | `not null`, `check (status in ('completed','abandoned'))` | 영속 상태 |
| `plant_type` | `text` | `not null`, `check (plant_type in ('tulip','sunflower','cactus'))` | 배정된 식물 |
| `started_at` | `timestamptz` | `not null` | 시작 절대 시각 |
| `completed_at` | `timestamptz` | nullable | 완료/포기 확정 시각 |
| `created_at` | `timestamptz` | `not null`, `default now()` | 레코드 생성 시각 |

### RLS 정책 (operation별 설계)

> 원칙: 모든 행은 소유자 본인만 접근. `SELECT/UPDATE/DELETE`는 `USING`, `INSERT`는 `WITH CHECK`로 검증.

- `enable row level security`
- **SELECT**: `using (auth.uid() = user_id)` — 본인 세션만 조회
- **INSERT**: `with check (auth.uid() = user_id)` — 타 사용자 명의 삽입 차단
- **UPDATE**: `using (auth.uid() = user_id) with check (auth.uid() = user_id)`
- **DELETE**: `using (auth.uid() = user_id)`

### 정원 전략 비교 (문서에 장단점 기록, 결정은 Task 007)
- **A안 — View**: `status='completed'` 행을 뷰로 노출. 단순/중복 없음, 정원=완료 세션 1:1.
- **B안 — 별도 `garden_plants` 테이블**: 정원 전용 메타데이터 확장 여지. 동기화 비용 발생.

## Zod 스키마 명세 (schemas.ts)

- `signupSchema`: `email`(`.email()`), `password`(`.min(8)`), `confirmPassword` + `.refine`로 일치 검증(불일치 시 `confirmPassword`에 에러 매핑).
- `loginSchema`: `email`(`.email()`), `password`(`.min(1)` — 로그인은 길이 정책 강제 대신 미입력만 차단).
- `focusSettingsSchema`: `durationMinutes`(`.int().min(1).max(180)`) — `MIN/MAX_DURATION_MINUTES` 상수 사용.
- 각 스키마에서 `z.infer`로 `SignupInput` / `LoginInput` / `FocusSettingsInput` 추론·export.

## 수락 기준 (Acceptance Criteria)

- [x] `lib/types.ts`에 `FocusSession`, `GardenPlant`, `SessionStatus`, `PlantType`, `GrowthStage`가 정의되고, 리터럴 유니온은 constants의 `as const` 배열에서 파생된다.
- [x] `lib/constants.ts`에 식물 종류(튤립/해바라기/선인장)·성장 단계(씨앗/새싹/꽃봉오리/만개/시들기)·집중 시간 한계(1~180, 기본값)가 정의된다.
- [x] 성장 단계 progress 구간(씨앗 0~0.10 / 새싹 0.10~0.40 / 꽃봉오리 0.40~0.80 / 만개 0.80~1.00)이 상수로 표현되고, `withered`는 구간과 분리되어 표기된다.
- [x] `lib/schemas.ts`에 회원가입/로그인/집중 시간 Zod 스키마와 추론 입력 타입이 정의되고, 집중 시간은 1~180 정수 범위를 강제한다.
- [x] `docs/DATA_MODEL.md`에 `focus_sessions` DDL 설계, 정원 전략 비교, operation별 RLS 정책(USING/WITH CHECK)이 문서화된다(실제 SQL 실행·DB 연결 없음).
- [x] `zod`가 `package.json`에 추가된다.
- [x] `npx tsc --noEmit`(타입 체크) 및 `npm run lint` 통과.

## 구현 단계

> 타입/스키마는 런타임 동작이 없으므로 Playwright E2E 대상이 아니다. 타입 체크·린트·간단한 스키마 단위 검증으로 확인한다.

- [x] `zod` 설치 (`npm install zod`) — zod 4.4.3 설치됨 (Zod v4 idiom `z.email()` 사용)
- [x] `lib/constants.ts` 작성: `PLANT_TYPES`, `GROWTH_STAGES` `as const` 배열 + `PLANT_META`(한글 라벨/이모지 등) + `GROWTH_STAGE_RANGES` + `MIN/MAX/DEFAULT_DURATION_MINUTES`
- [x] `lib/types.ts` 작성: constants에서 파생한 유니온 타입 + `FocusSession`·`GardenPlant` 인터페이스(주석으로 DB 영속 vs 클라이언트 상태 구분 명시)
- [x] `lib/schemas.ts` 작성: `signupSchema`/`loginSchema`/`focusSettingsSchema` + `z.infer` 입력 타입 export
- [x] `docs/DATA_MODEL.md` 작성: `focus_sessions` DDL 설계, 정원 전략 A/B 비교, operation별 RLS 정책 명세
- [x] `npx tsc --noEmit` 타입 체크 통과 확인
- [x] `npm run lint` 실행 및 통과 확인

## 검증 시나리오 (수동/단위)

- [x] `npx tsc --noEmit` 통과 — 파생 유니온 타입·인터페이스에 타입 오류 없음
- [x] 임시 스크립트(`tsx`)로 `focusSettingsSchema.safeParse`: `0`/`181`/`1.5` 거부, `1`/`25`/`180` 통과
- [x] `signupSchema.safeParse`: 잘못된 이메일·8자 미만 비밀번호·비밀번호 불일치 각각 거부, 정상 입력 통과
- [x] `GROWTH_STAGE_RANGES`로 progress 0.05→씨앗, 0.25→새싹, 0.6→꽃봉오리, 0.9/1.0→만개 매핑이 의도대로 동작하는지 확인
- [x] `npm run lint` 통과

> 검증 결과: 임시 스크립트로 총 17개 단위 검증 전부 통과(17/17). 검증 후 임시 스크립트는 삭제함.

## 변경 사항 요약

- **의존성**: `zod@4.4.3` 추가. Zod v4 idiom(`z.email()`, `z.int()`)으로 작성.
- **`lib/constants.ts`(신규)**: 식물 종류(`PLANT_TYPES` + `PLANT_META` 한글/이모지)·성장 단계(`GROWTH_STAGES` + `GROWTH_STAGE_META`)·progress 구간(`GROWTH_STAGE_RANGES`)·집중 시간 한계(`MIN/MAX/DEFAULT_DURATION_MINUTES`)를 단일 진실 공급원으로 정의. `withered`는 progress 구간에서 분리.
- **`lib/types.ts`(신규)**: `PlantType`·`GrowthStage`는 constants `as const`에서 파생, `SessionStatus`(클라이언트) / `PersistedSessionStatus`(DB) 구분, `FocusSession`·`GardenPlant` 인터페이스 정의(camelCase).
- **`lib/schemas.ts`(신규)**: `signupSchema`(이메일/8자+/일치)·`loginSchema`·`focusSettingsSchema`(1~180 정수) + `SignupInput`/`LoginInput`/`FocusSettingsInput` 추론 타입 export.
- **`docs/DATA_MODEL.md`(신규)**: `focus_sessions` 컬럼/CHECK 제약·DDL 초안, operation별 RLS 정책(USING/WITH CHECK) 표·SQL, 정원 전략 A(View, 권장)/B(별도 테이블) 비교, DB↔타입 매핑표. **실제 SQL 실행은 Task 007에 위임**.
- **검증**: `tsc --noEmit`·`npm run lint` 통과, Zod/성장 단계 단위 검증 17/17 통과.
