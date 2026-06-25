"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Sprout, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";
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
// private variant에서는 세션 이메일 표시 + 로그아웃 Server Action을 연동한다.
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

// 로그아웃 메뉴 항목 — Server Action을 form action으로 연동한다.
// DropdownMenuItem을 form 안의 submit 버튼으로 렌더해 클릭 시 signOutAction을 호출한다.
function LogoutMenuItem() {
  return (
    <form action={signOutAction} className="w-full">
      <DropdownMenuItem asChild>
        <button type="submit" className="w-full">
          <LogOut />
          로그아웃
        </button>
      </DropdownMenuItem>
    </form>
  );
}

export function SiteHeader({
  variant,
  email,
}: {
  variant: SiteHeaderVariant;
  email?: string;
}) {
  const items = NAV_ITEMS[variant];
  const homeHref = variant === "private" ? "/timer" : "/";
  // 이메일이 없는 edge case 방어 — 정상 흐름에서는 layout이 항상 세션 이메일을 전달한다.
  const displayEmail = email ?? "user@example.com";

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="사용자 메뉴">
                  <User />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-muted-foreground">
                  {displayEmail}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <LogoutMenuItem />
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
                    {displayEmail}
                  </DropdownMenuLabel>
                  <LogoutMenuItem />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Container>
    </header>
  );
}
