
// ============================================================
// services/geminiService.ts
// ============================================================
// No longer calls Gemini directly. POSTs to your Express
// backend instead. Your GEMINI_API_KEY is now server-side only.
// ============================================================

import { SecurityEvent } from "../types";

export const analyzeSecurityLogs = async (events: SecurityEvent[]): Promise<string> => {
  try {
    const response = await fetch(`/api/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Audit API error:', err);
      return 'Error communicating with the security intelligence core.';
    }

    const data = await response.json();
    return data.result || 'Unable to generate security audit at this time.';
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    return 'Error communicating with the security intelligence core.';
  }
};
