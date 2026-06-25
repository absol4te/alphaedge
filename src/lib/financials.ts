import { DocumentAnalysis, FinancialStatement } from "@/types";
import { getCompany } from "./mock-data";
import { seededRandom } from "./utils";

/** Builds an annual statement set scaled off the company's revenue. */
export function getFinancialStatement(symbol: string): FinancialStatement {
  const c = getCompany(symbol);
  const baseRev = c?.stats.revenue ?? 1e11;
  const rnd = seededRandom((symbol.charCodeAt(0) || 65) * 7);
  const periods = ["2025", "2024", "2023", "2022", "2021"];

  // Generate 5 years of revenue, declining into the past.
  const revenue: number[] = [];
  let r = baseRev;
  for (let i = 0; i < 5; i++) {
    revenue.push(r);
    r = r / (1.08 + rnd() * 0.12);
  }

  const grossMargin = 0.42 + rnd() * 0.25;
  const opMargin = 0.22 + rnd() * 0.15;
  const netMargin = 0.16 + rnd() * 0.12;

  const cogs = revenue.map((v) => v * (1 - grossMargin));
  const grossProfit = revenue.map((v, i) => v - cogs[i]);
  const opEx = revenue.map((v, i) => grossProfit[i] - v * opMargin);
  const opIncome = revenue.map((v) => v * opMargin);
  const netIncome = revenue.map((v) => v * netMargin);
  const eps = netIncome.map((v) => v / (c?.stats.sharesOutstanding ?? 1e10));

  const totalAssets = revenue.map((v) => v * (1.6 + rnd() * 0.6));
  const totalLiab = totalAssets.map((v) => v * (0.45 + rnd() * 0.2));
  const equity = totalAssets.map((v, i) => v - totalLiab[i]);
  const cash = revenue.map((v) => v * (0.18 + rnd() * 0.12));
  const debt = equity.map((v) => v * (c?.stats.debtToEquity ?? 0.4));

  const ocf = netIncome.map((v) => v * (1.2 + rnd() * 0.3));
  const capex = revenue.map((v) => -v * (0.06 + rnd() * 0.05));
  const fcf = ocf.map((v, i) => v + capex[i]);

  return {
    periods,
    income: [
      { label: "Revenue", values: revenue, growth: true },
      { label: "Cost of Revenue", values: cogs },
      { label: "Gross Profit", values: grossProfit, isHeader: true },
      { label: "Operating Expenses", values: opEx },
      { label: "Operating Income", values: opIncome, isHeader: true },
      { label: "Net Income", values: netIncome, isHeader: true, growth: true },
      { label: "EPS (Diluted)", values: eps },
    ],
    balance: [
      { label: "Cash & Equivalents", values: cash },
      { label: "Total Assets", values: totalAssets, isHeader: true },
      { label: "Total Debt", values: debt },
      { label: "Total Liabilities", values: totalLiab, isHeader: true },
      { label: "Shareholders' Equity", values: equity, isHeader: true, growth: true },
    ],
    cashflow: [
      { label: "Operating Cash Flow", values: ocf, growth: true },
      { label: "Capital Expenditure", values: capex },
      { label: "Free Cash Flow", values: fcf, isHeader: true, growth: true },
    ],
  };
}

export const SAMPLE_ANALYSIS: DocumentAnalysis = {
  fileName: "AAPL_10-K_FY2025.pdf",
  company: "Apple Inc.",
  period: "Fiscal Year 2025 (10-K)",
  executiveSummary:
    "Apple delivered record annual revenue driven by Services momentum and a resilient iPhone franchise, despite foreign-exchange headwinds and a moderating hardware refresh cycle. Gross margin expanded to a record on favorable mix toward high-margin Services, while the company returned the majority of free cash flow to shareholders via buybacks and dividends. Management struck a constructive tone on the Apple Intelligence rollout as a multi-year upgrade catalyst.",
  keyTakeaways: [
    "Total net sales grew 6.2% YoY to a record, with Services up 14% and now ~26% of revenue.",
    "Gross margin reached a record 46.8%, up 130bps YoY on Services mix and supply-chain efficiency.",
    "Returned $97B to shareholders; net cash position remains a strategic flexibility lever.",
    "Installed base surpassed 2.3B active devices, underpinning durable Services growth.",
  ],
  bullCase: [
    "Apple Intelligence drives an accelerated device upgrade super-cycle across iPhone and Mac.",
    "Services continues double-digit growth at high incremental margins, lifting blended profitability.",
    "Massive, sticky installed base provides recurring, defensible cash flows.",
    "Aggressive capital return shrinks share count, compounding EPS growth.",
  ],
  bearCase: [
    "Hardware revenue is increasingly mature with elongating replacement cycles.",
    "Regulatory pressure on the App Store and Google TAC payments threatens Services economics.",
    "Greater China remains a competitive and geopolitical risk to both demand and supply.",
    "Premium valuation leaves limited margin for execution missteps.",
  ],
  riskFactors: [
    "Concentration in iPhone leaves results sensitive to a single product line.",
    "Global supply chain exposure to manufacturing partners in Asia.",
    "Antitrust and digital-markets regulation across the US and EU.",
    "Foreign-exchange volatility given >50% of revenue is international.",
  ],
  metrics: [
    { label: "Revenue", value: "$391.0B", change: "+6.2%" },
    { label: "Net Income", value: "$99.8B", change: "+8.1%" },
    { label: "Operating Margin", value: "31.5%", change: "+90bps" },
    { label: "Gross Margin", value: "46.8%", change: "+130bps" },
    { label: "Free Cash Flow", value: "$108.8B", change: "+9.3%" },
    { label: "EPS (Diluted)", value: "$6.46", change: "+11.0%" },
  ],
};
