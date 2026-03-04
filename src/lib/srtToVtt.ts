export function srtToVtt(srt: string): string {
  const normalized = srt.replace(/\r+/g, "").trim()

  // Convert timestamps 00:00:01,234 --> 00:00:02,345  to dots
  const withDots = normalized.replace(
    /(\d{2}:\d{2}:\d{2}),(\d{3})/g,
    (_m, t, ms) => `${t}.${ms}`
  )

  // Ensure WEBVTT header
  return `WEBVTT\n\n${withDots}\n`
}