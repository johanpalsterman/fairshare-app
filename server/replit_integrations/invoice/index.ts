import OpenAI from "openai";
import type { Express, Request, Response } from "express";
import express from "express";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Body parser with 50MB limit for image payloads
const imageBodyParser = express.json({ limit: "50mb" });

export interface InvoiceData {
  amount: string;
  description: string;
  date: string;
  currency: string;
  vendor: string;
  category: string;
  confidence: number;
}

export async function scanInvoice(imageBase64: string): Promise<InvoiceData> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert receipt and invoice scanner. Analyze the image carefully and extract:

1. amount: The TOTAL amount paid (number only, no currency symbol). Look for "Total", "Te betalen", "Totaal", "Amount Due", or the largest/final amount.
2. description: Brief summary of purchase (e.g., "Groceries", "Restaurant dinner", "Gas station")
3. date: Transaction date in YYYY-MM-DD format. Look for date stamps, "Datum", "Date".
4. currency: Currency code (EUR, USD, GBP). Default to EUR if unclear.
5. vendor: Store/business name. Usually at the top of the receipt.
6. category: Choose ONE: food, transport, entertainment, shopping, utilities, other

IMPORTANT: 
- Look carefully at ALL text in the image
- The total is usually the largest amount or marked clearly
- If text is blurry, make your best estimate
- Output ONLY valid JSON, no markdown or explanations`
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              detail: "high"
            }
          },
          {
            type: "text",
            text: "Extract the receipt/invoice details and return as JSON with keys: amount, description, date, currency, vendor, category, confidence"
          }
        ]
      }
    ],
    max_completion_tokens: 500,
    response_format: { type: "json_object" }
  });

  const content = response.choices[0]?.message?.content || "{}";
  console.log("AI scan response:", content);
  
  try {
    const parsed = JSON.parse(content);
    return {
      amount: String(parsed.amount || "0").replace(/[^0-9.,]/g, '').replace(',', '.'),
      description: parsed.description || "Receipt scan",
      date: parsed.date || new Date().toISOString().split('T')[0],
      currency: parsed.currency || "EUR",
      vendor: parsed.vendor || "Unknown",
      category: parsed.category || "other",
      confidence: parsed.confidence || 0.5
    };
  } catch (e) {
    console.error("Failed to parse AI response:", content, e);
    return {
      amount: "0",
      description: "Could not read receipt",
      date: new Date().toISOString().split('T')[0],
      currency: "EUR",
      vendor: "Unknown",
      category: "other",
      confidence: 0
    };
  }
}

export function registerInvoiceRoutes(app: Express): void {
  app.post("/api/scan-invoice", imageBodyParser, async (req: Request, res: Response) => {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Image data (base64) is required" });
      }

      const invoiceData = await scanInvoice(image);
      res.json(invoiceData);
    } catch (error) {
      console.error("Error scanning invoice:", error);
      res.status(500).json({ error: "Failed to scan invoice" });
    }
  });
}
