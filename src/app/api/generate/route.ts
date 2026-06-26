import { anthropic } from "@/lib/anthropic";
import { buildSystemPrompt } from "@/lib/prompt";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, designSystem, turnstileToken } = await req.json();

  const turnstile = await verifyTurnstile(req, turnstileToken);
  if (!turnstile.ok) return turnstile.response;

  const limit = await checkRateLimit(req);
  if (!limit.ok) return limit.response;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: buildSystemPrompt(designSystem ?? undefined),
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "max_tokens") {
          console.warn("generate hit max_tokens — output truncated");
        }
      } catch (err) {
        console.error("generate stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
