# Task 012: 핵심 기능 통합 테스트

- **Phase**: 3 (핵심 기능 구현)
- **상태**: 완료
- **우선순위**: 높음
- **유형**: 통합 테스트 / 검증

## 개요 (고수준 명세서)

Task 008(인증)·009(타이머 신뢰성)·010(식물 성장)·011(세션 저장)에서 각자 독립적으로 구현·검증한 기능들을, **하나의 끊김 없는 사용자 여정으로 묶어 통합 검증**한다. 개별 작업은 자신의 단위 범위만 확인했으므로(예: Task 011은 "저장→조회"만, Task 009는 "백그라운드 보정"만), 본 작업은 **여러 기능이 동시에 맞물리는 경계**에서 회귀나 상호작용 버그가 없는지 확인하는 것이 목적이다.

핵심 통합 경계(개별 작업이 단독으로 검증하지 않은 지점):

- **전체 여정 연속성**: 랜딩 → 회원가입 → 자동 로그인 → proxy 리디렉션(`/timer`) → 타이머 시작 → 식물 성장 → 완료 → 세션 저장 → 정원 반영을 **한 세션에서 끊김 없이** 통과하는지. 각 단계의 상태 전이(인증 쿠키, 타이머 상태 머신, 저장 가드, 라우터 캐시 무효화)가 다음 단계로 올바르게 인계되는지.
- **백그라운드 보정 + 세션 저장 통합**(Task 009 ⨯ 011): `useTimer`가 `visibilitychange`/`focus`로 보정한 `elapsed`가 `completed`를 확정할 때, 저장되는 `started_at`/`completed_at`/`duration_minutes`가 보정 결과와 모순 없이 일치하는지. 백그라운드 중 완료된 세션도 정확히 1회만 저장되는지(`savedRef` 가드가 보정 경로에서도 동작).
- **에러 핸들링 / 엣지 케이스**: 세션 만료(쿠키 무효) 상태에서 저장 시도 시 `saveSession`이 `{ ok: false }`로 graceful 실패하고 토스트가 뜨는지, 네트워크 실패 시 타이머 화면이 깨지지 않는지, `app/error.tsx` 바운더리가 정원 조회 실패를 잡는지.
- **사용자 격리(RLS) 재확인**(Task 007/011): 전체 여정을 통과한 사용자 A의 정원 데이터가 사용자 B에게 노출되지 않는지, proxy 보호 라우트 게이트가 로그아웃 후에도 유지되는지를 통합 흐름의 끝에서 다시 확인.

범위와 경계:

- 본 작업은 **검증 중심**이다. 정상 동작이 확인되면 코드 변경이 없을 수 있다. 다만 통합 시나리오에서 회귀/상호작용 버그가 드러나면, 그 **최소 수정**까지 본 작업 범위에 포함한다(원인 파일은 Task 008~011이 만든 기존 파일).
- **테스트 도구**: 프로젝트에 테스트 프레임워크가 설정되어 있지 않다(`CLAUDE.md` 명시). E2E는 **Playwright MCP**(실제 브라우저 구동, `page.clock` 가상 시간으로 짧은 타이머 검증)로 수행하고, DB 상태는 **Supabase MCP**(`execute_sql`/`list_tables`)로 교차 확인한다. 검증용 계정/행은 사후 정리한다.
- **범위 밖**: 로딩/스켈레톤·에러 바운더리·a11y **정교화**는 Task 013, 성능 최적화·배포는 Task 014. 본 작업은 "현재 구현이 통합 수준에서 올바르게 동작하는가"의 확인과, 그 과정에서 발견된 **명백한 통합 결함의 수정**까지만 담당한다(UX 개선·리팩터링 금지).

## 현재 상태 (파악 결과)

