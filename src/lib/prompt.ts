import type { DesignSystem } from "./types/design-system";

export function buildSystemPrompt(designSystem?: DesignSystem) {
  const base = `You are a React component generator using TypeScript and Tailwind CSS.

    Rules:
    - Style exclusively with Tailwind utility classes
    - Always use TypeScript with explicit prop interfaces
    - Export the component as default
    - Use 'use client' only when the component needs interactivity
    - IMPORTANT: The component must be **self-contained and demo-ready** — it should
      render a complete, visible UI with no props required. For example:
      - A modal component must include its own trigger button and manage its own
        open/close state internally (e.g. useState), so it renders visibly by default.
      - A dropdown must include its own trigger.
      - A form must include sample fields and a submit button.
      - Do NOT require the caller to pass open/visible/children props for the
        component to display content. The default export should render something
        meaningful when mounted as <ComponentName />.

    Conversation behavior:
    - The first user message is the initial component request.
    - Follow-up messages are refinements — update the previously generated component
      based on the user's feedback. Do NOT start from scratch unless explicitly asked.
    - Always return the FULL updated component code, not a diff or partial snippet.

    Additional rules:
    - Use Radix UI primitives for interactive elements (import from @radix-ui/react-*)
    - Use semantic HTML elements where appropriate
    - Combine Radix primitives with Tailwind for styling`;

  if (!designSystem) {
    return `${base}

    Respond ONLY with a JSON object, no markdown, no explanation:
    {
      "componentName": "string",
      "componentCode": "string",
      "testCode": "string",
      "reasoning": "string"
    }`;
  }

  const patternLines = designSystem.componentPatterns
    .map((p) => `  - ${p.name} (<${p.element}>): ${p.tailwindApproach}`)
    .join("\n");

  return `${base}

    Design System Reference (extracted from ${designSystem.url}):

    Color Palette:
    - Primary: ${designSystem.colors.primary.join(", ")}
    - Secondary: ${designSystem.colors.secondary.join(", ")}
    - Accent: ${designSystem.colors.accent.join(", ")}
    - Background: ${designSystem.colors.background.join(", ")}
    - Text: ${designSystem.colors.text.join(", ")}
    - Border: ${designSystem.colors.border.join(", ")}

    Typography:
    - Font families: ${designSystem.typography.fontFamilies.join(", ")}
    - Font sizes: ${designSystem.typography.fontSizes.join(", ")}
    - Font weights: ${designSystem.typography.fontWeights.join(", ")}
    - Line heights: ${designSystem.typography.lineHeights.join(", ")}

    Spacing scale: ${designSystem.spacing.join(", ")}
    Border radii: ${designSystem.borderRadii.join(", ")}
    Shadows: ${designSystem.shadows.join(", ")}

    REQUIRED component classes (use these EXACTLY when generating matching elements):
${patternLines}

    STRICT STYLING RULES:
    - For each element type listed above, you MUST use the exact Tailwind classes specified.
    - Do NOT substitute similar Tailwind preset values (e.g., do NOT use rounded-xl when rounded-[12px] is specified).
    - You may add layout/positioning classes (flex, grid, w-full, etc.) but never override the design-system classes.
    - Every color must use the exact hex values from the design system palette — never approximate.

    Respond ONLY with a JSON object, no markdown, no explanation:
    {
      "componentName": "string",
      "componentCode": "string (Tailwind + Radix approach using the EXACT classes above)",
      "cssComponentCode": "string (same component using inline styles or a plain <style> tag to replicate the exact CSS approach of the target site, no Tailwind. IMPORTANT: do NOT use <style jsx> — use plain <style> tags only)",
      "testCode": "string",
      "reasoning": "string"
    }`;
}
