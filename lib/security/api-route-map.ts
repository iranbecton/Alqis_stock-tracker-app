export type ApiRouteRiskCategory =
  | "public"
  | "auth-required"
  | "provider-backed"
  | "supabase-user-data"
  | "cache-backed"
  | "high-cost"
  | "compliance-sensitive";

export type ApiRouteRiskMapItem = {
  route: string;
  methods: string[];
  categories: ApiRouteRiskCategory[];
  notes: string;
};

export type ApiRouteSecurityPosture = ApiRouteRiskMapItem & {
  authRequired: boolean;
  providerBacked: boolean;
  userData: boolean;
  cacheBacked: boolean;
  highCost: boolean;
  complianceSensitive: boolean;
  hasInputValidation: boolean;
  hasRateLimit: boolean;
  hasRefreshCooldown: boolean;
  hasNormalizedErrors: boolean;
  hasObservability: boolean;
};

export const API_ROUTE_RISK_MAP: ApiRouteRiskMapItem[] = [
  {
    route: "/api/explain/why-moving",
    methods: ["POST"],
    categories: [
      "public",
      "provider-backed",
      "cache-backed",
      "high-cost",
      "compliance-sensitive",
    ],
    notes:
      "Runs structured explanation logic using quote/chart/news inputs; saves history only when a user session exists.",
  },
  {
    route: "/api/explain/portfolio",
    methods: ["POST"],
    categories: [
      "auth-required",
      "provider-backed",
      "supabase-user-data",
      "cache-backed",
      "high-cost",
      "compliance-sensitive",
    ],
    notes:
      "User-scoped portfolio intelligence route using cached quote and sector enrichment.",
  },
  {
    route: "/api/market/brief",
    methods: ["GET"],
    categories: [
      "auth-required",
      "provider-backed",
      "supabase-user-data",
      "cache-backed",
      "high-cost",
      "compliance-sensitive",
    ],
    notes: "User-scoped daily brief using watchlist or curated fallback inputs.",
  },
  {
    route: "/api/search/stocks",
    methods: ["GET"],
    categories: ["public", "provider-backed", "cache-backed"],
    notes: "Ticker discovery with Finnhub search and curated local fallback.",
  },
  {
    route: "/api/stocks/[ticker]/quote",
    methods: ["GET"],
    categories: ["public", "provider-backed", "cache-backed"],
    notes: "Finnhub quote/profile adapter route.",
  },
  {
    route: "/api/stocks/[ticker]/chart",
    methods: ["GET"],
    categories: ["public", "provider-backed", "cache-backed"],
    notes: "Twelve Data chart adapter route with demo-structure fallback labels.",
  },
  {
    route: "/api/stocks/[ticker]/news",
    methods: ["GET"],
    categories: ["public", "provider-backed", "cache-backed"],
    notes: "Finnhub company news route with ticker relevance filtering.",
  },
  {
    route: "/api/stocks/[ticker]/earnings",
    methods: ["GET"],
    categories: ["auth-required", "provider-backed", "cache-backed"],
    notes: "Authenticated Finnhub earnings-calendar read with null-shape provider fallback.",
  },
  {
    route: "/api/alerts",
    methods: ["GET", "POST"],
    categories: ["auth-required", "supabase-user-data", "compliance-sensitive"],
    notes: "User-owned alert list and creation route; v1 alerts save in pending state.",
  },
  {
    route: "/api/alerts/[id]",
    methods: ["PATCH", "DELETE"],
    categories: ["auth-required", "supabase-user-data", "compliance-sensitive"],
    notes: "User-owned alert update and removal route with ownership checks.",
  },
  {
    route: "/api/watchlist",
    methods: ["GET", "POST", "DELETE"],
    categories: ["auth-required", "supabase-user-data"],
    notes: "User-owned watchlist persistence; RLS-backed table access.",
  },
  {
    route: "/api/watchlist/intelligence",
    methods: ["GET"],
    categories: [
      "auth-required",
      "provider-backed",
      "supabase-user-data",
      "cache-backed",
      "high-cost",
      "compliance-sensitive",
    ],
    notes: "Enriches saved tickers with quote/read state for dashboard cards.",
  },
  {
    route: "/api/explanations/history",
    methods: ["GET", "DELETE"],
    categories: ["auth-required", "supabase-user-data", "compliance-sensitive"],
    notes: "User-owned saved explanation history.",
  },
  {
    route: "/api/preferences",
    methods: ["GET", "PATCH"],
    categories: ["auth-required", "supabase-user-data"],
    notes: "User-owned dashboard and reading preferences.",
  },
  {
    route: "/api/profile/investor",
    methods: ["GET", "PUT", "POST"],
    categories: ["auth-required", "supabase-user-data", "compliance-sensitive"],
    notes:
      "User-owned education and explanation profile; stores onboarding acknowledgement without financial suitability data.",
  },
  {
    route: "/api/diagnostics",
    methods: ["GET"],
    categories: ["auth-required", "provider-backed", "high-cost"],
    notes: "Internal health checks; should never expose provider secrets or raw errors.",
  },
];

