import type { SectorPerformance } from "@/lib/market/sectors";

export type SectorRead = {
  sector: string;
  realtimeChange: number;
  direction: "up" | "down";
  summary: string;
  confidence: "high" | "moderate" | "low";
  fetchedAt: string;
};

export function generateSectorRead(sector: SectorPerformance): SectorRead {
  const direction = sector.realtimeChange >= 0 ? "up" : "down";
  const absMove = Math.abs(sector.realtimeChange);
  const confidence = absMove >= 3 ? "high" : "moderate";

  return {
    sector: sector.sector,
    realtimeChange: sector.realtimeChange,
    direction,
    summary: getSectorSummary(sector.sector, direction, confidence),
    confidence,
    fetchedAt: new Date().toISOString(),
  };
}

function getSectorSummary(
  sector: string,
  direction: SectorRead["direction"],
  confidence: SectorRead["confidence"]
) {
  if (direction === "up" && confidence === "high") {
    return `${sector} is seeing significant session strength, with broad sector movement above 3%.`;
  }

  if (direction === "up") {
    return `${sector} is showing moderate session gains, with sector-wide movement above 1.5%.`;
  }

  if (confidence === "high") {
    return `${sector} is seeing significant session pressure, with broad sector movement below -3%.`;
  }

  return `${sector} is showing moderate session weakness, with sector-wide movement below -1.5%.`;
}
