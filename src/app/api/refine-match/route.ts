import { anthropic } from "@/lib/anthropic";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export const maxDuration = 60;

export async function POST(req: Request) {
  const {
    currentCode,
    componentName,
    previewScreenshotBase64,
    targetScreenshotBase64,
    turnstileToken,
  } = await req.json();

  const turnstile = await verifyTurnstile(req, turnstileToken);
  if (!turnstile.ok) return turnstile.response;

  const limit = await checkRateLimit(req);
  if (!limit.ok) return limit.response;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: targetScreenshotBase64,
            },
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: previewScreenshotBase64,
            },
          },
          {
            type: "text",
            text: `Image 1 is the TARGET design we want to match. Image 2 is the CURRENT rendering of our component.

Compare both images carefully at a pixel level. Identify EVERY visual difference:
- Exact colors (backgrounds, text, borders)
- Border radius values
- Spacing (padding, margin, gap)
- Font sizes, weights, and families
- Shadows and elevation
- Layout and alignment
- Any other visual discrepancy

Here is the current component code:
\`\`\`tsx
${currentCode}
\`\`\`

Produce a corrected version that more closely matches the TARGET design. Fix ALL visual discrepancies.
IMPORTANT: If using <style> tags, use plain <style> only — do NOT use <style jsx>.

Respond ONLY with a JSON object, no markdown fences:
{
  "componentName": "${componentName}",
  "componentCode": "full corrected component code",
  "differences": ["list of each visual difference you identified and fixed"],
  "reasoning": "brief explanation"
}`,
          },
        ],
      },
    ],
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
          console.warn("refine-match hit max_tokens — output truncated");
        }
      } catch (err) {
        console.error("refine-match stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
