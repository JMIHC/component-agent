import { extractStylesFromUrl } from "@/lib/extract-styles";
import { analyzeDesignSystem } from "@/lib/analyze-design-system";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(req: Request) {
  const { url, turnstileToken } = await req.json();

  const turnstile = await verifyTurnstile(req, turnstileToken);
  if (!turnstile.ok) return turnstile.response;

  const limit = await checkRateLimit(req);
  if (!limit.ok) return limit.response;

  if (!url || typeof url !== "string") {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return Response.json(
      { error: "Only http and https URLs are supported" },
      { status: 400 }
    );
  }

  try {
    const { computedStyles, screenshotBase64 } =
      await extractStylesFromUrl(url);

    const designSystem = await analyzeDesignSystem(
      computedStyles,
      screenshotBase64,
      url
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
