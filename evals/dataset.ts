import type { DesignSystem } from "../src/lib/types/design-system";

export interface EvalCase {
  input: {
    prompt: string;
    designSystem?: DesignSystem;
  };
  expected: {
    hasRadixImports: boolean;
    requiredElements: string[];
    requiredClasses?: string[];
  };
  metadata?: {
    category: string;
    difficulty: string;
  };
}

// A minimal design system fixture for testing style conformance
const stripeDesignSystem: DesignSystem = {
  url: "https://stripe.com",
  extractedAt: "2026-03-10T00:00:00.000Z",
  screenshotBase64: "",
  colors: {
    primary: ["#635bff"],
    secondary: ["#0a2540"],
    accent: ["#00d4aa"],
    background: ["#ffffff", "#f6f9fc"],
    text: ["#0a2540", "#425466"],
    border: ["#e3e8ee"],
  },
  typography: {
    fontFamilies: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto"],
    fontSizes: ["13px", "14px", "16px", "20px", "32px", "48px"],
    fontWeights: [400, 500, 600, 700],
    lineHeights: ["1.4", "1.5", "1.6"],
  },
  spacing: ["4px", "8px", "12px", "16px", "24px", "32px", "48px"],
  borderRadii: ["4px", "8px", "12px"],
  shadows: ["0 2px 4px rgba(0,0,0,0.08)", "0 4px 12px rgba(0,0,0,0.1)"],
  componentPatterns: [
    {
      name: "Button",
      element: "button",
      description: "Rounded pill buttons with bold weight",
      styles: {
        backgroundColor: "#635bff",
        color: "#ffffff",
        borderRadius: "12px",
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: "600",
      },
      cssApproach:
        ".btn { background-color: #635bff; color: #fff; border-radius: 12px; padding: 8px 16px; font-size: 14px; font-weight: 600; }",
      tailwindApproach:
        "bg-[#635bff] text-[#ffffff] rounded-[12px] px-[16px] py-[8px] text-[14px] font-[600]",
    },
    {
      name: "Card",
      element: "div",
      description: "Cards with subtle shadow and rounded corners",
      styles: {
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        padding: "24px",
      },
      cssApproach:
        ".card { background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); padding: 24px; }",
      tailwindApproach:
        "bg-[#ffffff] rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.08)] p-[24px]",
    },
    {
      name: "Heading",
      element: "h1",
      description: "Large bold headings",
      styles: {
        fontSize: "48px",
        fontWeight: "700",
        color: "#0a2540",
        lineHeight: "1.2",
      },
      cssApproach:
        "h1 { font-size: 48px; font-weight: 700; color: #0a2540; line-height: 1.2; }",
      tailwindApproach:
        "text-[48px] font-[700] text-[#0a2540] leading-[1.2]",
    },
  ],
  rawCssVariables: {},
};

export const evalDataset: EvalCase[] = [
  // --- No design system (baseline) ---
  {
    input: {
      prompt: "A simple counter with increment and decrement buttons",
    },
    expected: {
      hasRadixImports: false,
      requiredElements: ["button"],
    },
    metadata: { category: "basic-interactivity", difficulty: "easy" },
  },
  {
    input: {
      prompt:
        "A user profile card with avatar, name, role, and a follow button",
    },
    expected: {
      hasRadixImports: false,
      requiredElements: ["button"],
    },
    metadata: { category: "layout", difficulty: "easy" },
  },
  {
    input: {
      prompt: "A modal dialog with a form that has name and email fields",
    },
    expected: {
      hasRadixImports: true,
      requiredElements: ["button", "input"],
    },
    metadata: { category: "radix-primitives", difficulty: "medium" },
  },
  {
    input: {
      prompt:
        "A dropdown menu with options: Edit, Duplicate, Archive, and Delete",
    },
    expected: {
      hasRadixImports: true,
      requiredElements: ["button"],
    },
    metadata: { category: "radix-primitives", difficulty: "medium" },
  },
  {
    input: {
      prompt:
        "A pricing table with 3 tiers: Free, Pro ($10/mo), Enterprise ($50/mo) — each with features list and a CTA button",
    },
    expected: {
      hasRadixImports: false,
      requiredElements: ["button"],
    },
    metadata: { category: "layout", difficulty: "medium" },
  },

  // --- With design system ---
  {
    input: {
      prompt: "A simple call-to-action button",
      designSystem: stripeDesignSystem,
    },
    expected: {
      hasRadixImports: false,
      requiredElements: ["button"],
      requiredClasses: [
        "bg-[#635bff]",
        "rounded-[12px]",
        "text-[#ffffff]",
        "font-[600]",
      ],
    },
    metadata: { category: "design-system-conformance", difficulty: "easy" },
  },
  {
    input: {
      prompt:
        "A pricing card with title, price, feature list, and a CTA button",
      designSystem: stripeDesignSystem,
    },
    expected: {
      hasRadixImports: false,
      requiredElements: ["button"],
      requiredClasses: [
        "bg-[#635bff]",
        "rounded-[12px]",
        "rounded-[8px]",
      ],
    },
    metadata: { category: "design-system-conformance", difficulty: "medium" },
  },
  {
    input: {
      prompt: "A login form with email, password, and submit button",
      designSystem: stripeDesignSystem,
    },
    expected: {
      hasRadixImports: false,
      requiredElements: ["button", "input"],
      requiredClasses: ["bg-[#635bff]", "rounded-[12px]"],
    },
    metadata: { category: "design-system-conformance", difficulty: "medium" },
  },
  {
    input: {
      prompt:
        "A dialog modal that opens from a trigger button, containing a confirmation message and action buttons",
      designSystem: stripeDesignSystem,
    },
    expected: {
      hasRadixImports: true,
      requiredElements: ["button"],
      requiredClasses: ["bg-[#635bff]", "rounded-[12px]"],
    },
    metadata: { category: "design-system-with-radix", difficulty: "hard" },
  },
  {
    input: {
      prompt:
        "A notification toast with an icon, message text, and a dismiss button",
      designSystem: stripeDesignSystem,
    },
    expected: {
      hasRadixImports: true,
      requiredElements: ["button"],
      requiredClasses: ["bg-[#635bff]", "text-[#0a2540]"],
    },
    metadata: { category: "design-system-with-radix", difficulty: "hard" },
  },
];
