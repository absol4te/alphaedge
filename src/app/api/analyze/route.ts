import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SAMPLE_ANALYSIS } from "@/lib/financials";

export const runtime = "nodejs";
export const maxDuration = 60;

// JSON schema the model must return — mirrors DocumentAnalysis (minus fileName).
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    company: { type: "string" },
    period: { type: "string" },
    executiveSummary: { type: "string" },
    keyTakeaways: { type: "array", items: { type: "string" } },
    bullCase: { type: "array", items: { type: "string" } },
    bearCase: { type: "array", items: { type: "string" } },
    riskFactors: { type: "array", items: { type: "string" } },
    metrics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          value: { type: "string" },
          change: { type: "string" },
        },
        required: ["label", "value", "change"],
      },
    },
  },
  required: [
    "company",
    "period",
    "executiveSummary",
    "keyTakeaways",
    "bullCase",
    "bearCase",
    "riskFactors",
    "metrics",
  ],
} as const;

const SYSTEM = `You are a senior equity research analyst at a top investment bank.
You read primary financial filings (10-K, 10-Q, earnings releases, investor decks) and
produce concise, decision-useful analysis for portfolio managers. Be specific and quantitative,
cite real figures from the document, and write in a neutral, professional tone. Never invent
numbers that are not supported by the document.`;

const INSTRUCTION = `Analyze the attached financial document and return a structured analysis:
- company: the issuer's name
- period: the reporting period and filing type (e.g. "Q3 2025 (10-Q)")
- executiveSummary: 3-5 sentence overview of performance and management tone
- keyTakeaways: 4-6 of the most important, quantified points
- bullCase / bearCase: 3-5 distinct points each
- riskFactors: 3-5 material risks drawn from the filing
- metrics: 4-6 headline figures, each with a label, a value (e.g. "$391.0B"), and a YoY change
  (e.g. "+6.2%"); use an empty string for change if not derivable.`;

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  // No file (the "Try with a sample" button) or no API key → curated sample,
  // so the demo always works without an upload or a key.
  if (!(file instanceof File) || !process.env.ANTHROPIC_API_KEY) {
    const { fileName, ...rest } = SAMPLE_ANALYSIS;
    return NextResponse.json({ data: rest, live: false });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 415 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const client = new Anthropic();

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM + "\n\nOutput MUST be a single raw JSON object — no markdown, no prose before or after.",
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: INSTRUCTION },
          ],
        },
      ],
    });

    const text = message.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      throw new Error("No text content returned");
    }
    // Robustly extract JSON even if model wraps in markdown
    const raw = text.text;
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : raw;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found in response");
    const data = JSON.parse(candidate.slice(start, end + 1));
    return NextResponse.json({ data, live: true });
  } catch (e) {
    console.error("[/api/analyze] Claude analysis failed:", e);
    return NextResponse.json(
      { error: "Analysis failed. Check the server logs and your ANTHROPIC_API_KEY." },
      { status: 502 },
    );
  }
}
