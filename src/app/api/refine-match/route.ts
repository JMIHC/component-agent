import { anthropic } from "@/lib/anthropic";

export async function POST(req: Request) {
  const {
    currentCode,
    componentName,
    previewScreenshotBase64,
    targetScreenshotBase64,
  } = await req.json();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
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

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return new Response(text);
}
