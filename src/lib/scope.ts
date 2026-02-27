"use client";
import React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Avatar from "@radix-ui/react-avatar";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as HoverCard from "@radix-ui/react-hover-card";
import * as Label from "@radix-ui/react-label";
import * as Menubar from "@radix-ui/react-menubar";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as Popover from "@radix-ui/react-popover";
import * as Progress from "@radix-ui/react-progress";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Select from "@radix-ui/react-select";
import * as Separator from "@radix-ui/react-separator";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";
import * as Tabs from "@radix-ui/react-tabs";
import * as Toast from "@radix-ui/react-toast";
import * as Toggle from "@radix-ui/react-toggle";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import * as Toolbar from "@radix-ui/react-toolbar";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as LucideReact from "lucide-react";
import * as clsxMod from "clsx";
import * as cvaMod from "class-variance-authority";
import * as twMergeMod from "tailwind-merge";

// 8bitcn components
import { Button as BitButton } from "@/components/ui/8bit/button";
import { Card as BitCard, CardHeader as BitCardHeader, CardFooter as BitCardFooter, CardTitle as BitCardTitle, CardAction as BitCardAction, CardDescription as BitCardDescription, CardContent as BitCardContent } from "@/components/ui/8bit/card";
import { Badge as BitBadge } from "@/components/ui/8bit/badge";
import { Input as BitInput } from "@/components/ui/8bit/input";
import { Select as BitSelect, SelectContent as BitSelectContent, SelectGroup as BitSelectGroup, SelectItem as BitSelectItem, SelectLabel as BitSelectLabel, SelectTrigger as BitSelectTrigger, SelectValue as BitSelectValue } from "@/components/ui/8bit/select";
import { Tabs as BitTabs, TabsList as BitTabsList, TabsContent as BitTabsContent, TabsTrigger as BitTabsTrigger } from "@/components/ui/8bit/tabs";
import { Label as BitLabel } from "@/components/ui/8bit/label";
import { Dialog as BitDialog, DialogTrigger as BitDialogTrigger, DialogHeader as BitDialogHeader, DialogFooter as BitDialogFooter, DialogDescription as BitDialogDescription, DialogTitle as BitDialogTitle, DialogContent as BitDialogContent, DialogClose as BitDialogClose } from "@/components/ui/8bit/dialog";
import { Checkbox as BitCheckbox } from "@/components/ui/8bit/checkbox";

// cn utility — frequently used in AI-generated components
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(...inputs));

// Portal replacement — renders children inline instead of portaling to document.body,
// so content stays inside the react-live preview container.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const InlinePortal = ({ children, container, ...props }: any) =>
  React.createElement(React.Fragment, null, children);

