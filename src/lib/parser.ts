export interface GeneratedComponent {
  componentName: string;
  componentCode: string;
  testCode: string;
  reasoning: string;
}

export function parseResponse(raw: string): GeneratedComponent | null {
  try {
    // Strip any markdown fences, leading/trailing whitespace
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Find the first { and last } in case there's extra text around the JSON
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) return null;

    const jsonOnly = cleaned.slice(start, end + 1);
    return JSON.parse(jsonOnly);
  } catch (err) {
    console.error("Parse error:", err);
    return null;
  }
}