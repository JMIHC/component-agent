export interface DesignSystem {
  name: string;
  components: string[];
  exampleComponent: string;
  importPath: string;
}

export type DesignSystemKey = "none" | "8bitcn";

export const DESIGN_SYSTEMS: Record<DesignSystemKey, DesignSystem | null> = {
  none: null,
  "8bitcn": {
    name: "8bitcn",
    importPath: "@/components/ui/8bit",
    components: [
      "Button",
      "Card", "CardHeader", "CardFooter", "CardTitle", "CardAction", "CardDescription", "CardContent",
      "Badge",
      "Input",
      "Select", "SelectContent", "SelectGroup", "SelectItem", "SelectLabel", "SelectTrigger", "SelectValue",
      "Tabs", "TabsList", "TabsContent", "TabsTrigger",
      "Label",
      "Dialog", "DialogTrigger", "DialogHeader", "DialogFooter", "DialogDescription", "DialogTitle", "DialogContent", "DialogClose",
      "Checkbox",
    ],
    exampleComponent: `import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/8bit";
import { Button } from "@/components/ui/8bit";
import { Badge } from "@/components/ui/8bit";

export default function ProfileCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player One</CardTitle>
        <CardDescription>Level 42 Wizard</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Badge>Online</Badge>
        <Button>Follow</Button>
      </CardContent>
    </Card>
  );
}`,
  },
};