export const API_ROUTE_SECURITY_POSTURE: ApiRouteSecurityPosture[] = [
  {
    ...getRiskMapItem("/api/explain/why-moving"),
    authRequired: false,
    providerBacked: true,
    userData: false,
    cacheBacked: true,
    highCost: true,
    complianceSensitive: true,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: true,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes:
      "Public/session-optional structured explanation route; saves history only when authenticated.",
  },
  {
    ...getRiskMapItem("/api/explain/portfolio"),
    authRequired: true,
    providerBacked: true,
    userData: true,
    cacheBacked: true,
    highCost: true,
    complianceSensitive: true,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: false,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes:
      "User-scoped portfolio intelligence route with cached quote/profile enrichment and normalized errors.",
  },
  {
    ...getRiskMapItem("/api/market/brief"),
    authRequired: true,
    providerBacked: true,
    userData: true,
    cacheBacked: true,
    highCost: true,
    complianceSensitive: true,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: true,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "User-scoped brief route with refresh cooldown and cache-backed quote enrichment.",
  },
  {
    ...getRiskMapItem("/api/search/stocks"),
    authRequired: false,
    providerBacked: true,
    userData: false,
    cacheBacked: true,
    highCost: false,
    complianceSensitive: false,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: true,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "Public search route with query validation, cache, refresh cooldown, and curated fallback.",
  },
  {
    ...getRiskMapItem("/api/stocks/[ticker]/quote"),
    authRequired: false,
    providerBacked: true,
    userData: false,
    cacheBacked: true,
    highCost: false,
    complianceSensitive: false,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: true,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "Public quote route with ticker validation, cache, refresh cooldown, and sanitized provider errors.",
  },
  {
    ...getRiskMapItem("/api/stocks/[ticker]/chart"),
    authRequired: false,
    providerBacked: true,
    userData: false,
    cacheBacked: true,
    highCost: false,
    complianceSensitive: false,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: true,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "Public chart route with ticker/range validation, cache, refresh cooldown, and fallback labeling.",
  },
  {
    ...getRiskMapItem("/api/stocks/[ticker]/news"),
    authRequired: false,
    providerBacked: true,
    userData: false,
    cacheBacked: true,
    highCost: false,
    complianceSensitive: false,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: true,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "Public news route with ticker validation, cache, refresh cooldown, and safe empty fallback.",
  },
  {
    ...getRiskMapItem("/api/stocks/[ticker]/earnings"),
    authRequired: true,
    providerBacked: true,
    userData: false,
    cacheBacked: true,
    highCost: false,
    complianceSensitive: false,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: false,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "Authenticated earnings read route with cache-backed Finnhub provider fallback.",
  },
  {
    ...getRiskMapItem("/api/alerts"),
    authRequired: true,
    providerBacked: false,
    userData: true,
    cacheBacked: false,
    highCost: false,
    complianceSensitive: true,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: false,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "User-owned alert list/create route with strict alert shape validation.",
  },
  {
    ...getRiskMapItem("/api/alerts/[id]"),
    authRequired: true,
    providerBacked: false,
    userData: true,
    cacheBacked: false,
    highCost: false,
    complianceSensitive: true,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: false,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "User-owned alert update/remove route with ownership checks.",
  },
  {
    ...getRiskMapItem("/api/watchlist"),
    authRequired: true,
    providerBacked: false,
    userData: true,
    cacheBacked: false,
    highCost: false,
    complianceSensitive: false,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: false,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "User-data persistence route with event-level observability; no refresh surface or provider work.",
  },
  {
    ...getRiskMapItem("/api/watchlist/intelligence"),
    authRequired: true,
    providerBacked: true,
    userData: true,
    cacheBacked: true,
    highCost: true,
    complianceSensitive: true,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: true,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "User-scoped watchlist enrichment route with refresh cooldown and partial-data observability.",
  },
  {
    ...getRiskMapItem("/api/explanations/history"),
    authRequired: true,
    providerBacked: false,
    userData: true,
    cacheBacked: false,
    highCost: false,
    complianceSensitive: true,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: false,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "User-owned explanation history route with event-level observability; no provider/cache/refresh surface.",
  },
  {
    ...getRiskMapItem("/api/preferences"),
    authRequired: true,
    providerBacked: false,
    userData: true,
    cacheBacked: false,
    highCost: false,
    complianceSensitive: false,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: false,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "User-owned preferences route with strict field allowlist validation and event-level observability.",
  },
  {
    ...getRiskMapItem("/api/profile/investor"),
    authRequired: true,
    providerBacked: false,
    userData: true,
    cacheBacked: false,
    highCost: false,
    complianceSensitive: true,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: false,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes:
      "User-owned onboarding profile route with strict enum/interest/ticker validation and safe observability.",
  },
  {
    ...getRiskMapItem("/api/diagnostics"),
    authRequired: true,
    providerBacked: true,
    userData: false,
    cacheBacked: false,
    highCost: true,
    complianceSensitive: false,
    hasInputValidation: true,
    hasRateLimit: true,
    hasRefreshCooldown: false,
    hasNormalizedErrors: true,
    hasObservability: true,
    notes: "Internal diagnostics route; auth-required, rate-limited, and observability-labeled with safe aggregate output.",
  },
];

