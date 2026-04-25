import type {
  AIWordingInput,
  AIWordingOutput,
  AIWordingProvider,
} from "@/lib/ai/providers/types";

const MAX_WHY_IT_MATTERS = 3;
const MAX_COUNTEREVIDENCE = 3;

export const structuredWordingProvider: AIWordingProvider = {
  name: "structured",
  async generateWording(input) {
    return createStructuredWording(input);
  },
};

function createStructuredWording(input: AIWordingInput): AIWordingOutput {
  const ticker = input.ticker;
  const company = input.companyName ?? ticker;
  const movePhrase = createMovePhrase(input);
  const primaryDriver = input.topDrivers[0];
  const driverList = formatDriverList(input.topDrivers);
  const chartPhrase = createChartPhrase(input);
  const evidencePhrase = createEvidencePhrase(input);

  return {
    headline: primaryDriver
      ? `${ticker} ${movePhrase} as ${formatDriverForSentence(primaryDriver.label)} shaped the read.`
      : `${ticker} ${movePhrase} without one clear driver.`,
    summary: primaryDriver
      ? `${ticker} ${movePhrase} as ${driverList} shaped the current read. ${chartPhrase}`
      : `${ticker} ${movePhrase}, but current evidence is not strong enough to identify one clear driver.`,
    plainEnglishRead: primaryDriver
      ? `${company} ${movePhrase}. ALQIS is weighting ${driverList} against the available quote, chart, and news evidence. ${evidencePhrase}`
      : `${company} ${movePhrase}. ALQIS has live structured inputs, but the evidence is too thin or mixed to name a single primary driver with confidence.`,
    whyItMatters: createWhyItMatters(input),
    counterevidence: createCounterevidence(input),
    trustNote: createTrustNote(input),
  };
}

function createMovePhrase(input: AIWordingInput) {
  if (input.direction === "higher") {
    return `moved higher by ${formatPercent(input.movePct)}`;
  }

  if (input.direction === "lower") {
    return `moved lower by ${formatPercent(input.movePct)}`;
  }

  return `was little changed at ${formatPercent(input.movePct)}`;
}

function formatDriverList(drivers: AIWordingInput["topDrivers"]) {
  const labels = drivers
    .slice(0, 2)
    .map((driver) => formatDriverForSentence(driver.label));

  if (labels.length === 0) {
    return "mixed market evidence";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  return `${labels[0]} and ${labels[1]}`;
}

function formatDriverForSentence(label: string) {
  const normalized = label.replace(/\bAI\b/i, "AI");

  if (normalized.startsWith("AI ")) {
    return normalized;
  }

  return normalized.replace(/^\w/, (value) => value.toLowerCase());
}

function createChartPhrase(input: AIWordingInput) {
  if (input.chartStatus === "ok" && typeof input.chartMovePct === "number") {
    return `The selected chart window shows ${formatPercent(input.chartMovePct)}.`;
  }

  if (input.chartStatus === "fallback") {
    return "Chart provider data is unavailable for this range, so chart confirmation is not used.";
  }

  return "Chart confirmation is unavailable for this read.";
}

function createEvidencePhrase(input: AIWordingInput) {
  const directDrivers = input.topDrivers.filter(
    (driver) => driver.evidenceType === "direct"
  ).length;
  const alignedDrivers = input.topDrivers.filter(
    (driver) => driver.moveAlignment === "supports_move"
  ).length;

  if (directDrivers > 0 && alignedDrivers > 0) {
    return "The strongest factors are aligned with the structured move read.";
  }

  if (alignedDrivers > 0) {
    return "Some factors align with the move, but the evidence remains partly contextual.";
  }

  return "The read remains cautious because the evidence is mixed or mostly contextual.";
}

function createWhyItMatters(input: AIWordingInput) {
  const items = input.topDrivers.slice(0, MAX_WHY_IT_MATTERS).map((driver) => {
    const evidenceType = formatEvidenceType(driver.evidenceType);
    const alignment = formatMoveAlignment(driver.moveAlignment);

    return `${driver.label} is part of the read with ${driver.evidenceCount} evidence item${driver.evidenceCount === 1 ? "" : "s"}; ${evidenceType} evidence ${alignment}.`;
  });

  if (input.chartStatus !== "ok") {
    items.push("Chart provider data is not active for this range, so ALQIS keeps confidence more conservative.");
  }

  return items.length
    ? items.slice(0, MAX_WHY_IT_MATTERS)
    : ["ALQIS is preserving a cautious read because the current evidence is limited."];
}

function createCounterevidence(input: AIWordingInput) {
  const items = input.counterevidence
    .slice(0, MAX_COUNTEREVIDENCE)
    .map((item) => `${item.label}: ${sanitizeCounterText(item.description)}`);

  if (input.chartStatus !== "ok") {
    items.unshift("Chart provider access: chart confirmation is unavailable for this range.");
  }

  return items.length
    ? items.slice(0, MAX_COUNTEREVIDENCE)
    : ["Evidence can change quickly as new company, sector, or chart data arrives."];
}

function createTrustNote(input: AIWordingInput) {
  const chartNote =
    input.chartStatus === "ok"
      ? "live chart data"
      : "quote and news data while chart confirmation is limited";

  return `This wording is generated locally from ALQIS structured scoring using ${chartNote}; confidence and source counts are unchanged.`;
}

function sanitizeCounterText(value: string) {
  return value
    .replace(/\bbuy\b/gi, "act")
    .replace(/\bsell\b/gi, "act")
    .replace(/\bhold\b/gi, "wait")
    .replace(/\btarget price\b/gi, "valuation marker")
    .replace(/\bprice target\b/gi, "valuation marker")
    .trim();
}

function formatEvidenceType(value: AIWordingInput["topDrivers"][number]["evidenceType"]) {
  if (value === "direct") return "direct";
  if (value === "sector") return "sector";
  if (value === "macro") return "macro";
  return "contextual";
}

function formatMoveAlignment(value: AIWordingInput["topDrivers"][number]["moveAlignment"]) {
  if (value === "supports_move") return "supports the move";
  if (value === "contradicts_move") return "is a counterweight";
  return "adds context";
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
