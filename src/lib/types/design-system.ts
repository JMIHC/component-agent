export interface DesignSystem {
  url: string;
  extractedAt: string;
  screenshotBase64: string;
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
    background: string[];
    text: string[];
    border: string[];
  };
  typography: {
    fontFamilies: string[];
    fontSizes: string[];
    fontWeights: number[];
    lineHeights: string[];
  };
  spacing: string[];
  borderRadii: string[];
  shadows: string[];
  componentPatterns: {
    name: string;
    element: string;
    description: string;
    styles: Record<string, string>;
    cssApproach: string;
    tailwindApproach: string;
  }[];
  rawCssVariables: Record<string, string>;
}
