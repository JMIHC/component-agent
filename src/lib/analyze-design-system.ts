import { anthropic } from "./anthropic";
import type { DesignSystem } from "./types/design-system";
import type { ExtractedStyles } from "./extract-styles";

export async function analyzeDesignSystem(
  computedStyles: ExtractedStyles,
  screenshotBase64: string,
  url: string
): Promise<DesignSystem> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: screenshotBase64,
            },
          },
          {
            type: "text",
            text: `Analyze the design system of this website (${url}).

Here are the computed styles extracted from the page, organized by element type:

Per-element styles (non-default computed CSS properties per element type):
${JSON.stringify(computedStyles.perElementStyles, null, 2)}

Aggregate styles overview:
${JSON.stringify(computedStyles.computedStyles, null, 2)}

CSS custom properties:
${JSON.stringify(computedStyles.cssVariables, null, 2)}

Based on BOTH the screenshot and the computed styles, produce a structured design system analysis as a JSON object with this exact schema:

{
  "colors": {
    "primary": ["#hex", ...],
    "secondary": ["#hex", ...],
    "accent": ["#hex", ...],
    "background": ["#hex", ...],
    "text": ["#hex", ...],
    "border": ["#hex", ...]
  },
  "typography": {
    "fontFamilies": ["font-name", ...],
    "fontSizes": ["16px", ...],
    "fontWeights": [400, 700, ...],
    "lineHeights": ["1.5", ...]
  },
  "spacing": ["4px", "8px", "16px", ...],
  "borderRadii": ["4px", "8px", ...],
  "shadows": ["0 1px 3px rgba(0,0,0,0.1)", ...],
  "componentPatterns": [
    {
      "name": "Button",
      "element": "button",
      "description": "How buttons are styled on this site",
      "styles": { "backgroundColor": "#1a1a1a", "color": "#ffffff", "borderRadius": "12px", "padding": "8px 16px", "fontSize": "14px", "fontWeight": "600" },
      "cssApproach": ".btn { background-color: #1a1a1a; color: #fff; border-radius: 12px; padding: 8px 16px; font-size: 14px; font-weight: 600; }",
      "tailwindApproach": "bg-[#1a1a1a] text-[#ffffff] rounded-[12px] px-[16px] py-[8px] text-[14px] font-[600]"
    }
  ],
  "rawCssVariables": { "--var-name": "value", ... }
}

CRITICAL rules for componentPatterns:
- Derive styles directly from the per-element computed styles data above
- The "styles" field must contain the exact CSS property-value pairs from the extracted data
- The "tailwindApproach" field must be an EXACT Tailwind utility class string using arbitrary values (e.g., bg-[#hex], rounded-[12px], text-[14px], font-[600], tracking-[0.5px])
- Do NOT use approximate Tailwind presets — always use arbitrary values with the exact extracted measurements
- The "cssApproach" field must be a complete CSS rule with the exact property values
- Analyze these component types if visible: buttons, cards/containers, navigation, inputs/forms, headings, links, badges/tags
- Only include patterns for elements actually visible on the page

Other rules:
- Convert all rgb/rgba colors to hex where possible
- Deduplicate and sort values logically (smallest to largest for sizes)
- Include rawCssVariables from the extracted CSS custom properties
- Respond ONLY with the JSON object, no markdown fences, no explanation`,
          },
        ],
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Failed to parse design system analysis from Claude");
  }

  const analysis = JSON.parse(cleaned.slice(start, end + 1));

  return {
    url,
    extractedAt: new Date().toISOString(),
    screenshotBase64,
    ...analysis,
  };
}
