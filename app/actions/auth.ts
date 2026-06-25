"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// 로그아웃 Server Action.
// SiteHeader(클라이언트 컴포넌트)에서 <form action={signOutAction}>으로 연동한다.
// signOut()이 세션 쿠키를 제거한 뒤 /login으로 리디렉션한다.
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
