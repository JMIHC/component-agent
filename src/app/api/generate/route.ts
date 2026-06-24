import { anthropic } from "@/lib/anthropic";
import { buildSystemPrompt } from "@/lib/prompt";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(req: Request) {
  const { messages, designSystem, turnstileToken } = await req.json();

  const turnstile = await verifyTurnstile(req, turnstileToken);
  if (!turnstile.ok) return turnstile.response;

  const limit = await checkRateLimit(req);
  if (!limit.ok) return limit.response;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: buildSystemPrompt(designSystem ?? undefined),
    messages,
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return new Response(text);
}
