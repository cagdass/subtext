import type { SubtitleLine, SubtitleFormat } from "../types";

/** Normalise all line endings to \n so the rest of the parser is simple. */
function normalise(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// ─── SRT ─────────────────────────────────────────────────────────────────────

function parseSrt(raw: string): SubtitleLine[] {
  const text = normalise(raw).trim();
  // Split on one or more blank lines
  const blocks = text.split(/\n{2,}/);
  const lines: SubtitleLine[] = [];

  for (const block of blocks) {
    const rows = block.trim().split("\n");
    if (rows.length < 2) continue;

    // The id line may be missing in malformed files — scan for the time row
    let timeRowIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 3); i++) {
      if (rows[i].includes("-->")) { timeRowIdx = i; break; }
    }
    if (timeRowIdx === -1) continue;

    const timeParts = rows[timeRowIdx].match(
      /(\d{1,2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,\.]\d{3})/
    );
    if (!timeParts) continue;

    // Normalise separator to comma
    const start = timeParts[1].replace(".", ",");
    const end = timeParts[2].replace(".", ",");

    // id is the line before the time row (if it exists and is a number)
    const idRaw = timeRowIdx > 0 ? parseInt(rows[timeRowIdx - 1].trim(), 10) : NaN;
    const id = isNaN(idRaw) ? lines.length + 1 : idRaw;

    // Everything after the time row is the subtitle text
    const original = rows
      .slice(timeRowIdx + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "") // strip HTML tags (bold/italic markers)
      .trim();

    if (!original) continue;
    lines.push({ id, start, end, original, translation: "" });
  }

  return lines;
}

// ─── VTT ─────────────────────────────────────────────────────────────────────

function parseVtt(raw: string): SubtitleLine[] {
  const text = normalise(raw);
  // Strip WEBVTT header block
  const content = text.replace(/^WEBVTT[^\n]*\n+/, "");
  const blocks = content.trim().split(/\n{2,}/);
  const lines: SubtitleLine[] = [];
  let idCounter = 1;

  for (const block of blocks) {
    const rows = block.trim().split("\n");

    // Find the --> row
    let timeRowIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 3); i++) {
      if (rows[i].includes("-->")) { timeRowIdx = i; break; }
    }
    if (timeRowIdx === -1) continue;

    const timeParts = rows[timeRowIdx].match(
      /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/
    );
    if (!timeParts) continue;

    const start = timeParts[1].replace(".", ",");
    const end = timeParts[2].replace(".", ",");
    const original = rows.slice(timeRowIdx + 1).join("\n").trim();

    if (!original) continue;
    lines.push({ id: idCounter++, start, end, original, translation: "" });
  }

  return lines;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function detectFormat(filename: string): SubtitleFormat | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "srt") return "srt";
  if (ext === "vtt") return "vtt";
  if (ext === "ass" || ext === "ssa") return "ass";
  if (ext === "sub") return "sub";
  return null;
}

export function parseSubtitles(raw: string, format: SubtitleFormat): SubtitleLine[] {
  switch (format) {
    case "srt": return parseSrt(raw);
    case "vtt": return parseVtt(raw);
    // ASS/SUB: fall back to SRT-style for now — extend later
    default: return parseSrt(raw);
  }
}

// ─── Serialiser ──────────────────────────────────────────────────────────────

export function serialiseSrt(lines: SubtitleLine[]): string {
  const res = lines
    .map(
      (l) =>
        `${l.id}\n${l.start} --> ${l.end}\n${l.translation || l.original}\n`
    )
    .join("\n");
  // console.log(`SRT serialised:\nLength: ${res.length}\nFirst line: ${res.slice(0, res.indexOf("\n"))}`);
  return res;
}

export function serialiseVtt(lines: SubtitleLine[]): string {
  const cues = lines
    .map(
      (l) =>
        `${l.start.replace(",", ".")} --> ${l.end.replace(",", ".")}\n${l.translation || l.original
        }`
    )
    .join("\n\n");
  const res = `WEBVTT\n\n${cues}\n`;
  // console.log(`VTT serialised:\nLength: ${res.length}\nFirst line: ${res.slice(0, res.indexOf("\n"))}`);
  return res;
}