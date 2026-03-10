import { anthropic } from "@/lib/anthropic";
import { buildSystemPrompt } from "@/lib/prompt";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages,
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return new Response(text);
}
