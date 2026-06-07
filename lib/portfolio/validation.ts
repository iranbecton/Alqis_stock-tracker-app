import { validateTicker } from "@/lib/security/validation";
import type { PortfolioHoldingInput } from "@/lib/portfolio/types";

const MAX_NOTES_LENGTH = 280;

export function validatePortfolioHoldingBody(
  body: Record<string, unknown>,
  options: { partial?: boolean; allowTicker?: boolean } = {}
):
  | { ok: true; value: Partial<PortfolioHoldingInput> }
  | { ok: false; error: string } {
  const update: Partial<PortfolioHoldingInput> = {};
  const allowedFields = new Set([
    ...(options.partial ? [] : ["ticker"]),
    "shares",
    "avg_cost",
    "notes",
  ]);
  const unsupportedField = Object.keys(body).find((key) => !allowedFields.has(key));

  if (unsupportedField) {
    return { ok: false, error: "Unsupported portfolio field." };
  }

  if ("ticker" in body && options.partial && options.allowTicker !== true) {
    return { ok: false, error: "Ticker cannot be changed for this holding." };
  }

  if (!options.partial || "ticker" in body) {
    const ticker = validateTicker(body.ticker);

    if (!ticker.ok) {
      return { ok: false, error: "Ticker must be a valid symbol." };
    }

    update.ticker = ticker.ticker;
  }

  if (!options.partial || "shares" in body) {
    const shares = numberFromBody(body.shares);

    if (!shares || shares <= 0) {
      return { ok: false, error: "Shares must be greater than 0." };
    }

    update.shares = shares;
  }

  if (!options.partial || "avg_cost" in body) {
    const avgCost = numberFromBody(body.avg_cost);

    if (!avgCost || avgCost <= 0) {
      return { ok: false, error: "Average cost must be greater than 0." };
    }

    update.avg_cost = avgCost;
  }

  if ("notes" in body) {
    if (body.notes === null || typeof body.notes === "undefined") {
      update.notes = null;
    } else if (typeof body.notes === "string") {
      const notes = body.notes.trim();

      if (notes.length > MAX_NOTES_LENGTH) {
        return { ok: false, error: "Notes must be 280 characters or fewer." };
      }

      update.notes = notes || null;
    } else {
      return { ok: false, error: "Notes must be text." };
    }
  } else if (!options.partial) {
    update.notes = null;
  }

  if (options.partial && Object.keys(update).length === 0) {
    return { ok: false, error: "No supported fields were provided." };
  }

  return { ok: true, value: update };
}

function numberFromBody(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : null;
}
