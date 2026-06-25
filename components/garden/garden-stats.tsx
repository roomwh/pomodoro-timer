import { Card, CardContent } from "@/components/ui/card";
import { formatMinutes } from "@/lib/time";

interface GardenStatsProps {
  completedCount: number;
  totalMinutes: number;
}

export function GardenStats({ completedCount, totalMinutes }: GardenStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-4 text-center">
          <span className="text-3xl font-bold tabular-nums">{completedCount}</span>
          <span className="mt-1 text-sm text-muted-foreground">완료한 집중</span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-4 text-center">
          <span className="text-3xl font-bold tabular-nums">
            {formatMinutes(totalMinutes)}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">총 집중 시간</span>
        </CardContent>
      </Card>
    </div>
  );
}
