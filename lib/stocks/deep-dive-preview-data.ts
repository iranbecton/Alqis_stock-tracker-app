export type DeepDivePreviewData = {
  businessModel: string;
  revenueDrivers: string[];
  customerCategories: string[];
  businessSupports: string[];
  businessChallenges: string[];
  financials: Array<{
    label: string;
    value: string;
    context: string;
  }>;
  segments: Array<{
    name: string;
    share: string;
    signal: string;
    context: string;
  }>;
  risks: Array<{
    title: string;
    severity: "Higher" | "Moderate" | "Lower";
    status: "Ongoing" | "Developing" | "Watch item";
    context: string;
    mitigation: string;
    watch: string;
  }>;
};

const semiconductorContext: DeepDivePreviewData = {
  businessModel:
    "The company makes money by supplying compute, chip, or semiconductor infrastructure into enterprise, cloud, and device end markets.",
  revenueDrivers: [
    "Data-center and AI infrastructure demand",
    "Enterprise refresh cycles",
    "Semiconductor supply-chain availability",
  ],
  customerCategories: ["Cloud platforms", "Enterprise technology customers", "Device and infrastructure partners"],
  businessSupports: [
    "Large customers continue prioritizing compute capacity.",
    "Sector participation can reinforce demand visibility.",
  ],
  businessChallenges: [
    "Expectations can reset quickly if demand commentary cools.",
    "Supply constraints, pricing, or inventory swings can affect margins.",
  ],
  financials: [
    {
      label: "Revenue context",
      value: "Compute-led",
      context: "Revenue sensitivity is tied to data-center, enterprise, and product-cycle demand.",
    },
    {
      label: "Earnings context",
      value: "Execution-sensitive",
      context: "The market tends to focus on order visibility, lead times, and margin durability.",
    },
    {
      label: "Margin context",
      value: "Mix matters",
      context: "Higher-value compute products can support margin, while supply or pricing shifts can pressure it.",
    },
    {
      label: "Valuation context",
      value: "Expectations-led",
      context: "Multiple expansion depends on whether growth evidence keeps matching the narrative.",
    },
  ],
  segments: [
    {
      name: "Data center / infrastructure",
      share: "Largest driver",
      signal: "Demand-sensitive",
      context: "Cloud and enterprise spending commentary usually carries the most read-through.",
    },
    {
      name: "Client / devices",
      share: "Secondary driver",
      signal: "Cycle-sensitive",
      context: "PC, device, or consumer cycles can add context but may not drive every daily move.",
    },
    {
      name: "Embedded / adjacent platforms",
      share: "Smaller contributor",
      signal: "Contextual",
      context: "Industrial, auto, or networking exposure can smooth or complicate the read.",
    },
  ],
  risks: [
    {
      title: "Demand visibility cools",
      severity: "Higher",
      status: "Watch item",
      context: "Current reads can weaken if customer commentary shifts from capacity expansion to budget discipline.",
      mitigation: "Broader peer confirmation can help separate one-company noise from sector demand.",
      watch: "Cloud spending commentary, order timing, and sector breadth.",
    },
    {
      title: "Margin durability is questioned",
      severity: "Moderate",
      status: "Ongoing",
      context: "Pricing, mix, or supply changes can affect how investors interpret growth quality.",
      mitigation: "A stronger product mix can offset some cost and pricing pressure.",
      watch: "Gross margin commentary and inventory language.",
    },
    {
      title: "Sector move becomes too narrow",
      severity: "Moderate",
      status: "Developing",
      context: "If peers stop confirming the move, ALQIS confidence should lean more cautious.",
      mitigation: "Healthy peer participation makes the read more durable.",
      watch: "Peer movement and sector ETF breadth.",
    },
  ],
};