export function getSecurityPostureSummary() {
  const totalRoutes = API_ROUTE_SECURITY_POSTURE.length;
  const count = (predicate: (item: ApiRouteSecurityPosture) => boolean) =>
    API_ROUTE_SECURITY_POSTURE.filter(predicate).length;
  const missing = (field: keyof ApiRouteSecurityPosture) =>
    API_ROUTE_SECURITY_POSTURE.filter((item) => item[field] === false).map(
      (item) => item.route
    );

  return {
    totalRoutes,
    authRequiredRoutes: count((item) => item.authRequired),
    publicRoutes: count((item) => !item.authRequired),
    providerBackedRoutes: count((item) => item.providerBacked),
    userDataRoutes: count((item) => item.userData),
    cacheBackedRoutes: count((item) => item.cacheBacked),
    highCostRoutes: count((item) => item.highCost),
    complianceSensitiveRoutes: count((item) => item.complianceSensitive),
    validationCoverage: count((item) => item.hasInputValidation),
    rateLimitCoverage: count((item) => item.hasRateLimit),
    refreshCooldownCoverage: count(
      (item) => !item.cacheBacked || item.hasRefreshCooldown
    ),
    normalizedErrorCoverage: count((item) => item.hasNormalizedErrors),
    observabilityCoverage: count((item) => item.hasObservability),
    missingValidation: missing("hasInputValidation"),
    missingRateLimit: missing("hasRateLimit"),
    missingNormalizedErrors: missing("hasNormalizedErrors"),
    missingObservability: missing("hasObservability"),
    missingRefreshCooldownOnCacheBackedRoutes: API_ROUTE_SECURITY_POSTURE.filter(
      (item) => item.cacheBacked && !item.hasRefreshCooldown
    ).map((item) => item.route),
  };
}

export function apiRouteRiskMapAvailable() {
  return API_ROUTE_RISK_MAP.length > 0;
}

export function securityPostureAvailable() {
  return API_ROUTE_SECURITY_POSTURE.length > 0;
}

function getRiskMapItem(route: string): ApiRouteRiskMapItem {
  const item = API_ROUTE_RISK_MAP.find((entry) => entry.route === route);

  if (!item) {
    return {
      route,
      methods: [],
      categories: [],
      notes: "Route is not present in the risk map.",
    };
  }

  return item;
}
