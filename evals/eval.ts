import "dotenv/config";
import { Eval, wrapAnthropic } from "braintrust";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "../src/lib/prompt";
import { evalDataset, type EvalCase } from "./dataset";
import {
  validJsonScorer,
  structuralScorer,
  radixUsageScorer,
  requiredElementsScorer,
  styleConformanceScorer,
  cssVersionScorer,
} from "./scorers";

const client = wrapAnthropic(
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
);

async function generateComponent(input: EvalCase["input"]): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: buildSystemPrompt(input.designSystem),
    messages: [{ role: "user", content: input.prompt }],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

Eval("component-agent", {
  experimentName: `gen-${new Date().toISOString().slice(0, 16)}`,
  data: () =>
    evalDataset.map((c) => ({
      input: c.input,
      expected: c.expected,
      metadata: c.metadata,
    })),
  task: async (input: EvalCase["input"]) => {
    return await generateComponent(input);
  },
  scores: [
    // Wrapping each scorer to match Braintrust's expected signature
    ({ output, expected }: { output: string; expected: EvalCase["expected"] }) =>
      validJsonScorer({ output }),
    ({ output, expected }: { output: string; expected: EvalCase["expected"] }) =>
      structuralScorer({ output }),
    ({ output, expected }: { output: string; expected: EvalCase["expected"] }) =>
      radixUsageScorer({ output, expected }),
    ({ output, expected }: { output: string; expected: EvalCase["expected"] }) =>
      requiredElementsScorer({ output, expected }),
    ({ output, expected, input }: { output: string; expected: EvalCase["expected"]; input: EvalCase["input"] }) =>
      styleConformanceScorer({ output, expected }),
    ({ output, input }: { output: string; input: EvalCase["input"] }) =>
      cssVersionScorer({ output, input }),
  ],
  maxConcurrency: 3,
});
