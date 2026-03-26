import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow Vite's inline scripts during dev
  }));
  app.use(cors());
  app.use(express.json({ limit: "64kb" }));

  // Rate limiting for the audit endpoint
  const auditLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: "Too many audit requests. Please wait a moment." },
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "trilock-backend" });
  });

  app.post("/api/audit", auditLimiter, async (req, res) => {
    try {
      const body = req.body;
      if (!body?.events || !Array.isArray(body.events)) {
        return res.status(400).json({ error: "events must be an array." });
      }

      const eventSummary = body.events
        .map((e: any) => `[${e.timestamp}] Phase: ${e.phase}, Status: ${e.status}, Details: ${e.details}`)
        .join("\n");

      const prompt = `
As a specialized AI Security Auditor for a high-security 3-Phase Locking System, analyze the following recent events:

${eventSummary}

Identify patterns of suspicious behavior, hardware health issues, or unauthorized attempts.
Provide a concise risk assessment and 3 actionable recommendations.
      `.trim();

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          temperature: 0.7,
        },
      });

      res.json({ result: response.text || "Unable to generate security audit at this time." });
    } catch (error) {
      console.error("[TriLock] Audit Error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TriLock] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
