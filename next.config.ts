import type { NextConfig } from "next";

// 상위 디렉터리(C:\Users\M2MS)에 떠도는 package-lock.json 때문에 Next가 워크스페이스
// 루트를 잘못 추론하는 경고가 발생한다. 이 프로젝트 디렉터리를 루트로 명시해 해소한다.
// - turbopack.root: Turbopack 모듈 해석 루트
// - outputFileTracingRoot: 빌드 파일 트레이싱 루트
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
