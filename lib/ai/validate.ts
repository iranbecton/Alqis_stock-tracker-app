import type {WhyMovingResponse} from "@/lib/ai/types";

const FORBIDDEN_TERMS = [
    "buy",
    "sell",
    "bullish setup",
    "bearish setup",
    "target price",
    "i recommend",
    "you should",
];

function countWords(value: string) {
    return value.trim().split(/\s+/).filter(Boolean).length;
}

export function findForbiddenTerms(value: string) {
    const normalized = value.toLowerCase();
    return FORBIDDEN_TERMS.filter((term) => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = term.includes(" ")
            ? new RegExp(escaped, "i")
            : new RegExp(`\\b${escaped}\\b`, "i");

        return pattern.test(normalized);
    });
}

export function validateWhyMovingResponse(response: WhyMovingResponse) {
    const warnings: string[] = [];

    if (!response.ticker || !response.timeframe) {
        warnings.push("Missing ticker or timeframe.");
    }

    if (typeof response.movePct !== "number" || Number.isNaN(response.movePct)) {
        warnings.push("movePct must be a number.");
    }

    if (!response.summary) {
        warnings.push("summary is required.");
    }

    if (countWords(response.summary) > 55) {
        warnings.push("summary must be under 55 words.");
    }

    if (response.keyFactors.length < 2 || response.keyFactors.length > 4) {
        warnings.push("keyFactors must include 2 to 4 items.");
    }

    response.keyFactors.forEach((factor, index) => {
        if (!factor.label || !factor.description) {
            warnings.push(`keyFactors[${index}] must include label and description.`);
        }

        if (
            typeof factor.score !== "number" ||
            Number.isNaN(factor.score) ||
            factor.score < 0 ||
            factor.score > 1
        ) {
            warnings.push(`keyFactors[${index}].score must be a number from 0 to 1.`);
        }

        if (
            typeof factor.evidenceCount !== "number" ||
            factor.evidenceCount < 0
        ) {
            warnings.push(`keyFactors[${index}].evidenceCount must be a non-negative number.`);
        }

        if (!["direct", "sector", "macro", "contextual"].includes(factor.evidenceType)) {
            warnings.push(`keyFactors[${index}].evidenceType is invalid.`);
        }

        if (
            !["supports_move", "contradicts_move", "neutral"].includes(
                factor.moveAlignment
            )
        ) {
            warnings.push(`keyFactors[${index}].moveAlignment is invalid.`);
        }

        if (
            factor.newsRelevance &&
            ![
                "direct_company",
                "company_context",
                "sector_context",
                "macro_context",
                "low_relevance",
            ].includes(factor.newsRelevance)
        ) {
            warnings.push(`keyFactors[${index}].newsRelevance is invalid.`);
        }
    });

    response.counterEvidence.forEach((item, index) => {
        if (!item.label || !item.description) {
            warnings.push(`counterEvidence[${index}] must include label and description.`);
        }
    });

    const forbidden = findForbiddenTerms(
        [
            response.summary,
            response.dailyMoveLabel,
            response.chartMoveLabel,
            ...response.keyFactors.flatMap((factor) => [
                factor.label,
                factor.description,
                factor.evidenceType,
                factor.moveAlignment,
                factor.newsRelevance ?? "",
            ]),
            ...response.counterEvidence.flatMap((item) => [
                item.label,
                item.description,
            ]),
        ].join(" ")
    );

    if (forbidden.length) {
        warnings.push(`Forbidden terms detected: ${forbidden.join(", ")}`);
    }

    const polarity = checkDirectionality(response.summary, response.movePct);
    if (!polarity.ok) {
        warnings.push(
            `Directionality mismatch: ${polarity.reason} (offending: ${polarity.offending.join(", ")})`
        );
    }

    return {
        isValid: warnings.length === 0,
        warnings,
    }
}

const BULLISH = new Set([
    'strength', 'strong', 'broadening', 'broadened', 'demand', 'resilience',
    'optimism', 'expansion', 'beat', 'raised', 'raise', 'upgrade', 'upgraded',
    'lift', 'lifted', 'rally', 'rose', 'gain', 'gained', 'improving', 'improved',
    'tailwind', 'momentum', 'accelerating', 'surged', 'breakout', 'durability',
    'leadership',
]);

const BEARISH = new Set([
    'pressure', 'weakness', 'weak', 'concern', 'soft', 'softness', 'miss',
    'missed', 'cut', 'cuts', 'downgrade', 'downgraded', 'decline', 'declined',
    'drag', 'headwind', 'slowdown', 'slowing', 'drop', 'dropped', 'fall',
    'fell', 'contraction', 'dilution', 'overhang', 'fatigue', 'deceleration',
    'compression',
]);

const COUNTER_MARKER = /\b(while|though|offset by|despite|even as)\b/i;
const FLAT_BAND_PCT = 0.3;

type PolarityResult =
    | { ok: true }
    | { ok: false; reason: string; offending: string[] };

export function checkDirectionality(
    summary: string,
    movePct: number,
): PolarityResult {
    const direction =
        movePct >= FLAT_BAND_PCT ? 'up'
            : movePct <= -FLAT_BAND_PCT ? 'down'
                : 'flat';

    if (direction === 'flat') return {ok: true};

    const [driverClause = ''] = summary.split(COUNTER_MARKER);

    const tokens = (text: string) =>
        text.toLowerCase().match(/\b[a-z]+\b/g) ?? [];

    const driverTokens = tokens(driverClause);

    if (direction === 'up') {
        const bad = driverTokens.filter(t => BEARISH.has(t));
        if (bad.length) {
            return {
                ok: false,
                reason: 'Bearish term used as driver for an up move',
                offending: bad,
            };
        }
    } else {
        const bad = driverTokens.filter(t => BULLISH.has(t));
        if (bad.length) {
            return {
                ok: false,
                reason: 'Bullish term used as driver for a down move',
                offending: bad,
            };
        }
    }

    // Counterevidence polarity: log-only for v1 (see Out of scope below).
    return {ok: true};
}
