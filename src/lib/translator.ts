import type { TranslationEngine } from "../types";

export interface TranslateOptions {
  engine: TranslationEngine;
  apiKey: string;
  sourceLang: string;
  targetLang: string;
  lines: string[];
  /** Called after each line is translated — for streaming progress */
  onProgress?: (index: number, translation: string) => void;
}

// ─── Claude ──────────────────────────────────────────────────────────────────

async function translateWithClaude(opts: TranslateOptions): Promise<string[]> {
  const { apiKey, sourceLang, targetLang, lines, onProgress } = opts;
  const results: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // fast + cheap for subtitle lines
        max_tokens: 256,
        system: `You are a subtitle translator. Translate the given subtitle line from ${sourceLang} to ${targetLang}. 
Output ONLY the translated text — no quotes, no explanation, no extra formatting.
Preserve line breaks if present. Keep the translation concise and natural for on-screen display.`,
        messages: [{ role: "user", content: lines[i] }],
      }),
    });

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
    const data = await response.json();
    const translation = data.content[0]?.text?.trim() ?? "";
    results.push(translation);
    onProgress?.(i, translation);
  }

  return results;
}

// ─── DeepL ───────────────────────────────────────────────────────────────────

async function translateWithDeepL(opts: TranslateOptions): Promise<string[]> {
  const { apiKey, targetLang, lines } = opts;

  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `DeepL-Auth-Key ${apiKey}`,
    },
    body: JSON.stringify({
      text: lines,
      target_lang: targetLang.toUpperCase().slice(0, 2),
    }),
  });

  if (!response.ok) throw new Error(`DeepL API error: ${response.status}`);
  const data = await response.json();
  return data.translations.map((t: { text: string }) => t.text);
}

// ─── OpenAI ──────────────────────────────────────────────────────────────────

async function translateWithOpenAI(opts: TranslateOptions): Promise<string[]> {
  const { apiKey, sourceLang, targetLang, lines, onProgress } = opts;
  const results: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 256,
        messages: [
          {
            role: "system",
            content: `Translate subtitle lines from ${sourceLang} to ${targetLang}. Output ONLY the translated text.`,
          },
          { role: "user", content: lines[i] },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
    const data = await response.json();
    const translation = data.choices[0]?.message?.content?.trim() ?? "";
    results.push(translation);
    onProgress?.(i, translation);
  }

  return results;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function translateLines(opts: TranslateOptions): Promise<string[]> {
  switch (opts.engine) {
    case "claude":  return translateWithClaude(opts);
    case "deepl":   return translateWithDeepL(opts);
    case "openai":  return translateWithOpenAI(opts);
    case "google":  throw new Error("Google Translate not yet implemented.");
    case "manual":  throw new Error("Manual mode — nothing to translate.");
    default:        throw new Error(`Unknown engine: ${opts.engine}`);
  }
}

export async function translateSingleLine(
  line: string,
  opts: Omit<TranslateOptions, "lines">
): Promise<string> {
  const results = await translateLines({ ...opts, lines: [line] });
  return results[0] ?? "";
}
