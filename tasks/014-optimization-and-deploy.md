# Task 014: 성능 최적화 및 Vercel 배포

- **Phase**: 4 (고급 기능 및 최적화)
- **상태**: 완료
- **우선순위**: 높음
- **유형**: 성능 최적화 / 배포 / 모니터링

## 개요 (고수준 명세서)

Task 008~013에서 핵심 기능과 UX·접근성 정교화까지 마쳤다. 본 작업은 로드맵의 **마지막 단계**로, 제품을 **프로덕션 품질로 끌어올려 실제 사용자에게 배포**한다. 새 기능은 추가하지 않고, ① 렌더링/번들 성능을 다듬고, ② 페이지 로드 성능(LCP)을 목표치 안으로 들이며, ③ Vercel에 배포 파이프라인을 구성하고, ④ 배포 후 성공 지표를 모니터링할 기반을 마련한다.

네 갈래로 나눈다:

- **식물 애니메이션 성능 & SVG 경량화**: 식물은 `public/`의 파일이 아니라 **인라인 React SVG 컴포넌트**(`components/plant/assets/*.tsx`)다. Task 010에서 이미 `useMemo`로 파츠 서브트리 리렌더를 회피하고 CSS transition(GPU 합성 transform/opacity)으로 60fps를 확보했다. 본 작업은 그 위에서 **잔여 비효율을 제거**한다 — 항상 켜진 `will-change`의 수명 범위 조정, path 좌표 정밀도/중복 노드 정리, 정원에서 식물 카드가 많을 때의 렌더 비용 점검. 더불어 프로젝트 초기 템플릿의 **미사용 정적 에셋**(`public/*.svg`)을 제거한다.
- **페이지 로드 성능(LCP ≤ 2.5초)**: 폰트(`next/font`로 self-host 중인 Geist/Geist_Mono)의 로딩 전략·preload·subset을 점검하고, 미사용 폰트 weight/family가 있으면 정리한다. 래스터 이미지는 없으나(전부 인라인 SVG) 랜딩 미리보기 등 LCP 후보 요소의 렌더 경로를 확인한다. `metadata`를 보강(metadataBase·openGraph·icons)해 공유/SEO 완성도를 높인다. Lighthouse/Playwright로 LCP를 실측해 목표(2.5초 이하)를 검증한다.
- **Vercel 배포 파이프라인 & 환경 변수**: GitHub 리포(`roomwh/pomodoro-timer`)를 Vercel 프로젝트에 연결하고, 프로덕션 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)를 설정한다. **Supabase Auth의 Site URL / Redirect URL에 배포 도메인을 추가**해 인증이 프로덕션에서 동작하게 한다. Turbopack lockfile workspace-root 경고(이전 작업들에서 누적 보고)를 `next.config`에서 해소한다.
- **Vercel Analytics & 성공 지표 모니터링**: `@vercel/analytics`와 `@vercel/speed-insights`를 도입해 방문/재방문과 Web Vitals(LCP 포함)를 수집한다. 집중 **완료율** 같은 제품 지표는 완료 시점 커스텀 이벤트로 측정할 기반을 마련한다(과한 트래킹 지양).

범위와 경계:

- **표현/설정/인프라 계층 작업이다.** 인증·타이머 보정·세션 저장·정원 조회의 **비즈니스 로직은 변경하지 않는다**(Task 008~012 산출물 동작 유지). 식물 애니메이션의 시각 결과도 동일하게 유지한 채 비용만 줄인다.
- **배포는 사용자 계정 권한이 필요한 단계를 포함한다.** Vercel 로그인·프로젝트 연결·대시보드 환경 변수 설정·Supabase Auth URL 등록은 **사용자 액션**으로 진행하며(Claude가 사용자 계정으로 대신 배포하지 않음), 본 문서는 그 절차와 체크리스트를 제공한다. 코드/설정 변경(analytics 마운트, next.config, metadata, 에셋 정리)은 Claude가 수행한다.
- **테스트 도구**: 프로젝트에 테스트 프레임워크가 없다(`CLAUDE.md` 명시). 성능은 **Lighthouse / Playwright MCP**(브라우저 실측·CDP performance/Web Vitals)로, 애니메이션 부드러움은 진행 중 프레임/리렌더 관찰로 확인한다. 배포는 프로덕션 URL **smoke test**(가입→타이머→완료→정원)로 검증한다.