- **인증(Task 008)**: `proxy.ts`가 `@supabase/ssr` 패턴으로 세션 토큰을 갱신하고 `PROTECTED=['/timer','/garden']` 미인증→`/login`, `PUBLIC_AUTH=['/','/login','/signup']` 인증→`/timer` optimistic 리디렉션. `app/(app)/layout.tsx`가 `getUser()`로 서버 측 재검증 + 헤더 이메일 표시. 회원가입/로그인은 브라우저 클라이언트 직접 호출 후 `router.push('/timer')`.
- **타이머(Task 009)**: `components/timer/use-timer.ts` — 절대 시각(`Date.now()`) 기반. `startTimeRef` 저장 후 1초 인터벌마다 `elapsed = Date.now() - startTime` 재계산, `visibilitychange`/`focus`에서 즉시 재동기화, `elapsed >= totalMs` 시 `completed` 확정. 반환값에 `startedAt`(epoch ms, Task 011에서 추가) 노출.
- **식물 성장(Task 010)**: `components/plant/growing-plant.tsx`가 `progress`를 CSS 변수로 바인딩, `getGrowthStage(progress)` 구간 분기(씨앗/새싹/꽃봉오리/만개), 포기 시 `withered` 시들기 트랜지션.
- **세션 저장(Task 011)**: `components/timer/timer-view.tsx`가 완료/포기 종결 시 `useEffect`에서 `savedRef` 가드로 `saveSession`을 1회 호출. `start` 시 `pickRandomPlantType()`로 식물 고정(진행 식물 = 저장 식물). `app/actions/session.ts`의 `saveSession`은 서버 `getUser()`로 `user_id` 확정 → `focus_sessions` INSERT → `revalidatePath('/garden')`. `lib/garden.ts`의 `getGardenData()`가 정원 페이지에 실데이터 공급(RLS 본인 행만).
- **에러 핸들링 인프라**: `app/error.tsx`(클라이언트 에러 바운더리), `app/loading.tsx`, `app/not-found.tsx` 기본 배치(Task 001). `saveSession`은 throw 대신 `{ ok, error }` 반환, `getGardenData`는 조회 실패 시 throw(→ `error.tsx`가 캐치).
- **DB(Task 007)**: `public.focus_sessions`(RLS on, 정책 4종, CHECK: duration 1~180 / status∈{completed,abandoned} / plant_type∈{tulip,sunflower,cactus}). `garden_plants` View 존재(본 경로에선 미사용).
- **테스트 인프라**: 테스트 프레임워크 없음. `.playwright-mcp/`는 gitignore 처리됨(Task 009/011에서 Playwright MCP로 E2E 수행한 선례). 별도 spec 파일·CI 없음 → 본 작업도 MCP 기반 수동/대화형 E2E로 진행.

## 설계 결정

### 검증 우선, 수정은 최소
본 작업의 1차 산출물은 **통합 시나리오 통과 증빙**(각 체크리스트 항목의 실제 동작 + DB 교차 확인)이다. 통합 검증에서 회귀/상호작용 버그가 발견되면 그때 한해 **원인을 최소 범위로 수정**하고, 어느 파일을 왜 고쳤는지 "변경 사항 요약"에 기록한다. 버그가 없으면 본 작업은 무수정 검증으로 종결한다(체크박스·증빙만 갱신). UX 다듬기·리팩터링은 하지 않는다(Task 013 범위 침범 금지).

### E2E 방식: Playwright MCP + 가상 시간 + Supabase MCP 교차 확인
- 짧은 시간 안에 완료/백그라운드 보정을 재현하기 위해 `page.clock`(가상 시간 설치 후 `fastForward`/`setSystemTime`)을 사용한다(Task 009 선례).
- UI 동작(리디렉션·식물 단계·토스트·정원 카드)은 브라우저 스냅샷/스크린샷으로 확인하고, **저장 결과의 진실 공급원은 DB**다 — `execute_sql`로 `focus_sessions` 행 수·컬럼값(`status`/`plant_type`/`started_at`/`completed_at`/`user_id`)을 직접 대조한다.
- 검증마다 **신규 계정**을 생성해 다른 테스트의 잔여 데이터 간섭을 배제하고, 종료 후 생성 계정/행을 정리한다.

### 백그라운드 ⨯ 저장 통합 시나리오의 초점
Task 009는 "백그라운드 복귀 시 보정"만, Task 011은 "포그라운드 완료 시 저장"만 각각 확인했다. 본 작업은 그 **교차점**을 본다: 탭이 백그라운드인 동안 종료 시각이 지나 복귀 즉시 `completed`로 확정될 때, (a) 저장이 정확히 1회 일어나는지, (b) 저장된 `completed_at - started_at`이 설정한 `duration_minutes`와 모순되지 않는지, (c) 정원에 보정된 만개 식물이 반영되는지를 한 흐름에서 확인한다.

