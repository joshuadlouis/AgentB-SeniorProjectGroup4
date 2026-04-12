import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { WMATA_LINE_COLORS } from "@/components/PublicTransit";

const WMATA_LINES = [
  { code: "RD", name: "Red Line" },
  { code: "OR", name: "Orange Line" },
  { code: "BL", name: "Blue Line" },
  { code: "SV", name: "Silver Line" },
  { code: "GR", name: "Green Line" },
  { code: "YL", name: "Yellow Line" },
] as const;

export type LinePreferences = Record<string, boolean>;

const STORAGE_KEY = "wmata-line-preferences";

export function loadLinePreferences(): LinePreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return Object.fromEntries(WMATA_LINES.map((l) => [l.code, true]));
}

export function saveLinePreferences(prefs: LinePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function isAnyFilterActive(prefs: LinePreferences): boolean {
  return Object.values(prefs).some((v) => !v);
}

interface Props {
  preferences: LinePreferences;
  onChange: (prefs: LinePreferences) => void;
}

export const LineFilterDrawer = ({ preferences, onChange }: Props) => {
  const toggle = (code: string) => {
    const next = { ...preferences, [code]: !preferences[code] };
    onChange(next);
  };

  const allOn = Object.values(preferences).every(Boolean);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Settings className="w-4 h-4" />
          {isAnyFilterActive(preferences) && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-base">Line Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <button
            onClick={() => {
              const val = !allOn;
              const next = Object.fromEntries(WMATA_LINES.map((l) => [l.code, val]));
              onChange(next);
            }}
            className="text-xs text-primary hover:underline"
          >
            {allOn ? "Deselect All" : "Select All"}
          </button>

          {WMATA_LINES.map((line) => (
            <div key={line.code} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: WMATA_LINE_COLORS[line.code] }}
                >
                  <span className="text-[9px] font-bold text-white">{line.code.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{line.name}</span>
              </div>
              <Switch
                checked={preferences[line.code] ?? true}
                onCheckedChange={() => toggle(line.code)}
              />
            </div>
          ))}

          <p className="text-[10px] text-muted-foreground pt-2">
            Filtered lines are hidden from station list and predictions. Multi-line stations remain visible if at least one active line serves them.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
