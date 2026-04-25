import type {
  EventTag,
  NewsRelevance,
  TaggedNewsItem,
} from "@/lib/ai/types";
import type { StockNewsItem } from "@/lib/market-data/types";

const TAG_KEYWORDS: Array<{
  tag: EventTag;
  keywords: string[];
}> = [
  {
    tag: "AI_DEMAND",
    keywords: [
      "ai",
      "autonomy",
      "autonomous",
      "data center",
      "gpu",
      "accelerator",
      "compute",
      "inference",
      "robotaxi",
      "fsd",
    ],
  },
  {
    tag: "EARNINGS",
    keywords: ["earnings", "revenue", "guidance", "margin", "profit", "eps"],
  },
  {
    tag: "ANALYST_ACTION",
    keywords: ["upgrade", "downgrade", "analyst", "initiates", "rating"],
  },
  {
    tag: "SECTOR_MOVE",
    keywords: [
      "semiconductor",
      "chip",
      "sector",
      "nasdaq",
      "peer",
      "ev",
      "electric vehicle",
      "magnificent seven",
      "tech stocks",
    ],
  },
  {
    tag: "MACRO_RATE",
    keywords: ["fed", "rate", "yield", "inflation", "treasury", "macro"],
  },
  {
    tag: "PRODUCT_NEWS",
    keywords: [
      "launch",
      "product",
      "platform",
      "partnership",
      "customer",
      "iphone",
      "ipad",
      "mac",
      "robotaxi",
      "model y",
      "cybertruck",
      "vehicle",
    ],
  },
  {
    tag: "LEGAL_RISK",
    keywords: ["lawsuit", "probe", "regulator", "antitrust", "investigation"],
  },
  {
    tag: "SUPPLY_CHAIN",
    keywords: ["supply", "supplier", "manufacturing", "inventory", "capacity"],
  },
];

const MANAGEMENT_CHANGE_PATTERNS = [
  /\bresigns?\b/,
  /\bsteps down\b/,
  /\bappointed\b/,
  /\breplaced\b/,
  /\bdeparts?\b/,
  /\bousted\b/,
  /\bnames new ceo\b/,
  /\bleadership change\b/,
  /\bboard shakeup\b/,
];

const SECTOR_TERMS = [
  "semiconductor",
  "chip",
  "ev",
  "electric vehicle",
  "automaker",
  "auto",
  "smartphone",
  "consumer electronics",
  "big tech",
  "nasdaq",
  "technology sector",
  "tech stocks",
];

const MACRO_TERMS = [
  "fed",
  "rates",
  "yield",
  "inflation",
  "treasury",
  "jobs report",
  "macro",
  "tariff",
];

type TagNewsContext = {
  ticker: string;
  companyName?: string;
};

function textForItem(item: StockNewsItem) {
  return `${item.headline} ${item.summary}`.toLowerCase();
}

function companyTerms(context: TagNewsContext) {
  const companyWords = (context.companyName ?? "")
    .replace(/\b(inc|inc\.|corp|corporation|ltd|plc|company|motors)\b/gi, "")
    .split(/\s+/)
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 3);

  return [context.ticker.toLowerCase(), ...companyWords];
}

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function classifyNewsRelevance(
  item: StockNewsItem,
  context: TagNewsContext
): NewsRelevance {
  const text = textForItem(item);
  const terms = companyTerms(context);
  const directTicker = text.includes(context.ticker.toLowerCase());
  const directCompanyTerm = terms.some((term) => text.includes(term));

  if (directTicker || directCompanyTerm) {
    return directTicker ? "direct_company" : "company_context";
  }

  if (containsAny(text, SECTOR_TERMS)) {
    return "sector_context";
  }

  if (containsAny(text, MACRO_TERMS)) {
    return "macro_context";
  }

  return "low_relevance";
}

export function tagNewsItem(
  item: StockNewsItem,
  context: TagNewsContext
): TaggedNewsItem {
  const text = textForItem(item);
  const tags = TAG_KEYWORDS.filter(({ keywords }) =>
    keywords.some((keyword) => text.includes(keyword))
  ).map(({ tag }) => tag);
  const hasManagementChange = MANAGEMENT_CHANGE_PATTERNS.some((pattern) =>
    pattern.test(text)
  );

  if (hasManagementChange) {
    tags.push("MANAGEMENT_CHANGE");
  }

  return {
    ...item,
    tags: tags.length ? [...new Set(tags)] : ["UNKNOWN"],
    relevance: classifyNewsRelevance(item, context),
  };
}

export function tagNewsItems(items: StockNewsItem[], context: TagNewsContext) {
  return items.map((item) => tagNewsItem(item, context));
}