### 에러/엣지 케이스 재현 방법
- **세션 만료**: 진행 중 인증 쿠키를 제거(브라우저 컨텍스트 쿠키 삭제)한 뒤 완료를 트리거 → `saveSession`이 `getUser()` 실패로 `{ ok: false }` 반환 → "세션 저장에 실패했어요" 토스트 표시 + 화면 미파손 확인.
- **네트워크 실패**: 저장 요청 경로를 네트워크 차단(또는 오프라인 컨텍스트)으로 만든 뒤 완료 → 토스트 에러 처리·화면 유지 확인.
- **정원 조회 실패**: (가능 시) 조회 에러를 유발해 `app/error.tsx` 바운더리가 동작하는지 확인. 재현이 어려우면 코드 경로(throw → error.tsx) 검토로 대체하고 한계를 기록.

## 목표 파일 구조

```
tasks/012-integration-test.md   # 본 작업 문서 (시나리오·결과 기록)
(통합 검증에서 버그 발견 시에만)
└── Task 008~011이 만든 기존 파일의 최소 수정       # 예: proxy.ts / use-timer.ts / timer-view.tsx / session.ts / garden.ts
```

> 신규 기능 파일을 만들지 않는다. 테스트 프레임워크 미설정 정책에 따라 spec 파일도 추가하지 않으며, E2E는 Playwright MCP로 대화형 수행한다. 수정 파일은 검증 결과에 따라 사후 확정한다.

## 관련 파일

| 파일 | 구분 | 통합 검증 관점에서의 역할 |
|------|------|------|
| `proxy.ts` | 검증 대상 | 회원가입 직후/로그아웃 후 보호·비보호 라우트 게이트가 여정 전반에서 일관 동작하는지 |
| `app/(app)/layout.tsx` | 검증 대상 | 서버 측 `getUser()` 재검증 + 헤더 이메일이 로그인 직후 정확히 표시되는지 |
| `components/auth/signup-form.tsx` | 검증 대상 | 신규 가입 → 자동 로그인 → `/timer` 인계의 시작점 |
| `components/timer/use-timer.ts` | 검증 대상 | 백그라운드 보정 후 `completed` 확정 + `startedAt` 노출이 저장과 정합한지 |
| `components/timer/timer-view.tsx` | 검증 대상 | 종결 시 `savedRef` 1회 저장·랜덤 식물 일치·완료/실패 토스트 — 보정 경로 포함 |
| `app/actions/session.ts` | 검증 대상 | 세션 만료/네트워크 실패 시 graceful `{ ok:false }` 반환, 정상 시 INSERT + `revalidatePath` |
| `lib/garden.ts` | 검증 대상 | 여정 종료 후 정원/기록/집계가 실데이터로 정확, 조회 실패 시 throw → `error.tsx` |
| `app/error.tsx` | 검증 대상 | 정원 조회 등 서버 에러를 캐치하는 바운더리 동작 |
| `lib/supabase/server.ts` | 재사용 | 액션·조회 공통 서버 클라이언트(무수정 예상) |

## 수락 기준 (Acceptance Criteria)

