import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// 로그인/회원가입이 공유하는 폼 카드 셸.
// title/description은 헤더에, children은 폼 본문에, footer는 하단 전환 링크 영역에 배치한다.
// 화면 가운데 정렬 + 모바일 풀폭 / 데스크톱 고정 폭(max-w-sm)으로 반응형 처리.
function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10">
      <Card className="w-full max-w-sm gap-6 py-6">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {children}
          {footer ? (
            <p className="text-center text-sm text-muted-foreground">{footer}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export { AuthCard };
