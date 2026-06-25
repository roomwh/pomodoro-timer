import { Badge } from "@/components/ui/badge";
import { PLANT_META } from "@/lib/constants";
import { formatTime } from "@/lib/date";
import { formatMinutes } from "@/lib/time";
import type { FocusSession } from "@/lib/types";

interface SessionRowProps {
  session: FocusSession;
}

export function SessionRow({ session }: SessionRowProps) {
  const meta = PLANT_META[session.plantType];
  const isCompleted = session.status === "completed";

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <Badge variant={isCompleted ? "default" : "secondary"}>
          {isCompleted ? "완료" : "포기"}
        </Badge>
        <span className="text-sm">
          {meta.emoji} {meta.label}
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{formatMinutes(session.durationMinutes)}</span>
        <span>{formatTime(session.startedAt)}</span>
      </div>
    </div>
  );
}