// Build Radix modules with Portal overridden to inline rendering
function withInlinePortal(mod: Record<string, unknown>) {
  return { ...mod, Portal: InlinePortal };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PACKAGE_REGISTRY: Record<string, any> = {
  "react": { ...React, default: React },
  "@radix-ui/react-accordion": Accordion,
  "@radix-ui/react-alert-dialog": withInlinePortal(AlertDialog as unknown as Record<string, unknown>),
  "@radix-ui/react-avatar": Avatar,
  "@radix-ui/react-checkbox": Checkbox,
  "@radix-ui/react-collapsible": Collapsible,
  "@radix-ui/react-context-menu": withInlinePortal(ContextMenu as unknown as Record<string, unknown>),
  "@radix-ui/react-dialog": withInlinePortal(Dialog as unknown as Record<string, unknown>),
  "@radix-ui/react-dropdown-menu": withInlinePortal(DropdownMenu as unknown as Record<string, unknown>),
  "@radix-ui/react-hover-card": withInlinePortal(HoverCard as unknown as Record<string, unknown>),
  "@radix-ui/react-label": Label,
  "@radix-ui/react-menubar": withInlinePortal(Menubar as unknown as Record<string, unknown>),
  "@radix-ui/react-navigation-menu": withInlinePortal(NavigationMenu as unknown as Record<string, unknown>),
  "@radix-ui/react-popover": withInlinePortal(Popover as unknown as Record<string, unknown>),
  "@radix-ui/react-progress": Progress,
  "@radix-ui/react-radio-group": RadioGroup,
  "@radix-ui/react-scroll-area": ScrollArea,
  "@radix-ui/react-select": withInlinePortal(Select as unknown as Record<string, unknown>),
  "@radix-ui/react-separator": Separator,
  "@radix-ui/react-slider": Slider,
  "@radix-ui/react-switch": Switch,
  "@radix-ui/react-tabs": Tabs,
  "@radix-ui/react-toast": withInlinePortal(Toast as unknown as Record<string, unknown>),
  "@radix-ui/react-toggle": Toggle,
  "@radix-ui/react-toggle-group": ToggleGroup,
  "@radix-ui/react-toolbar": Toolbar,
  "@radix-ui/react-tooltip": withInlinePortal(Tooltip as unknown as Record<string, unknown>),
  "lucide-react": LucideReact,
  "clsx": clsxMod,
  "class-variance-authority": cvaMod,
  "tailwind-merge": twMergeMod,
  // Local path aliases that AI may generate
  "@/lib/utils": { cn, default: { cn } },
  // 8bitcn design system components
  "@/components/ui/8bit": {
    Button: BitButton,
    Card: BitCard, CardHeader: BitCardHeader, CardFooter: BitCardFooter,
    CardTitle: BitCardTitle, CardAction: BitCardAction,
    CardDescription: BitCardDescription, CardContent: BitCardContent,
    Badge: BitBadge,
    Input: BitInput,
    Select: BitSelect, SelectContent: BitSelectContent, SelectGroup: BitSelectGroup,
    SelectItem: BitSelectItem, SelectLabel: BitSelectLabel,
    SelectTrigger: BitSelectTrigger, SelectValue: BitSelectValue,
    Tabs: BitTabs, TabsList: BitTabsList, TabsContent: BitTabsContent, TabsTrigger: BitTabsTrigger,
    Label: BitLabel,
    Dialog: BitDialog, DialogTrigger: BitDialogTrigger, DialogHeader: BitDialogHeader,
    DialogFooter: BitDialogFooter, DialogDescription: BitDialogDescription,
    DialogTitle: BitDialogTitle, DialogContent: BitDialogContent, DialogClose: BitDialogClose,
    Checkbox: BitCheckbox,
  },
};

/**
 * Prepares raw generated component code for react-live:
 * - Strips 'use client' and import type lines
 * - Resolves imports into a scope object from PACKAGE_REGISTRY
 * - Strips export default
 * - Appends render(<ComponentName />) for noInline mode
 */
export function prepareCode(
  rawCode: string,
  componentName: string
): { code: string; scope: Record<string, unknown> } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scope: Record<string, any> = { React };

  let code = rawCode;

  // Strip 'use client' / 'use server' directives
  code = code.replace(/^\s*['"]use (client|server)['"]\s*;?\s*$/gm, "");

  // Strip import type lines (no runtime value)
  code = code.replace(/^import\s+type\s+.*$/gm, "");

  // Collect all import lines (handling multi-line imports)
  const lines = code.split("\n");
  const codeLines: string[] = [];
  let importBuffer = "";
  let inImport = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (inImport) {
      importBuffer += " " + trimmed;
      if (trimmed.includes("from ")) {
        parseImport(importBuffer, scope);
        importBuffer = "";
        inImport = false;
      }
      continue;
    }

    if (trimmed.startsWith("import ") && !trimmed.startsWith("import type ")) {
      if (trimmed.includes("from ")) {
        parseImport(trimmed, scope);
      } else {
        // Multi-line import — start buffering
        importBuffer = trimmed;
        inImport = true;
      }
      continue;
    }

    codeLines.push(line);
  }

  code = codeLines.join("\n");

  // Strip all export keywords (sucrase's imports transform would convert
  // leftover exports to CJS which references undefined `exports` object)
  code = code
    .replace(/export\s+default\s+function\s+/, "function ")
    .replace(/export\s+default\s+class\s+/, "class ")
    .replace(/export\s+default\s+\w+\s*;?\s*$/m, "")
    .replace(/^export\s+(?=(?:function|class|const|let|var)\s)/gm, "");

  // Append render call for noInline mode
  code = code.trimEnd() + `\n\nrender(<${componentName} />);\n`;

  return { code, scope };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseImport(line: string, scope: Record<string, any>) {
  // Extract the package name from `from 'pkg'` or `from "pkg"`
  const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
  if (!fromMatch) return;
  const pkg = fromMatch[1];

  const mod = PACKAGE_REGISTRY[pkg];
  if (!mod) {
    // Unknown package — provide HTML-element fallbacks so the component
    // still renders instead of crashing with ReferenceError.
    resolveUnknownImport(line, scope);
    return;
  }

  // Remove the `from '...'` part to isolate the binding portion
  const bindingPart = line.replace(/^import\s+/, "").replace(/\s*from\s+['"][^'"]+['"].*$/, "").trim();

  // import * as X from 'pkg'
  const starMatch = bindingPart.match(/^\*\s+as\s+(\w+)$/);
  if (starMatch) {
    scope[starMatch[1]] = mod;
    return;
  }

  // Could be: `Default`, `Default, { A, B }`, `{ A, B }`, `{ A as C, B }`
  let rest = bindingPart;

  // Check for default import (identifier before any `{`)
  const defaultMatch = rest.match(/^(\w+)\s*,?\s*/);
  if (defaultMatch && !rest.startsWith("{")) {
    scope[defaultMatch[1]] = mod.default ?? mod;
    rest = rest.slice(defaultMatch[0].length);
  }

  // Named imports: { A, B as C, D }
  const namedMatch = rest.match(/\{([^}]+)\}/);
  if (namedMatch) {
    const specifiers = namedMatch[1].split(",").map(s => s.trim()).filter(Boolean);
    for (const spec of specifiers) {
      const parts = spec.split(/\s+as\s+/);
      const imported = parts[0].trim();
      const local = (parts[1] ?? parts[0]).trim();
      if (mod[imported] !== undefined) {
        scope[local] = mod[imported];
      }
    }
  }
}

// Map common component names to native HTML elements
const HTML_TAG_MAP: Record<string, string> = {
  Button: "button", Input: "input", Label: "label", Select: "select",
  Textarea: "textarea", Form: "form", Card: "div", Badge: "span",
  Avatar: "span", Separator: "hr", Table: "table", Dialog: "div",
  Sheet: "div", Popover: "div", Tooltip: "span", Alert: "div",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fallbackComponent(name: string) {
  const tag = HTML_TAG_MAP[name] || "div";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp = React.forwardRef((props: any, ref: any) => {
    // Filter out non-HTML props that would cause React warnings
    const { variant, size, asChild, ...htmlProps } = props;
    return React.createElement(tag, { ...htmlProps, ref });
  });
  Comp.displayName = name;
  return Comp;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveUnknownImport(line: string, scope: Record<string, any>) {
  const bindingPart = line.replace(/^import\s+/, "").replace(/\s*from\s+['"][^'"]+['"].*$/, "").trim();

  // import * as X — provide a Proxy that returns fallback components
  const starMatch = bindingPart.match(/^\*\s+as\s+(\w+)$/);
  if (starMatch) {
    scope[starMatch[1]] = new Proxy({}, {
      get: (_target, prop: string) => fallbackComponent(prop),
    });
    return;
  }

  let rest = bindingPart;

  // Default import
  const defaultMatch = rest.match(/^(\w+)\s*,?\s*/);
  if (defaultMatch && !rest.startsWith("{")) {
    scope[defaultMatch[1]] = fallbackComponent(defaultMatch[1]);
    rest = rest.slice(defaultMatch[0].length);
  }

  // Named imports
  const namedMatch = rest.match(/\{([^}]+)\}/);
  if (namedMatch) {
    const specifiers = namedMatch[1].split(",").map(s => s.trim()).filter(Boolean);
    for (const spec of specifiers) {
      const parts = spec.split(/\s+as\s+/);
      const local = (parts[1] ?? parts[0]).trim();
      scope[local] = fallbackComponent(local);
    }
  }
}
