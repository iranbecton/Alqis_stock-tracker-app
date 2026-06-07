// ============================================================
// lib/ai/tags.ts
// Extract and normalize tag frequency from scored causes
// Used when writing to stock_explanations.tag_frequency
// ============================================================

// Canonical tag vocabulary — from AI Brain Spec Section 5
export type EventTag =
    | 'EARNINGS_BEAT'
    | 'EARNINGS_MISS'
    | 'GUIDANCE_RAISE'
    | 'GUIDANCE_CUT'
    | 'ANALYST_UPGRADE'
    | 'ANALYST_DOWNGRADE'
    | 'PRICE_TARGET_RAISE'
    | 'PRICE_TARGET_CUT'
    | 'M_AND_A'
    | 'PRODUCT_LAUNCH'
    | 'LEGAL_RISK'
    | 'MANAGEMENT_CHANGE'
    | 'MACRO_RATE'
    | 'MACRO_INFLATION'
    | 'MACRO_JOBS'
    | 'GEOPOLITICAL'
    | 'SECTOR_ROTATION'
    | 'INDEX_MOVE'
    | 'PEER_SYMPATHY'
    | 'AI_DEMAND'
    | 'SUPPLY_CHAIN';

export type TagFrequency = Partial<Record<EventTag, number>>;

// ── extractTagFrequency ────────────────────────────────────────
// Takes the scored causes array from the explanation engine
// and returns a normalized tag_frequency object for Supabase.
//
// Input shape (from your existing cause scoring output):
//   top_causes: Array<{ tag: EventTag; score: number; evidence: string }>
//
// Output shape (stored in stock_explanations.tag_frequency):
//   { "AI_DEMAND": 0.87, "SECTOR_ROTATION": 0.73 }
//
// Only includes tags that cleared the minimum score threshold.
// Scores are the raw cause scores from the scoring engine — not
// normalized to sum to 1, because each score is independently
// meaningful (a 0.87 AI_DEMAND and a 0.73 SECTOR_ROTATION are
// both real signals, not fractions of a whole).

const MIN_TAG_SCORE = 0.4; // below this, the tag is noise

export function extractTagFrequency(
    topCauses: Array<{ tag: string; score: number; evidence?: string }>
): TagFrequency {
    const freq: TagFrequency = {};

    for (const cause of topCauses) {
        if (cause.score >= MIN_TAG_SCORE) {
            freq[cause.tag as EventTag] = parseFloat(cause.score.toFixed(3));
        }
    }

    return freq;
}

// ── getDominantTag ─────────────────────────────────────────────
// Returns the highest-scoring tag from a tag_frequency object.
// Used in Sprint 25B when computing narrative drift.

export function getDominantTag(freq: TagFrequency): EventTag | null {
    const entries = Object.entries(freq) as [EventTag, number][];
    if (entries.length === 0) return null;
    return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

// ── computeNarrativeDrift ──────────────────────────────────────
// Sprint 25B: Compare dominant tag over two time windows.
// Returns true if the story has materially shifted.
//
// Call this when building the "Story Shifted" badge logic:
//   const recent = await getTagFrequenciesForTicker(ticker, 30);  // last 30 days
//   const prior  = await getTagFrequenciesForTicker(ticker, 60, 30); // 30-60 days ago
//   const drifted = computeNarrativeDrift(recent, prior);

export function computeNarrativeDrift(
    recentFreqs: TagFrequency[],
    priorFreqs: TagFrequency[]
): {
    drifted: boolean;
    recentDominant: EventTag | null;
    priorDominant: EventTag | null;
} {
    // Aggregate scores across multiple explanations in each window
    const aggregate = (freqs: TagFrequency[]): TagFrequency => {
        const agg: TagFrequency = {};
        for (const freq of freqs) {
            for (const [tag, score] of Object.entries(freq) as [EventTag, number][]) {
                agg[tag] = (agg[tag] ?? 0) + score;
            }
        }
        return agg;
    };

    const recentAgg = aggregate(recentFreqs);
    const priorAgg = aggregate(priorFreqs);

    const recentDominant = getDominantTag(recentAgg);
    const priorDominant = getDominantTag(priorAgg);

    // Story shifted if dominant tag changed and we have enough data
    const drifted =
        recentFreqs.length >= 3 &&
        priorFreqs.length >= 3 &&
        recentDominant !== null &&
        priorDominant !== null &&
        recentDominant !== priorDominant;

    return { drifted, recentDominant, priorDominant };
}