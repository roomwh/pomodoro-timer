"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GardenStats } from "@/components/garden/garden-stats";
import { PlantCard } from "@/components/garden/plant-card";
import { SessionRow } from "@/components/garden/session-row";
import { EmptyGarden } from "@/components/garden/empty-garden";
import { getDateKey, formatDateKey } from "@/lib/date";
import type { FocusSession, GardenPlant } from "@/lib/types";

interface GardenViewProps {
  plants: GardenPlant[];
  sessions: FocusSession[];
  completedCount: number;
  totalMinutes: number;
}

/** 세션 배열을 날짜(Asia/Seoul) 기준으로 내림차순 그룹핑한다. */
function groupSessionsByDate(sessions: FocusSession[]) {
  const map = new Map<string, FocusSession[]>();
  for (const session of sessions) {
    const key = getDateKey(session.startedAt);
    const group = map.get(key) ?? [];
    group.push(session);
    map.set(key, group);
  }
  return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
}

export function GardenView({ plants, sessions, completedCount, totalMinutes }: GardenViewProps) {
  const hasPlants = plants.length > 0;
  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* 집계 영역 — 탭 공통 */}
      <GardenStats completedCount={completedCount} totalMinutes={totalMinutes} />

      {/* 정원/기록 탭 */}
      <Tabs defaultValue="garden" orientation="horizontal">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="garden" className="flex-1 sm:flex-none px-6">
            정원
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-none px-6">
            기록
          </TabsTrigger>
        </TabsList>

        {/* 정원 뷰 */}
        <TabsContent value="garden" className="mt-4">
          {hasPlants ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {plants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} />
              ))}
            </div>
          ) : (
            <EmptyGarden />
          )}
        </TabsContent>

        {/* 기록 뷰 */}
        <TabsContent value="history" className="mt-4">
          {groupedSessions.length === 0 ? (
            <EmptyGarden />
          ) : (
            <div className="flex flex-col gap-6">
              {groupedSessions.map(([dateKey, group]) => (
                <div key={dateKey}>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    {formatDateKey(dateKey)}
                  </p>
                  <div className="divide-y rounded-lg border px-4">
                    {group.map((session) => (
                      <SessionRow key={session.id} session={session} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 보조 네비게이션 */}
      <div className="mt-2">
        <Link
          href="/timer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          타이머로 돌아가기
        </Link>
      </div>
    </div>
  );
}
