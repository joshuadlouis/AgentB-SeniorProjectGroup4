import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { SHUTTLE_ROUTES } from "@/data/shuttleData";

export type ShuttlePreferences = Record<string, boolean>;

const STORAGE_KEY = "shuttle-route-preferences";

export function loadShuttlePreferences(): ShuttlePreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return Object.fromEntries(SHUTTLE_ROUTES.map((r) => [r.id, true]));
}

export function saveShuttlePreferences(prefs: ShuttlePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function isAnyShuttleFilterActive(prefs: ShuttlePreferences): boolean {
  return Object.values(prefs).some((v) => !v);
}

interface Props {
  preferences: ShuttlePreferences;
  onChange: (prefs: ShuttlePreferences) => void;
}

export const ShuttleFilterDrawer = ({ preferences, onChange }: Props) => {
  const toggle = (id: string) => {
    const next = { ...preferences, [id]: !preferences[id] };
    onChange(next);
  };

  const allOn = Object.values(preferences).every(Boolean);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Settings className="w-4 h-4" />
          {isAnyShuttleFilterActive(preferences) && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-base">Shuttle Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <button
            onClick={() => {
              const val = !allOn;
              const next = Object.fromEntries(SHUTTLE_ROUTES.map((r) => [r.id, val]));
              onChange(next);
            }}
            className="text-xs text-primary hover:underline"
          >
            {allOn ? "Deselect All" : "Select All"}
          </button>

          {SHUTTLE_ROUTES.map((route) => (
            <div key={route.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full shrink-0"
                  style={{ backgroundColor: route.color }}
                />
                <span className="text-sm font-medium text-foreground">{route.name}</span>
              </div>
              <Switch
                checked={preferences[route.id] ?? true}
                onCheckedChange={() => toggle(route.id)}
              />
            </div>
          ))}

          <p className="text-[10px] text-muted-foreground pt-2">
            Filtered routes are hidden from the map and route list.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