const platformContext: DeepDivePreviewData = {
  businessModel:
    "The company makes money by operating large platforms that combine software, services, advertising, devices, cloud, or subscription revenue.",
  revenueDrivers: [
    "Platform engagement and monetization",
    "Enterprise or consumer spending cycles",
    "AI, cloud, and services attach rates",
  ],
  customerCategories: ["Consumers", "Enterprise customers", "Developers and advertisers"],
  businessSupports: [
    "Recurring services and platform depth can stabilize the business read.",
    "Large ecosystems can create multiple paths for revenue growth.",
  ],
  businessChallenges: [
    "Regulatory, product-cycle, or cloud spending shifts can challenge the read.",
    "Platform expectations can become demanding when growth evidence is mixed.",
  ],
  financials: [
    {
      label: "Revenue context",
      value: "Platform-led",
      context: "Revenue is usually shaped by engagement, services, enterprise demand, or device cycles.",
    },
    {
      label: "Earnings context",
      value: "Operating leverage",
      context: "Investors often track whether revenue growth converts into disciplined earnings growth.",
    },
    {
      label: "Margin context",
      value: "Mix-sensitive",
      context: "Services, software, ads, and cloud can carry different margin profiles.",
    },
    {
      label: "Cash context",
      value: "Capital return / reinvestment",
      context: "Cash generation can support investment, repurchases, and balance-sheet flexibility.",
    },
  ],
  segments: [
    {
      name: "Core platform",
      share: "Primary engine",
      signal: "Engagement-sensitive",
      context: "User, customer, or workload activity usually anchors the business read.",
    },
    {
      name: "Services / cloud",
      share: "Margin-sensitive",
      signal: "Durability check",
      context: "Recurring revenue can support confidence when hardware or ads are mixed.",
    },
    {
      name: "New initiatives",
      share: "Emerging context",
      signal: "Narrative-sensitive",
      context: "AI, devices, or product launches can affect investor expectations before hard numbers arrive.",
    },
  ],
  risks: [
    {
      title: "Growth mix becomes less clear",
      severity: "Moderate",
      status: "Ongoing",
      context: "A platform read can weaken if the strongest growth areas are offset by slower core activity.",
      mitigation: "Recurring revenue and strong engagement can keep the read balanced.",
      watch: "Services, cloud, ads, and device-cycle commentary.",
    },
    {
      title: "Regulatory or platform scrutiny increases",
      severity: "Moderate",
      status: "Watch item",
      context: "Policy headlines can affect platform companies even when the operating read is stable.",
      mitigation: "Diversified revenue streams can reduce reliance on one policy-sensitive area.",
      watch: "Legal, regulatory, and app/platform policy updates.",
    },
    {
      title: "Investment spending rises faster than revenue",
      severity: "Lower",
      status: "Developing",
      context: "Heavy AI or infrastructure spending can challenge earnings quality if payback evidence is thin.",
      mitigation: "Clear adoption or monetization data can support the spending case.",
      watch: "Capital spending, margin commentary, and adoption metrics.",
    },
  ],
};

const autoContext: DeepDivePreviewData = {
  businessModel:
    "The company makes money by producing vehicles, software-enabled features, energy products, and services tied to vehicle ownership.",
  revenueDrivers: [
    "Vehicle deliveries and pricing",
    "Gross margin and incentive levels",
    "Autonomy, software, and energy optionality",
  ],
  customerCategories: ["Vehicle customers", "Fleet and charging customers", "Energy and software users"],
  businessSupports: [
    "Delivery stabilization can support confidence in demand.",
    "Software and energy products can add context beyond vehicle volume.",
  ],
  businessChallenges: [
    "Pricing pressure can challenge margin quality.",
    "Product timing and competitive intensity can make the read less direct.",
  ],
  financials: [
    {
      label: "Revenue context",
      value: "Volume and price",
      context: "Revenue depends heavily on delivery volume, average pricing, and product mix.",
    },
    {
      label: "Earnings context",
      value: "Margin-sensitive",
      context: "Investor focus often centers on whether volume growth is coming with healthy margin quality.",
    },
    {
      label: "Cash context",
      value: "Investment-heavy",
      context: "Manufacturing, autonomy, charging, and energy investments can affect free cash context.",
    },
    {
      label: "Valuation context",
      value: "Narrative-sensitive",
      context: "Future product and autonomy expectations can influence how daily moves are interpreted.",
    },
  ],
  segments: [
    {
      name: "Automotive",
      share: "Primary driver",
      signal: "Price and volume",
      context: "Deliveries, incentives, and gross margin usually matter most to the daily read.",
    },
    {
      name: "Energy generation and storage",
      share: "Growing contributor",
      signal: "Growth context",
      context: "Energy can add business breadth but may not explain every stock move.",
    },
    {
      name: "Services / software",
      share: "Optionality layer",
      signal: "Narrative context",
      context: "Autonomy and software headlines can shape expectations before numbers confirm them.",
    },
  ],
  risks: [
    {
      title: "Pricing pressure affects margin context",
      severity: "Higher",
      status: "Ongoing",
      context: "Vehicle incentives or price reductions can challenge the quality of revenue growth.",
      mitigation: "Improved mix, cost reductions, or software contribution can offset some pressure.",
      watch: "Gross margin, incentives, and delivery mix.",
    },
    {
      title: "Product timing remains uncertain",
      severity: "Moderate",
      status: "Developing",
      context: "Future product or autonomy milestones can move expectations before evidence is complete.",
      mitigation: "Clear execution updates can make the read less speculative.",
      watch: "Launch timing, production commentary, and adoption data.",
    },
    {
      title: "EV demand narrative shifts",
      severity: "Moderate",
      status: "Watch item",
      context: "Broader EV demand and financing conditions can affect the stock beyond company-specific news.",
      mitigation: "Peer confirmation can clarify whether the move is company-specific or sector-wide.",
      watch: "EV peers, rates, and consumer demand indicators.",
    },
  ],
};

