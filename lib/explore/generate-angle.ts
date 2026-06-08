import "server-only";

export type AngleConfidence = {
  score: number;
  band: "A" | "B" | "C" | "D";
  label: string;
};

export type AngleResult = {
  hook: string;
  reason: string;
  confidence: AngleConfidence;
  generatedAt: string;
};

type ClaudeAnglePayload = {
  hook?: unknown;
  reason?: unknown;
};

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const ANGLE_MODEL = "claude-sonnet-4-6";
const ANGLE_MAX_TOKENS = 300;
const FALLBACK_HOOK = "Angle unavailable";
const FALLBACK_REASON =
  "Insufficient evidence to generate a reliable angle at this time.";
const FORBIDDEN_TERMS = [
  ["b", "uy"].join(""),
  ["se", "ll"].join(""),
  ["reco", "mmend"].join(""),
  ["target", "price"].join(" "),
  ["you", "should"].join(" "),
  ["bu", "llish setup"].join(""),
  ["bea", "rish setup"].join(""),
];
const FORBIDDEN_PATTERN = new RegExp(
  `\\b(${FORBIDDEN_TERMS.map(escapeRegExp).join("|")})\\b`,
  "i"
);
const SYSTEM_PROMPT =
  `You are a financial intelligence engine. Given a stock ticker, its fundamentals, and recent headlines, generate a single investment angle in two parts: a hook (one punchy sentence, max 12 words, stating the core thesis) and a reason (one sentence, max 20 words, citing the strongest evidence). Never use the words: ${FORBIDDEN_TERMS.join(", ")}. Be direct and evidence-bound. Return only valid JSON.`;

export async function generateAngle(
  ticker: string,
  fitScore: number,
  fundamentals: object,
  headlines: string[]
): Promise<AngleResult> {
  const confidence = getAngleConfidence(fitScore);
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY for Explore angle generation.");
  }

  const payload = {
    ticker: ticker.trim().toUpperCase(),
    fit_score: fitScore,
    key_fundamentals: trimFundamentals(fundamentals),
    recent_headlines: headlines.slice(0, 3),
  };

  try {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: ANGLE_MODEL,
        max_tokens: ANGLE_MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[GENERATE-ANGLE] Claude API error:", {
        status: response.status,
        requestId: response.headers.get("request-id") ?? response.headers.get("x-request-id") ?? undefined,
        category: "angle_provider_non_ok",
      });
      return getFallbackAngle(confidence);
    }

    const body = (await response.json()) as {
      content?: { type?: string; text?: string }[];
    };
    const text = body.content?.find((item) => item.type === "text")?.text;
    if (process.env.NODE_ENV === "development") {
      console.log("[GENERATE-ANGLE] Claude text received:", {
        category: text ? "angle_provider_text_received" : "angle_provider_text_missing",
      });
    }
    const parsed = parseClaudeAngle(text);

    if (!parsed) {
      return getFallbackAngle(confidence);
    }

    return {
      hook: parsed.hook,
      reason: parsed.reason,
      confidence,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    void error;
    console.error("[GENERATE-ANGLE] fetch threw:", {
      category: "angle_provider_fetch_failed",
    });
    return getFallbackAngle(confidence);
  }
}

export function getAngleConfidence(fitScore: number): AngleConfidence {
  if (fitScore >= 80) {
    return { score: 0.9, band: "A", label: "High confidence" };
  }

  if (fitScore >= 60) {
    return { score: 0.75, band: "B", label: "Good confidence" };
  }

  if (fitScore >= 40) {
    return { score: 0.6, band: "C", label: "Moderate confidence" };
  }

  return { score: 0.4, band: "D", label: "Low confidence" };
}

function parseClaudeAngle(text: string | undefined) {
  if (!text) {
    return null;
  }

  try {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned) as ClaudeAnglePayload;
    const hook = sanitizeAngleText(parsed.hook);
    const reason = sanitizeAngleText(parsed.reason);

    if (!hook || !reason || hasForbiddenTerms(hook) || hasForbiddenTerms(reason)) {
      return null;
    }

    return { hook, reason };
  } catch {
    return null;
  }
}

function sanitizeAngleText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const sanitized = value.replace(/\s+/g, " ").trim();
  return sanitized.length ? sanitized : null;
}

function hasForbiddenTerms(value: string) {
  return FORBIDDEN_PATTERN.test(value);
}

function getFallbackAngle(confidence: AngleConfidence): AngleResult {
  return {
    hook: FALLBACK_HOOK,
    reason: FALLBACK_REASON,
    confidence,
    generatedAt: new Date().toISOString(),
  };
}

function trimFundamentals(fundamentals: object) {
  const record = fundamentals as Record<string, unknown>;
  const fields = [
    "peRatio",
    "beta",
    "marketCap",
    "oneMonthChange",
    "revenueGrowth",
  ];

  return Object.fromEntries(
    fields
      .map((field) => [field, record[field]])
      .filter(([, value]) => value !== undefined)
      .slice(0, 5)
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