- [x] 신규 계정으로 랜딩 → 회원가입 → 자동 로그인 → `/timer` 리디렉션 → 타이머 시작 → 식물 성장 → 완료 → 정원 반영까지 **끊김 없이 한 흐름**으로 통과한다. _(씨앗 7%→만개, 끊김 없이 통과)_
- [x] 완료 시점에 헤더에는 로그인 이메일이, 정원에는 방금 키운 식물(진행 중 자란 종류와 동일)이 표시된다(`revalidatePath` 반영). _(인증 헤더, 정원에 cactus 즉시 반영)_
- [x] 백그라운드 전환 후 종료 시각 경과 → 복귀 즉시 `completed` 확정되며, 그 세션이 정확히 1회 저장되고 `completed_at - started_at`이 설정 `duration_minutes`와 정합한다. _(즉시 완료·1회 저장 확인. completed_at-started_at은 duration+백그라운드 오버슈트 = 종료 넘겨 복귀한 시나리오상 예상값)_
- [x] 백그라운드에서 완료된 세션도 정원에 만개(보정된 최종 단계) 식물로 반영된다. _(완료 화면 cactus bloom, step 4 이후 정원 집계에 2건/3분 반영)_
- [x] 진행 중 세션 만료(쿠키 제거) 후 완료 트리거 시 저장이 차단되고 "세션 저장에 실패했어요" 토스트가 표시되며 화면이 깨지지 않는다. _(세션 만료 시 Server Action POST가 proxy에서 /login 리디렉션되어 `{ok:false}`가 아닌 Promise reject 발생 → 추가한 `.catch`가 토스트 처리, DB 미저장 유지)_
- [x] 네트워크 실패 상황에서 완료/포기해도 타이머 화면이 파손되지 않고 에러 토스트로 처리된다. _(setOffline(true) 완료 트리거 → completedVisible=true, 에러 토스트 표시, DB 미저장. 콘솔의 net::ERR_DISCONNECTED는 브라우저 요청 실패 로그일 뿐 unhandled rejection 아님)_
- [x] 사용자 A의 여정 완료 후, 다른 계정 B로 로그인하면 A의 정원/기록이 보이지 않는다(RLS 격리 재확인). _(B 정원 plantCount 0·EmptyGarden, A의 선인장 2개 미노출, DB B=0세션)_
- [x] 로그아웃 후 `/timer`·`/garden` 직접 접근 시 `/login`으로 리디렉션된다(보호 게이트 유지). _(둘 다 /login 리디렉션)_
- [x] 통합 검증에서 발견된 회귀/상호작용 버그가 있으면 수정되었고, 없으면 무수정으로 통과했음이 기록된다. _(에러 핸들링 결함 1건 발견 → timer-view `.catch` 추가로 수정·재검증)_
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과(수정이 있었다면 회귀 없음 재확인). _(전부 통과, 빌드 시 /garden·/timer 동적·Proxy 등록)_

## 구현 단계

> 본 작업은 검증이 주(主)다. 각 단계는 시나리오를 실행하고 **UI 동작 + DB 행을 교차 대조**해 결과를 본 문서에 기록한다. 버그가 드러난 단계에서만 원인을 최소 범위로 수정하고 회귀를 재확인한다. 검증마다 신규 계정을 쓰고, 종료 후 생성 계정/행을 정리한다.

