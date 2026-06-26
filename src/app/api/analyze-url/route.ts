import { extractStylesFromUrl } from "@/lib/extract-styles";
import { analyzeDesignSystem } from "@/lib/analyze-design-system";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export const maxDuration = 60;

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;
  if (!parsed.hostname.includes(".")) return null;

  return parsed.toString();
}

export async function POST(req: Request) {
  const { url, turnstileToken } = await req.json();

  const turnstile = await verifyTurnstile(req, turnstileToken);
  if (!turnstile.ok) return turnstile.response;

  const limit = await checkRateLimit(req);
  if (!limit.ok) return limit.response;

  if (!url || typeof url !== "string") {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  const normalized = normalizeUrl(url);
  if (!normalized) {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const { computedStyles, screenshotBase64 } =
      await extractStylesFromUrl(normalized);

    const designSystem = await analyzeDesignSystem(
      computedStyles,
      screenshotBase64,
      normalized
    );

    return Response.json({ designSystem });
  } catch (err) {
    console.error("Design system analysis failed:", err);
    return Response.json(
      { error: "Failed to analyze the URL. The site may be unreachable." },
      { status: 500 }
    );
  }
}
