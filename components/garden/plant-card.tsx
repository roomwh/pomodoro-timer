import { Card, CardContent } from "@/components/ui/card";
import { Plant } from "@/components/plant/plant";
import { PLANT_META } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import { formatMinutes } from "@/lib/time";
import type { GardenPlant } from "@/lib/types";

interface PlantCardProps {
  plant: GardenPlant;
}

export function PlantCard({ plant }: PlantCardProps) {
  const meta = PLANT_META[plant.plantType];

  return (
    <Card className="flex flex-col items-center gap-2 p-4 text-center">
      <CardContent className="flex flex-col items-center gap-2 p-0">
        <Plant plantType={plant.plantType} stage="bloom" size="sm" />
        <p className="font-medium">
          {meta.emoji} {meta.label}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(plant.plantedAt)}</p>
        <p className="text-xs text-muted-foreground">{formatMinutes(plant.durationMinutes)}</p>
      </CardContent>
    </Card>
  );
}
