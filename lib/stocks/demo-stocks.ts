import type { ChartPoint } from "@/lib/stock-detail-demo-data";

export type DemoStock = {
  symbol: string;
  companyName: string;
  sector: string;
  price: number;
  dailyChange: number;
  dailyChangePercent: number;
  marketStatus: string;
  statusDetail: string;
  chartData: ChartPoint[];
  headline: string;
  news: string;
  explanation: string;
};

export const demoStocks = [
  {
    symbol: "NVDA",
    companyName: "NVIDIA Corporation",
    sector: "AI infrastructure",
    price: 989.32,
    dailyChange: 36.73,
    dailyChangePercent: 3.84,
    marketStatus: "Market open",
    statusDetail: "Closes 4:00 PM ET",
    chartData: [
      { label: "9:30", value: 958 },
      { label: "10:00", value: 964 },
      { label: "10:30", value: 971 },
      { label: "11:00", value: 977 },
      { label: "11:30", value: 983 },
      { label: "12:00", value: 989 },
      { label: "1:00", value: 994 },
      { label: "2:00", value: 989 },
    ],
    headline: "AI infrastructure demand keeps leadership context in focus",
    news: "Cloud spending commentary and semiconductor breadth are reinforcing confidence in accelerator demand.",
    explanation:
      "Investors are paying up for durable AI demand after fresh cloud and enterprise commentary suggested accelerator budgets remain strategic rather than discretionary.",
  },
  {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    sector: "Consumer platforms",
    price: 196.45,
    dailyChange: 2.18,
    dailyChangePercent: 1.12,
    marketStatus: "Market open",
    statusDetail: "Closes 4:00 PM ET",
    chartData: [
      { label: "9:30", value: 193.9 },
      { label: "10:00", value: 194.2 },
      { label: "10:30", value: 195.1 },
      { label: "11:00", value: 195.7 },
      { label: "11:30", value: 195.4 },
      { label: "12:00", value: 196.2 },
      { label: "1:00", value: 196.8 },
      { label: "2:00", value: 196.45 },
    ],
    headline: "Services resilience is offsetting slower hardware concern",
    news: "Investors are leaning into higher-margin services visibility while waiting for clearer device cycle signals.",
    explanation:
      "The move is being supported by confidence in services durability and capital return, even as hardware demand remains the key counterweight.",
  },
  {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    sector: "Cloud software",
    price: 421.76,
    dailyChange: 5.94,
    dailyChangePercent: 1.43,
    marketStatus: "Market open",
    statusDetail: "Closes 4:00 PM ET",
    chartData: [
      { label: "9:30", value: 416.1 },
      { label: "10:00", value: 417.3 },
      { label: "10:30", value: 418.6 },
      { label: "11:00", value: 419.8 },
      { label: "11:30", value: 420.4 },
      { label: "12:00", value: 421.1 },
      { label: "1:00", value: 422.2 },
      { label: "2:00", value: 421.76 },
    ],
    headline: "Cloud and AI attach rates remain the center of the read",
    news: "Azure commentary and enterprise AI adoption remain the most important inputs behind today's bid.",
    explanation:
      "The stock is moving because investors are treating AI workloads as an accelerator for cloud durability rather than a separate hype cycle.",
  },
  {
    symbol: "AMD",
    companyName: "Advanced Micro Devices",
    sector: "Semiconductors",
    price: 182.44,
    dailyChange: 3.9,
    dailyChangePercent: 2.18,
    marketStatus: "Market open",
    statusDetail: "Closes 4:00 PM ET",
    chartData: [
      { label: "9:30", value: 178.5 },
      { label: "10:00", value: 179.2 },
      { label: "10:30", value: 180.4 },
      { label: "11:00", value: 181.7 },
      { label: "11:30", value: 181.2 },
      { label: "12:00", value: 182.0 },
      { label: "1:00", value: 183.1 },
      { label: "2:00", value: 182.44 },
    ],
    headline: "AI accelerator broadening is the key investor question",
    news: "The tape is rewarding signs that AI compute demand can broaden beyond the category leader.",
    explanation:
      "AMD is trading higher as investors look for evidence that enterprise AI accelerator demand is broadening across second-source suppliers.",
  },
  {
    symbol: "TSLA",
    companyName: "Tesla Inc.",
    sector: "Electric vehicles",
    price: 174.32,
    dailyChange: -2.47,
    dailyChangePercent: -1.4,
    marketStatus: "Market open",
    statusDetail: "Closes 4:00 PM ET",
    chartData: [
      { label: "9:30", value: 177.1 },
      { label: "10:00", value: 176.4 },
      { label: "10:30", value: 175.8 },
      { label: "11:00", value: 176.2 },
      { label: "11:30", value: 175.1 },
      { label: "12:00", value: 174.8 },
      { label: "1:00", value: 173.9 },
      { label: "2:00", value: 174.32 },
    ],
    headline: "Margin pressure is outweighing delivery optimism",
    news: "Investors are focused on pricing, gross margin durability, and whether demand incentives are rising.",
    explanation:
      "The stock is lower because margin and pricing concerns are carrying more weight than near-term delivery stabilization.",
  },
] satisfies DemoStock[];

export function getDemoStockBySymbol(symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  return demoStocks.find((stock) => stock.symbol === normalizedSymbol);
}