- [x] 통합 검증 환경 준비 (개발 서버 기동, Supabase MCP로 `focus_sessions` 초기 상태 확인, 검증용 신규 계정 발급 방식 확정) _(dev 서버 localhost:3000 Ready, focus_sessions 0행·RLS on·정책 4종 확인, 신규 계정은 회원가입 UI로 timestamped 이메일 발급)_
- [x] **전체 여정 E2E**: 랜딩 → 회원가입 → 자동 로그인 → `/timer` → (가상 시간)짧은 타이머 완료 → 정원 반영까지 한 흐름 통과 + DB `completed` 1행·`plant_type` 일치 대조 _(계정 A 생성 즉시 confirmed → /timer 리디렉션, 1분 실타이머 완료, DB 1행 completed/cactus/elapsed 60.017초, 정원·기록 실데이터 반영)_
- [x] **백그라운드 ⨯ 저장 통합**: 진행 중 백그라운드 전환 → 종료 시각 경과 → 복귀 즉시 완료 → 저장 1회·시각 정합·정원 만개 반영 확인 _(2분 타이머 진행 중 Date 시계 +125초 점프 후 visibilitychange/focus 디스패치 → 카운트다운 없이 즉시 만개 완료, DB completed 1행 추가(중복 없음)·duration 2 보존·식물 만개. elapsed 140.6초 = 실경과 15.6초+점프 125초로 종료 넘겨 복귀한 오버슈트(정상). 부수: running 중 /garden 이탈은 미저장(자동 abandon 경로 없음 — use-timer 정독+재현 검증))_
- [x] **에러 핸들링**: 세션 만료(쿠키 제거) 저장 실패 토스트, 네트워크 실패 시 화면 미파손, 정원 조회 실패 시 `error.tsx` 동작 확인 _(통합 결함 발견·수정: timer-view 저장 호출에 `.catch` 부재 → 전송 계층 reject 시 unhandled rejection·토스트 없음. `.catch` 추가 후 두 경우 모두 에러 토스트 표시·화면 미파손·미저장 확인. error.tsx는 임시 throw 주입으로 "문제가 발생했어요" 바운더리 렌더 확인 후 되돌림)_
- [x] **RLS·게이트 재확인**: 계정 A 데이터가 계정 B에 미노출, 로그아웃 후 보호 라우트 접근 차단 재확인 _(로그아웃 후 /timer·/garden 모두 /login 리디렉션. 계정 B 신규 가입 → 정원 plantCount 0·EmptyGarden, A의 선인장 2개 미노출. DB: A=2세션·B=0세션)_
- [x] (버그 발견 시) 원인 파일 최소 수정 후 해당 시나리오 재실행으로 회귀 확인 _(4단계에서 timer-view `.catch` 추가 후 세션만료·네트워크 시나리오 재실행으로 토스트·미파손·미저장 회귀 확인)_
- [x] 검증용 계정/행 정리 및 `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과 확인 _(test012 계정 2개·세션 전부 삭제 → focus_sessions 0행·테스트 사용자 0, tsc/lint/build 모두 통과)_

## 테스트 체크리스트 (Playwright 기반 E2E 또는 수동 검증)

> Playwright MCP로 실제 브라우저를 구동하고 `page.clock` 가상 시간으로 짧은 타이머를 완료/보정시킨다. 저장 결과는 정원 화면(UI)과 함께 Supabase MCP `execute_sql`의 `focus_sessions` 행 수·컬럼값으로 교차 확인한다. 각 시나리오는 신규 계정으로 격리하고 사후 정리한다.

- [x] **신규 가입자 첫 집중 완료 전체 여정**: 랜딩 → 회원가입 → 자동 로그인 → `/timer` 리디렉션 → 타이머 시작 → 식물 성장(씨앗→만개) → 완료 → "정원에 심기 완료!" 토스트 → "정원으로" 이동 시 식물 반영까지 끊김 없이 통과하는지 확인. _(랜딩 CTA→회원가입(test012-a)→/timer→1분 선인장 씨앗7%→만개→완료→정원 cactus 카드/집계 1·1분/기록 완료 항목 전부 통과)_
- [x] **백그라운드 복귀 보정 + 세션 저장 통합**: 진행 중 백그라운드 전환 → 종료 시각 경과 → 복귀 즉시 완료 확정 → `focus_sessions`에 `completed` 정확히 1행 저장 → 정원에 보정된 만개 식물 반영 확인. _(Date +125초 점프 + visibilitychange → 즉시 완료, completed 1행(7735af8e) 추가·중복 없음, 만개 반영. 종료 넘겨 복귀라 elapsed=duration+오버슈트(140.6초))_
- [x] **세션 만료 시 저장 실패 처리**: 진행 중 인증 쿠키 제거 후 완료 트리거 → "세션 저장에 실패했어요" 토스트 + 화면 미파손 + 미저장 확인. _(쿠키 제거 후 완료 → 토스트 표시(DOM 폴링으로 포착), URL /timer 유지, DB 2행 불변. `.catch` 추가로 처리)_
- [x] **네트워크 실패 처리**: 저장 경로 차단 상태에서 완료 → 타이머 화면 유지 + 에러 토스트로 graceful 처리 확인. _(setOffline(true) → completedVisible=true, 토스트 표시, DB 미저장)_
- [x] **정원 조회 실패 바운더리**: 정원 조회 에러 유발 시 `app/error.tsx` 바운더리 동작 확인. _(getGardenData에 임시 throw 주입 → /garden에서 "문제가 발생했어요"·"다시 시도" 바운더리 렌더 확인 → 즉시 되돌림, /garden 정상 복구)_
- [x] **RLS 사용자 격리 재확인**: 계정 A 여정 완료 후 계정 B로 로그인 → A의 정원/기록/집계가 B에게 보이지 않는지 확인(본인 행만 조회). _(B 정원 0건·EmptyGarden, A 선인장 미노출, DB A=2/B=0)_
- [x] **보호 라우트 게이트 유지**: 로그아웃 후 `/timer`·`/garden` 직접 접근 → `/login` 리디렉션 재확인. _(A 로그아웃 후 /timer→/login, /garden→/login)_

## 변경 사항 요약

Task 008~011에서 개별 구현·검증한 인증·타이머·식물 성장·세션 저장 기능을 하나의 사용자 여정으로 묶어 **통합 검증**했다. Playwright MCP로 실제 브라우저를 구동하고 Supabase MCP로 DB 행을 교차 대조하는 방식으로, 신규 계정마다 격리해 검증 후 정리했다. 검증 과정에서 **에러 핸들링 결함 1건을 발견해 최소 수정**했고, 나머지는 무수정으로 통과했다.

### 발견·수정한 결함
- **세션 종결 저장의 전송 계층 실패 미처리**: `components/timer/timer-view.tsx`의 `saveSession(...).then(...)` 체인에 `.catch()`가 없어, 세션 만료(Server Action POST가 proxy에서 `/login`으로 리디렉션되어 받는 "unexpected response")나 네트워크 단절처럼 `saveSession`의 `{ ok:false }` 반환에 도달하기 전 Promise가 reject되는 경우 **unhandled rejection으로 콘솔 에러만 남고 사용자 피드백이 없었다**. → `.catch`를 추가해 전송 계층 실패도 "세션 저장에 실패했어요" 토스트로 처리하도록 수정(정교한 재시도/메시징은 Task 013 범위로 분리). 수정 후 세션 만료·네트워크 실패 시나리오를 재실행해 토스트 표시·화면 미파손·DB 미저장·unhandled rejection 해소를 회귀 확인했다.

### 수정 파일
- `components/timer/timer-view.tsx`: 저장 효과의 `saveSession(...).then(...)`에 `.catch()` 추가(전송 계층 reject 시 에러 토스트, unhandled rejection 방지). 그 외 로직 무수정.

### 검증 (무수정 통과 항목 포함)
- **전체 여정**: 랜딩 → 회원가입(즉시 confirmed·자동 로그인) → `/timer` 리디렉션 → 1분 실타이머(선인장 씨앗→만개) → 완료 → DB `completed` 1행(plant_type 일치·elapsed 60.0초) → 정원 즉시 반영(집계·격자·기록)까지 끊김 없이 통과.
- **백그라운드 ⨯ 저장 통합**: 2분 타이머 진행 중 `Date` 시계 +125초 점프 + `visibilitychange`/`focus` → 카운트다운 없이 즉시 만개 완료, `completed` 1행만 저장(중복 없음). 종료를 넘겨 복귀한 시나리오 특성상 elapsed=duration+오버슈트. 부수로 "running 중 페이지 이탈 = 미저장"(자동 abandon 경로 없음) 확인.
- **에러 핸들링**: 세션 만료·네트워크 실패 모두 미저장+화면 미파손+에러 토스트, 정원 조회 실패 시 `app/error.tsx` 바운더리 렌더(임시 throw 주입→되돌림).
- **RLS·게이트**: 로그아웃 후 `/timer`·`/garden` → `/login` 리디렉션, 계정 B에 계정 A 데이터 미노출(B 정원 0건·EmptyGarden, DB A=2/B=0).
- `npx tsc --noEmit`·`npm run lint`·`npm run build` 모두 통과(`/garden`·`/timer` 동적, Proxy 등록). 검증용 계정·세션은 전부 삭제해 DB를 테스트 전 상태로 복구했다.

### 비고
- **백그라운드 종료 시각 초과 시 `completed_at - started_at`은 `duration_minutes`보다 길다**(복귀가 종료보다 늦은 만큼의 오버슈트). 이는 절대 시각 기반 보정의 정상 동작이며 버그가 아니다.
- 검증 중 자동화 계층에서 기인한 것으로 보이는 stray abandoned 행 1건을 발견했으나, `use-timer.ts`에 자동 abandon 경로가 없고 "running 중 이탈" 재현 시 미저장이 확인되어 **제품 코드 결함이 아님**을 확정하고 제거했다.
- Turbopack의 lockfile workspace-root 경고는 본 작업과 무관(성능/배포 최적화는 Task 014).
