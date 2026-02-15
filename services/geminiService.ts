
import { GoogleGenAI, Type } from "@google/genai";
import { SecurityEvent } from "../types";

export const analyzeSecurityLogs = async (events: SecurityEvent[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const eventSummary = events.map(e => 
    `[${e.timestamp.toISOString()}] Phase: ${e.phase}, Status: ${e.status}, Details: ${e.details}`
  ).join('\n');

  const prompt = `
    As a specialized AI Security Auditor for a high-security 3-Phase Locking System, analyze the following recent events:
    
    ${eventSummary}
    
    Identify patterns of suspicious behavior, hardware health issues, or unauthorized attempts.
    Provide a concise risk assessment and 3 actionable recommendations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.7,
      }
    });

    return response.text || "Unable to generate security audit at this time.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error communicating with the security intelligence core.";
  }
};
