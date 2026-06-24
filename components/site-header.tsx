"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Sprout, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 헤더 내비게이션 컴포넌트.
// variant로 비로그인(public)/로그인(private) 영역의 내비를 분기한다.
// 실제 세션 기반 분기·이메일 표시·로그아웃 동작은 Task 008에서 연결한다(현재는 placeholder).
type SiteHeaderVariant = "public" | "private";

type NavItem = { href: string; label: string };

const NAV_ITEMS: Record<SiteHeaderVariant, NavItem[]> = {
  public: [
    { href: "/login", label: "로그인" },
    { href: "/signup", label: "회원가입" },
  ],
  private: [
    { href: "/timer", label: "타이머" },
    { href: "/garden", label: "정원" },
  ],
};

function NavLink({ href, label }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-sm transition-colors hover:text-foreground",
        active ? "font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export function SiteHeader({ variant }: { variant: SiteHeaderVariant }) {
  const items = NAV_ITEMS[variant];
  const homeHref = variant === "private" ? "/timer" : "/";

  return (
    <header className="border-b">
      <Container className="flex items-center justify-between py-4">
        <Link
          href={homeHref}
          className="flex items-center gap-1.5 font-heading text-lg font-semibold"
        >
          <Sprout className="size-5 text-primary" aria-hidden />
          뽀모도로 정원
        </Link>

        {/* 데스크톱 내비 */}
        <nav className="hidden items-center gap-4 sm:flex">
          {items.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          {variant === "private" && (
            // 사용자 이메일/로그아웃 placeholder — Task 008에서 실제 세션 연결
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="사용자 메뉴">
                  <User />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-muted-foreground">
                  user@example.com
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <LogOut />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* 모바일 내비 — 드롭다운으로 접힘 */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="메뉴 열기">
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {items.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              {variant === "private" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-muted-foreground">
                    user@example.com
                  </DropdownMenuLabel>
                  <DropdownMenuItem disabled>
                    <LogOut />
                    로그아웃
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Container>
    </header>
  );
}