const financialContext: DeepDivePreviewData = {
  businessModel:
    "The company makes money through lending, deposits, fees, capital markets activity, and financial services tied to customer activity.",
  revenueDrivers: [
    "Net interest income and deposit trends",
    "Credit quality",
    "Capital markets and fee activity",
  ],
  customerCategories: ["Consumers", "Businesses", "Institutional clients"],
  businessSupports: [
    "Stable deposits and credit quality can support confidence in the read.",
    "Fee and markets activity can add business breadth.",
  ],
  businessChallenges: [
    "Credit stress or funding pressure can challenge the read.",
    "Rate changes can affect net interest income and valuation context.",
  ],
  financials: [
    {
      label: "Revenue context",
      value: "Rates and fees",
      context: "Revenue is shaped by loan demand, deposit costs, and activity-based fees.",
    },
    {
      label: "Earnings context",
      value: "Credit-sensitive",
      context: "Earnings quality depends on credit costs, capital levels, and operating discipline.",
    },
    {
      label: "Balance sheet context",
      value: "Capital focused",
      context: "Capital ratios and funding stability matter more than simple growth narratives.",
    },
    {
      label: "Valuation context",
      value: "Macro-sensitive",
      context: "Rate expectations and credit conditions can shift the market read quickly.",
    },
  ],
  segments: [
    {
      name: "Consumer banking",
      share: "Large base",
      signal: "Credit and deposits",
      context: "Deposit costs, card trends, and credit quality shape consumer read-through.",
    },
    {
      name: "Commercial / investment banking",
      share: "Activity-sensitive",
      signal: "Markets and deal flow",
      context: "Capital markets activity can add strength or softness depending on the cycle.",
    },
    {
      name: "Asset and wealth management",
      share: "Fee contributor",
      signal: "Market-sensitive",
      context: "Fee revenue can vary with asset levels and client activity.",
    },
  ],
  risks: [
    {
      title: "Credit quality weakens",
      severity: "Higher",
      status: "Watch item",
      context: "Rising losses or reserve builds can challenge the earnings read.",
      mitigation: "Strong capital and diversified revenue can cushion stress.",
      watch: "Charge-offs, reserves, and management commentary.",
    },
    {
      title: "Deposit costs pressure margins",
      severity: "Moderate",
      status: "Ongoing",
      context: "Higher funding costs can weigh on net interest income.",
      mitigation: "Stable deposits and fee income can balance some pressure.",
      watch: "Deposit beta, net interest margin, and rate expectations.",
    },
    {
      title: "Capital markets activity slows",
      severity: "Lower",
      status: "Developing",
      context: "Lower issuance or deal activity can reduce fee revenue.",
      mitigation: "Consumer and commercial banking can provide offsetting context.",
      watch: "Trading, advisory, and underwriting activity.",
    },
  ],
};

const defaultContext = platformContext;

export function getDeepDivePreviewData(symbol: string, sector?: string | null) {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const normalizedSector = (sector ?? "").toLowerCase();

  if (["NVDA", "AMD", "AVGO", "TSM", "INTC"].includes(normalizedSymbol)) {
    return semiconductorContext;
  }

  if (normalizedSymbol === "TSLA" || normalizedSector.includes("vehicle")) {
    return autoContext;
  }

  if (
    ["JPM", "BAC"].includes(normalizedSymbol) ||
    normalizedSector.includes("bank")
  ) {
    return financialContext;
  }

  return defaultContext;
}