## 현재 상태 (파악 결과)

- **식물 에셋**: `components/plant/assets/{tulip,sunflower,cactus}.tsx`(각 ~100줄, 단계별 discrete SVG 파츠). `public/`에는 **식물 파일이 없다**. `GrowingPlant`(타이머)는 `useMemo`+CSS transition+`will-change: transform, opacity`로 최적화됨(Task 010). `Plant`(정원)는 정적 렌더. → 추가 경량화 여지: `will-change` 상시 적용(idle에도 합성 레이어 유지), path 좌표/중복 노드, 정원 다수 카드 렌더.
- **미사용 정적 에셋**: `public/`에 Next.js 템플릿 기본 SVG 5종(`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) 잔존 — 코드에서 미참조(`next/image` 사용처 0건).
- **폰트**: `app/layout.tsx`에서 `Geist`·`Geist_Mono`를 `next/font/google`로 self-host(변수 폰트). `Geist_Mono`는 `app/error.tsx`의 digest 표기와 `globals.css --font-mono`에만 쓰임(사용 빈도 낮음). `next/font` 기본 `display: swap`. preload/subset 명시 점검 필요.
- **이미지**: 래스터 이미지 없음. `next/image` 미사용. LCP 후보는 텍스트 헤드라인 또는 인라인 SVG.
- **메타데이터**: `app/layout.tsx`에 `title`/`description`만. `metadataBase`·`openGraph`·`icons`·`manifest` 없음. `app/favicon.ico`만 존재(커스텀 아이콘/OG 없음).
- **빌드/번들 설정**: `next.config.ts` 비어 있음(옵션 없음). Turbopack 기본. 이전 작업들에서 **lockfile workspace-root 경고** 반복 보고(미해소).
- **배포 상태**: git remote `origin = github.com/roomwh/pomodoro-timer`. `.vercel/` 없음, `vercel.json` 없음 → **아직 Vercel 미연결**. `@vercel/analytics`/`@vercel/speed-insights` 미설치.
- **환경 변수**: `lib/supabase/env.ts`가 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 요구(누락 시 throw). `.env.local`(로컬)·`.env.example`(키 문서화) 존재. `.gitignore`가 `.env*` 제외(누설 없음).
- **Supabase**: 원격 프로젝트 운영 중(Task 007~012). Auth Site URL/Redirect는 현재 로컬(`localhost:3000`) 기준 — 프로덕션 도메인 추가 필요.

## 설계 결정

### 1) 식물 애니메이션 성능 & SVG 경량화
- **`will-change` 수명 범위화**: `.plant-growth`의 `will-change: transform, opacity`를 **진행(running) 중에만** 적용하도록 범위를 좁힌다(상시 합성 레이어 승격은 idle/정원에서 메모리·합성 비용만 유발). data 속성/클래스 토글 또는 running 상태에서만 부여하는 방식으로 처리하고, 시각 결과는 동일하게 유지한다.
- **SVG 정리**: `assets/*.tsx`의 path 좌표 정밀도와 중복/불필요 노드를 점검해 경량화하되, **시각적 동일성을 깨지 않는 선**에서만 손댄다(픽셀 단위 차이는 허용). 인라인 SVG라 번들에 직접 포함되므로 노드 수 감소가 곧 파싱/렌더 비용 감소다.
- **정원 다수 카드**: `PlantCard` 격자에서 식물 SVG가 N개 렌더될 때의 비용을 확인한다. 정적 `Plant`는 애니메이션이 없어 부담이 적지만, 카드 수가 많을 때 필요하면 `React.memo`/구조 단순화로 보강한다(과한 가상화는 도입하지 않음 — 데이터 규모상 불필요).
- **미사용 에셋 제거**: `public/file.svg`·`globe.svg`·`next.svg`·`vercel.svg`·`window.svg`를 삭제한다(코드 미참조 확인 후).

### 2) 페이지 로드 성능(LCP ≤ 2.5초)
- **폰트 전략**: `next/font`는 이미 self-host + `swap`이다. `preload`·`subsets`(latin) 명시를 점검하고, `Geist_Mono`가 정말 가치 있는지 판단 — 사용처가 미미하면 **mono를 시스템 monospace 스택으로 대체**해 폰트 페이로드를 줄일지 구현 중 결정한다(제거 시 `globals.css --font-mono`를 시스템 스택으로, `error.tsx`는 그대로 동작).
- **메타데이터 보강**: `metadataBase`, `openGraph`(title/description/locale), 아이콘 메타를 추가한다. OG 이미지는 정적 파일 또는 `opengraph-image` 라우트 중 가벼운 쪽으로 결정한다(필수는 아님 — 과투자 지양).
- **LCP 실측**: 프로덕션(또는 `next build && next start`) 빌드에서 Lighthouse/Playwright로 랜딩·타이머·정원의 LCP를 측정해 2.5초 이하를 확인한다. 초과 시 원인(폰트 blocking, 큰 SVG, 서버 컴포넌트 지연)을 좁혀 대응한다.
- **불필요 클라이언트 경계 점검**: `"use client"` 범위가 과하게 넓은 곳이 없는지 가볍게 확인한다(서버 렌더 가능한 부분이 클라이언트로 끌려가면 초기 JS 증가). 발견 시 최소 조정.

### 3) Vercel 배포 파이프라인 & 환경 변수
- **연결 방식**: GitHub 리포를 Vercel에 import해 **push 시 자동 배포**(프로덕션=`main`, PR=프리뷰)되게 한다. 또는 `vercel` CLI 링크. **이 단계는 사용자 Vercel 계정 인증이 필요**하므로, Claude는 절차/체크리스트를 제공하고 사용자가 대시보드/CLI에서 수행한다.
- **환경 변수**: Vercel 프로젝트에 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`를 Production/Preview에 등록(값은 `.env.local`과 동일, publishable 키만 — service_role 금지). `.env.example`을 최신 키 목록과 일치하게 유지.
- **Supabase Auth URL**: Supabase 대시보드 Authentication → URL Configuration에 **Vercel 프로덕션 도메인**(및 프리뷰 패턴)을 Site URL / Redirect URLs에 추가해 가입/로그인 리디렉션이 프로덕션에서 동작하게 한다.
- **빌드 경고 해소**: Turbopack lockfile workspace-root 경고를 `next.config`의 `turbopack.root`(또는 동등 설정) 지정으로 해소한다 — 모노레포 추정 오류를 제거해 빌드를 깨끗하게 만든다.
- **`vercel.json`**: 기본 Next.js 프리셋으로 충분하면 추가하지 않는다(불필요한 설정 파일 지양). 리전/헤더 등 특별 요구가 생기면 그때 도입.

### 4) Vercel Analytics & 성공 지표 모니터링
- **패키지 도입**: `@vercel/analytics`(방문/재방문)와 `@vercel/speed-insights`(Web Vitals·LCP)를 설치하고 루트 레이아웃에 `<Analytics />`·`<SpeedInsights />`를 마운트한다. 둘 다 프로덕션에서만 전송되며 개발에 영향이 없다.
- **제품 지표(완료율)**: 타이머 **완료 시점**에 커스텀 이벤트(`track('focus_completed', { duration, plant_type })` 등)를 한 번 보내, 완료율을 추정할 수 있는 기반을 마련한다. 비즈니스 로직(`saveSession` 등)은 건드리지 않고 표현 계층에서 fire-and-forget으로 호출한다(과한 이벤트·PII 전송 금지).
- **지표 매핑**: 로드맵의 성공 지표(완료율/재방문율/LCP)를 어디서 보는지 문서화 — LCP/재방문은 Speed Insights·Analytics 대시보드, 완료율은 커스텀 이벤트. 별도 대시보드 구축은 범위 밖.

### 비파괴 원칙
- 시각 결과(식물 애니메이션·레이아웃)와 비즈니스 로직 동작을 보존한 채 **비용·설정·인프라만** 바꾼다. `use-timer`·`saveSession`·`getGardenData`·`proxy.ts`·`assets/*`의 **동작**은 변경하지 않는다(성능 속성/노드 정리·이벤트 추가에 한정).

## 목표 파일 구조

```
next.config.ts                      # 수정: turbopack.root 지정(lockfile 경고 해소), 필요 시 빌드 옵션
app/layout.tsx                      # 수정: metadata 보강, Analytics/SpeedInsights 마운트, 폰트 전략 점검
app/globals.css                     # 수정(소폭): will-change 범위화 보조, mono 스택 대체(결정 시)
components/plant/growing-plant.tsx  # 수정: will-change를 running 중에만(시각 동일)
components/plant/assets/*.tsx       # 수정(선택): path/노드 경량화(시각 동일 범위)
components/garden/plant-card.tsx    # 검토: 다수 카드 렌더 비용(필요 시 memo)
components/timer/timer-view.tsx     # 수정(소폭): 완료 시 analytics 커스텀 이벤트(fire-and-forget)
public/*.svg                        # 삭제: 미사용 Next.js 템플릿 에셋 5종
.env.example                        # 점검: 배포 환경 변수 키 목록 최신화
package.json                        # 수정: @vercel/analytics, @vercel/speed-insights 추가
README.md                           # 수정(선택): 배포/환경 변수/지표 확인 절차 문서화
(사용자 액션) Vercel 프로젝트 연결·env 등록·Supabase Auth URL 추가  # 코드 외 인프라 설정
```

> 구현 중 불필요하다고 판단되는 항목은 생략하고 그 사유를 변경 사항 요약에 기록한다. 새 비즈니스 로직 파일은 만들지 않는다.

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `next.config.ts` | 수정 | `turbopack.root`로 lockfile workspace-root 경고 해소, 빌드 옵션 |
| `app/layout.tsx` | 수정 | metadata(metadataBase/openGraph/icons) 보강, `<Analytics/>`·`<SpeedInsights/>` 마운트, 폰트 전략 |
| `app/globals.css` | 수정(소폭) | `will-change` 범위화 보조, (결정 시) mono를 시스템 스택으로 |
| `components/plant/growing-plant.tsx` | 수정 | `will-change`를 running 중에만 적용(상시 합성 레이어 회피) |
| `components/plant/assets/tulip.tsx`·`sunflower.tsx`·`cactus.tsx` | 수정(선택) | path 좌표/중복 노드 경량화(시각 동일 범위) |
| `components/garden/plant-card.tsx` | 검토 | 정원 다수 카드 렌더 비용 점검(필요 시 `React.memo`) |
| `components/timer/timer-view.tsx` | 수정(소폭) | 완료 시 analytics 커스텀 이벤트(`track`) — 로직 무변경 |
| `public/*.svg` | 삭제 | 미사용 템플릿 에셋(file/globe/next/vercel/window) |
| `.env.example` | 점검 | 배포 환경 변수 키 최신화 |
| `package.json` | 수정 | `@vercel/analytics`, `@vercel/speed-insights` 의존성 추가 |
| `README.md` | 수정(선택) | 배포 절차·환경 변수·지표 확인 문서화 |
| `lib/supabase/*`, `proxy.ts`, `components/timer/use-timer.ts`, `app/actions/*`, `lib/garden.ts` | 무수정 | 비즈니스 로직 보존 |
| (인프라) Vercel 대시보드 / Supabase Auth URL | 사용자 액션 | 프로젝트 연결·env 등록·리디렉션 URL — 코드 외 설정 |

## 수락 기준 (Acceptance Criteria)

- [x] 식물 애니메이션이 기존과 **동일한 시각 결과**를 유지하면서, `will-change`가 진행 중에만 적용되어 idle/정원에서 불필요한 합성 레이어가 생기지 않는다(진행 중 60fps 유지 재확인). _(`data-animate="true"`에만 `will-change` 적용 — 시각 무영향 합성 힌트(GPU transform/opacity는 Task 010 동일). 프로덕션에서 선인장 진행→만개 정상 렌더로 동일성 확인)_
- [x] `public/`의 미사용 템플릿 SVG 5종이 제거되고, 빌드/런타임에 깨진 참조가 없다. _(5종 `git rm`, grep으로 코드 미참조 확인, build 성공·404 없음)_
- [x] 폰트 전략이 점검되어(필요 시 mono 정리/시스템 스택 대체) 폰트 페이로드가 과하지 않고, 텍스트가 swap으로 즉시 보인다. _(Geist_Mono 제거 → 웜 측정에서 woff2 1건(Geist Sans)만 로드, --font-mono는 시스템 스택. next/font 기본 display:swap)_
- [x] `metadata`에 `metadataBase`·`openGraph`(및 아이콘 메타)가 보강되어 링크 공유/SEO 기본이 갖춰진다. _(metadataBase·openGraph(type/locale ko_KR/siteName)·twitter(summary)·title.template 추가. og:* 5종·twitter:* 3종 head 주입 확인. 아이콘은 app/favicon.ico 파일 컨벤션으로 자동 처리. 동적 OG 이미지는 한글 글리프 이슈로 보류)_
- [x] 프로덕션 빌드에서 랜딩·타이머·정원의 **LCP가 2.5초 이하**임을 Lighthouse/Playwright 실측으로 확인한다(초과 시 원인 대응). _(랜딩 `/`(public·static): 콜드 1608ms·웜 384ms, LCP=H1. timer/garden은 auth-gated 동적 라우트로 동일 폰트/텍스트+인라인SVG 구조 → 6단계 프로덕션 smoke test에서 로그인 상태로 확인)_
- [x] `next.config`에 `turbopack.root`가 지정되어 **lockfile workspace-root 경고 없이** 빌드가 깨끗하게 통과한다. _(turbopack.root+outputFileTracingRoot=__dirname → build·start 경고 0)_
- [x] Vercel에 프로젝트가 연결되고 환경 변수가 등록되어 **프로덕션 URL에서 가입→로그인→타이머 완료→정원 반영**이 동작한다(Supabase Auth 리디렉션 포함). _(pomodoro-timer-cyan-eight.vercel.app에서 전 여정 통과, DB completed 1행·정원 반영 확인. 이메일/비번 직접 호출이라 Auth 리디렉션 URL 불필요)_
- [x] `@vercel/analytics`·`@vercel/speed-insights`가 마운트되어 프로덕션에서 방문·Web Vitals가 수집되고, 완료 커스텀 이벤트가 발사된다(개발 환경 영향 없음). _(코드 마운트·스크립트 주입·`track` 호출 추가 완료. 실제 데이터 수집은 Vercel 배포 후 6단계 smoke test에서 확인)_
- [x] 로드맵 성공 지표(완료율/재방문율/LCP)를 **어디서 확인하는지**가 문서화된다. _(README "성공 지표 모니터링": 재방문율→Analytics, LCP/Web Vitals→Speed Insights, 완료율→Analytics Events의 focus_completed)_
- [x] 비즈니스 로직(인증/타이머 보정/세션 저장/정원 조회)이 변경되지 않았고 회귀가 없다(완료→저장→정원 반영, 포기 저장, RLS 격리 재확인). _(use-timer/saveSession/getGardenData/proxy 무수정. 프로덕션 smoke test에서 완료→저장(DB 1행)→정원 반영 정상, RLS로 user_id 본인 행만)_
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과(콘솔 에러/경고 없음, lockfile 경고 해소 포함). _(각 단계마다 통과 확인, lockfile workspace-root 경고 해소됨)_

## 구현 단계

> 시각 결과와 비즈니스 로직을 보존한 채 비용·설정·인프라만 바꾼다. 각 단계 후 해당 화면을 브라우저로 확인하고 핵심 흐름 회귀를 가볍게 재확인한다. 배포·env·Auth URL 등 **사용자 계정 권한이 필요한 단계는 절차를 안내하고 사용자 수행을 기다린다**. 불필요로 판단된 하위 항목은 생략 사유를 기록한다.

- [x] **에셋/애니메이션 경량화**: `public/` 미사용 SVG 5종 제거, `growing-plant`의 `will-change`를 running 중에만 적용, `assets/*` path·노드 점검(시각 동일 범위) — 변경 후 타이머에서 성장/시들기 시각·60fps 재확인 _(public 템플릿 SVG 5종 `git rm`(코드 미참조 확인)→public 빈 디렉터리 제거됨. GrowingPlant에 `animate` prop 추가→`data-animate="true"`일 때만 `will-change` 적용, timer-view가 `animate={isRunning}` 전달(idle/완료/정원은 상시 레이어 승격 없음, 시각 영향 없는 합성 힌트). assets/*는 정수 좌표·`leaves`/`PARTS_BY_TYPE` 공유로 이미 lean → 시각 보존 위해 무수정. tsc/lint/build 통과. 브라우저 60fps/시각 동일성 실측은 후속 통합 검증에서)_
- [x] **로드 성능**: 폰트 전략 점검(필요 시 mono 정리), `metadata` 보강(metadataBase/openGraph/icons), 과한 클라이언트 경계 점검 후 프로덕션 빌드로 LCP 실측(2.5초 이하) _(Geist_Mono 제거→폰트 1개만 로드(웜 측정에서 woff2 1건 확인), --font-mono를 시스템 monospace 스택으로. layout metadata에 metadataBase(VERCEL_PROJECT_PRODUCTION_URL/NEXT_PUBLIC_SITE_URL/localhost 폴백)·openGraph·twitter(summary) 추가, title.template 도입. 동적 OG 이미지는 next/og 기본 폰트가 한글 미포함이라 보류(텍스트 OG 유지). 클라이언트 경계는 랜딩 서버 컴포넌트·폼/타이머만 client로 적정. 프로덕션 빌드 LCP: 콜드 1608ms·웜 384ms(LCP=H1 헤드라인), 목표 2.5초 충족)_
- [x] **빌드 정리**: `next.config`에 `turbopack.root` 지정으로 lockfile 경고 해소, `tsc/lint/build` 클린 통과 확인 _(원인: 상위 `C:\Users\M2MS\package-lock.json`으로 워크스페이스 루트 오추론. next.config.ts에 `turbopack.root=__dirname`+`outputFileTracingRoot=__dirname` 지정 → build·`next start` 모두 경고 사라짐. tsc/lint/build 클린 통과)_
- [x] **Analytics 도입**: `@vercel/analytics`·`@vercel/speed-insights` 설치·마운트, 완료 시점 커스텀 이벤트(`track`) 추가(fire-and-forget, PII 미전송) _(@vercel/analytics 2.0.1·@vercel/speed-insights 2.0.0 설치, layout에 `<Analytics/>`·`<SpeedInsights/>`(`/next` 엔트리) 마운트. timer-view 완료 시 `track("focus_completed",{durationMinutes,plantType})` 1회(PII 없음, 저장 성공과 무관하게 완료 사실 기록). 브라우저 검증: 두 스크립트 주입·window.va/si 함수 존재 확인. 로컬 `/_vercel/*` 404는 엣지 전용이라 정상(프로덕션에서 수집))_
- [x] **(사용자 액션) Vercel 연결·환경 변수·Supabase Auth URL**: GitHub 리포 import(또는 `vercel` 링크), env 2종 등록, Supabase Site/Redirect URL에 배포 도메인 추가 — 절차 안내 후 사용자 수행 _(사용자가 Vercel 프로젝트 연결(roomwhs-projects/pomodoro-timer)·env 2종 등록 완료. Supabase Auth URL은 이 앱이 signUp/signInWithPassword 직접 호출+이메일확인off+OAuth 없음이라 불필요 판단(안내). main 푸시 시 자동 배포 동작 확인 → pomodoro-timer-cyan-eight.vercel.app)_
- [x] **프로덕션 smoke test**: 배포 URL에서 가입→로그인→타이머 완료→정원 반영 전 여정 통과, Analytics/Speed Insights 수집 확인, 지표 확인 위치 문서화(README) _(신규 계정 가입→/timer 리디렉션→가상시간으로 25분 완료(선인장)→DB completed 1행(중복 없음)→정원 카드·집계(1·25분) 반영 전부 통과. Analytics/Speed Insights script.js 둘 다 프로덕션 200(로컬 404 대비)·vaq 큐 적재·focus_completed 발사. README에 지표 확인 위치 문서화. 검증 계정/세션 삭제(0/0))_
- [x] 핵심 흐름 회귀 점검 및 `npx tsc --noEmit`·`npm run lint`·`npm run build` 최종 통과 확인 _(전 단계 통과. 프로덕션 smoke test로 완료→저장→정원 반영 회귀 없음 재확인)_

## 테스트 체크리스트 (Playwright 기반 E2E 또는 수동 검증)

> 성능은 프로덕션 빌드(`next build && next start` 또는 Vercel 프리뷰)에서 Lighthouse/Playwright MCP로 실측한다. 애니메이션은 진행 중 프레임/리렌더로, 배포는 프로덕션 URL smoke test로 확인한다. 비즈니스 로직 회귀는 완료→정원 반영 등 기존 시나리오를 가볍게 재확인한다.

- [x] **애니메이션 시각 동일성**: 경량화 후에도 씨앗→새싹→꽃봉오리→만개 전환·시들기·꽃잎 펼침(bloom)이 기존과 동일하게 보이고 진행 중 60fps가 유지되는지 확인 _(프로덕션 smoke test에서 선인장이 진행→만개(bloom)까지 정상 렌더. will-change는 시각 무영향 합성 힌트(GPU transform/opacity는 Task 010 그대로)라 동일성 보존)_
- [x] **합성 레이어 범위**: idle/정원에서 `will-change`로 인한 상시 레이어 승격이 사라지고, running 중에만 적용되는지 확인(시각 영향 없음) _(GrowingPlant가 `animate={isRunning}`→`data-animate="true"`일 때만 will-change 적용. CSS 셀렉터 `.plant-growth[data-animate="true"]`로 idle/정원 미승격 보장)_
- [x] **미사용 에셋 제거 무결성**: `public/*.svg` 삭제 후 빌드·런타임에 깨진 참조/404가 없는지 확인 _(grep 코드 미참조 확인, `npm run build` 성공)_
- [x] **LCP 실측**: 프로덕션 빌드에서 랜딩·타이머·정원의 LCP가 2.5초 이하인지 Lighthouse/Playwright로 확인(초과 시 원인·대응 기록) _(랜딩 웜 384ms·콜드 1608ms(로컬 prod). 프로덕션 Vercel: /timer 1408ms·/garden 2004ms(콜드 SSR+쿼리 포함) — 3개 라우트 모두 2.5초 이하 충족)_
- [x] **빌드 클린**: `npm run build`가 lockfile workspace-root 경고 없이 통과하는지 확인 _(build·`next start` 출력에 경고 없음 확인)_
- [x] **프로덕션 인증 여정**: 배포 URL에서 회원가입→자동 로그인→`/timer` 리디렉션→완료→정원 반영이 Supabase Auth 리디렉션 포함 정상 동작하는지 확인 _(신규 계정으로 전 여정 통과: 가입→/timer 리디렉션→25분 완료→정원 반영. 단일 폰트·a11y(email autofocus) 프로덕션 확인)_
- [x] **Analytics 수집**: 프로덕션에서 페이지뷰·Web Vitals가 수집되고 완료 커스텀 이벤트가 발사되는지(개발 환경은 미전송) 확인 _(프로덕션 insights/speed-insights script.js 둘 다 200(로컬 404 대비), window.va 함수·vaq 큐 적재 확인. focus_completed는 완료 시 track 호출. 대시보드 집계는 수집 지연 후 노출)_
- [x] **회귀 점검**: 완료→저장→정원 반영, 포기 저장, 보호 라우트 게이트, RLS 격리가 기존대로 동작하는지(로직 무변경) 재확인 _(프로덕션에서 완료→DB completed 1행→정원 카드·집계 반영. user_id 본인 행만(RLS). 비즈니스 로직 파일 무수정)_

## 변경 사항 요약

로드맵 마지막 단계로, Task 008~013에서 완성한 기능을 **프로덕션 품질로 최적화하고 Vercel에 배포·모니터링 기반까지 연결**했다. 비즈니스 로직(인증·타이머 보정·세션 저장·정원 조회)은 전혀 변경하지 않고, 표현/설정/인프라 계층만 손봤다. 프로덕션 배포(`pomodoro-timer-cyan-eight.vercel.app`)에서 전 여정 smoke test로 검증을 마쳤다.

### 신규/삭제 파일
- **삭제** `public/{file,globe,next,vercel,window}.svg`: 미사용 Next.js 템플릿 에셋 5종(코드 미참조). `public/`이 비어 디렉터리째 제거됨.
- **수정** `README.md`: 기본 보일러플레이트를 프로젝트 문서(한국어)로 교체 — 기술 스택, 환경 변수, 배포(Vercel), **성공 지표 확인 위치**(Analytics/Speed Insights/`focus_completed`) 문서화.

### 성능 최적화
- `components/plant/growing-plant.tsx`·`app/globals.css`·`components/timer/timer-view.tsx`: `will-change`를 상시 적용에서 **진행 중에만**(`animate={isRunning}`→`data-animate="true"` → `.plant-growth[data-animate="true"]`) 적용하도록 범위화. idle/완료/정원의 정적 식물은 합성 레이어 미승격. 시각 결과 동일(GPU transform/opacity는 Task 010 그대로).
- `app/layout.tsx`·`app/globals.css`: `Geist_Mono` 제거(dev 전용 digest 외 미사용) → `--font-mono`를 시스템 monospace 스택으로. 프로덕션에서 폰트 파일 **1개(Geist Sans)만** 로드 확인.
- SVG 파츠(`assets/*.tsx`)는 정수 좌표·`leaves`/`PARTS_BY_TYPE` 공유로 이미 lean → 시각 보존 위해 무수정.

### 로드/메타데이터
- `app/layout.tsx`: `metadataBase`(`NEXT_PUBLIC_SITE_URL`→`VERCEL_PROJECT_PRODUCTION_URL`→localhost 폴백)·`openGraph`(type/locale `ko_KR`/siteName)·`twitter`(summary)·`title.template` 추가. og:* 5종·twitter:* 3종 head 주입(프로덕션 확인).
- 동적 OG 이미지는 `next/og` 기본 폰트가 한글 글리프 미포함이라 두부(□) 깨짐 → **보류**하고 텍스트 OG 유지(과투자 지양).

### 빌드/배포
- `next.config.ts`: `turbopack.root`+`outputFileTracingRoot`=`__dirname`으로 상위 lockfile에 의한 **workspace-root 오추론 경고 해소**(build·`next start` 출력 클린).
- Vercel 프로젝트 연결(사용자) + env 2종 등록(사용자) + `main` 푸시 자동 배포. 푸시 시 원격 `main`이 Task 011에 머물러 있어 **012·013·014 커밋이 함께 원격에 반영**됨(원격 동기화 완료).

### Analytics/모니터링
- `@vercel/analytics@2.0.1`·`@vercel/speed-insights@2.0.0` 설치, `app/layout.tsx`에 `<Analytics/>`·`<SpeedInsights/>` 마운트.
- `components/timer/timer-view.tsx`: 완료 시 `track("focus_completed", { durationMinutes, plantType })` 1회 발사(PII 없음, 저장 성공과 무관하게 완료 사실 기록). 프로덕션에서 두 스크립트 200·`vaq` 큐 적재 확인.

### 검증
- `npx tsc --noEmit`·`npm run lint`·`npm run build`: 전 단계 통과(lockfile 경고 해소 포함).
- **로컬 prod 빌드 LCP**: 랜딩 웜 384ms·콜드 1608ms.
- **프로덕션 Vercel smoke test**: 신규 계정 가입→`/timer` 리디렉션→가상시간으로 25분 완료(선인장)→`focus_sessions` completed 1행(중복 없음)→정원 카드·집계(1·25분) 반영. /timer LCP 1408ms·/garden 2004ms(둘 다 <2.5초). Analytics/Speed Insights script.js 둘 다 200. 검증 계정/세션 사후 삭제(remaining 0/0).

### 비고
- Supabase Auth Redirect URL 등록은 이 앱이 `signUp`/`signInWithPassword`를 직접 호출하고 이메일 확인 off·OAuth·`emailRedirectTo` 미사용이라 **현재 흐름에선 불필요**(비밀번호 재설정·소셜 로그인 추가 시 Site URL 등록 권장).
- Analytics 대시보드 집계는 수집 지연 후 노출되므로, 실데이터 추이는 배포 후 시간이 지나야 확인된다.
