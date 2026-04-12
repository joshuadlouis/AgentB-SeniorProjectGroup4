import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, MapPin, Clock, Utensils, ExternalLink, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface MealPeriod { name: string; hours: string; }
interface DiningLocation {
  name: string; urlKey: string; address: string;
  latitude: number; longitude: number; description: string;
  imageUrl: string; todayHours: string; isOpen: boolean;
  mealPeriods: MealPeriod[];
}

/* ── Locations Tab ────────────────────────────────── */

function LocationsTab() {
  const [locations, setLocations] = useState<DiningLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("dining-scrape");
        if (fnError) throw fnError;
        if (!cancelled) setLocations(data?.locations ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = filter === "open" ? locations.filter((l) => l.isOpen) : locations;

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({locations.length})</TabsTrigger>
          <TabsTrigger value="open">Open Now ({locations.filter((l) => l.isOpen).length})</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="mt-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading dining locations…</span>
            </div>
          )}
          {error && (
            <div className="text-center py-8 text-destructive">
              <p className="font-medium">Unable to load dining info</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              {filter === "open" ? "No dining locations are currently open." : "No dining locations found."}
            </p>
          )}
          {!loading && !error && filtered.map((loc) => (
            <Card key={loc.name} className="overflow-hidden border-border">
              <div className="flex flex-col sm:flex-row">
                {loc.imageUrl && (
                  <div className="sm:w-40 sm:min-h-[140px] flex-shrink-0">
                    <img src={loc.imageUrl} alt={loc.name} className="w-full h-36 sm:h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="p-4 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground leading-tight">{loc.name}</h3>
                    <Badge variant={loc.isOpen ? "default" : "secondary"} className={loc.isOpen ? "bg-green-600 hover:bg-green-700 text-white shrink-0" : "shrink-0"}>
                      {loc.isOpen ? "OPEN" : "CLOSED"}
                    </Badge>
                  </div>
                  {loc.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{loc.address}</p>}
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3 shrink-0" />Today: {loc.todayHours}</p>
                  {loc.description && (
                    <p
                      className="text-xs text-muted-foreground whitespace-pre-line"
                      dangerouslySetInnerHTML={{
                        __html: loc.description
                          .replace(/&eacute;/g, "é")
                          .replace(/&amp;/g, "&")
                          .replace(/\n/g, "<br/>")
                      }}
                    />
                  )}
                  {["bethune-annex-cafe", "blackburn-cafe"].includes(loc.urlKey) && (
                    <a href={`https://howard.mydininghub.com/en/locations/${loc.urlKey}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                      View Today's Menu <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Link helper ──────────────────────────────────── */

const ExtLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium">
    {children} <ExternalLink className="h-3 w-3" />
  </a>
);

/* ── Main Page ────────────────────────────────────── */

export default function DiningPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Howard University Dining
            </h1>
            <p className="text-xs text-muted-foreground">Meal plans, menus, hours &amp; more</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Overview */}
        <Card className="p-5 border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our meal plans were created with you in mind! Enjoy the convenience of dining on and off campus, with flexibility to fit your schedule and lifestyle.
          </p>
          <div className="mt-3">
            <ExtLink href="https://howard.mydininghub.com/en">Visit Howard Dining Hub</ExtLink>
          </div>
        </Card>

        {/* Accordion sections */}
        <Accordion type="multiple" className="space-y-2">

          {/* Dining Locations (live data) */}
          <AccordionItem value="locations" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold text-foreground">Dining Locations &amp; Hours</AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <LocationsTab />
            </AccordionContent>
          </AccordionItem>

          {/* Meal Plans */}
          <AccordionItem value="meal-plans" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold text-foreground">Meal Plans</AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">Enjoy the perks — super convenient, smart savings, and budget with ease!</p>

              <div className="grid gap-3">
                <Card className="p-4 border-border">
                  <h4 className="font-semibold text-foreground text-sm">On-Campus Residents</h4>
                  <p className="text-xs text-muted-foreground mt-1">Living on campus is better with convenient, delicious dining options! Enjoy freshly prepared meals, grab-and-go snacks, and a variety of choices just steps away.</p>
                  <div className="mt-2">
                    <ExtLink href="https://howard.mydininghub.com/en/meal-plans/meal-plan-options?cat=on-campusresidents-216949">View On-Campus Plans</ExtLink>
                  </div>
                </Card>

                <Card className="p-4 border-border">
                  <h4 className="font-semibold text-foreground text-sm">Off-Campus Residents</h4>
                  <p className="text-xs text-muted-foreground mt-1">Make campus dining your go-to, even if you live off-campus! Enjoy fresh meals between classes, study sessions, or workouts — no cooking needed.</p>
                  <div className="mt-2">
                    <ExtLink href="https://howard.mydininghub.com/en/meal-plans/meal-plan-options?cat=off-campusresidents-216952">View Off-Campus Plans</ExtLink>
                  </div>
                </Card>

                <Card className="p-4 border-border">
                  <h4 className="font-semibold text-foreground text-sm">3rd &amp; 4th Year Students Living On-Campus</h4>
                  <p className="text-xs text-muted-foreground mt-1">Living on campus is better with convenient, delicious dining options! Enjoy freshly prepared meals, grab-and-go snacks, and a variety of choices just steps away.</p>
                  <div className="mt-2">
                    <ExtLink href="https://howard.mydininghub.com/en/meal-plans/meal-plan-options?cat=thirdyearandfourthyearstudentslivingon-campus-216955">View Plans</ExtLink>
                  </div>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Dining Dollars */}
          <AccordionItem value="dining-dollars" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold text-foreground">Dining Dollars</AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3">
              <p className="text-sm text-muted-foreground">Make dining easier with Dining Dollars! Use them at on-campus dining locations for meals, snacks, and drinks.</p>
              <Card className="p-4 border-border">
                <h4 className="font-semibold text-foreground text-sm">Dining Dollars Only Plan</h4>
                <p className="text-xs text-muted-foreground mt-1">Designed for students with kitchens or those living off-campus. Provides $1,280.00 in Dining Dollars per semester. Unused Dining Dollars will not roll over to the next semester.</p>
                <div className="mt-2">
                  <ExtLink href="https://howard.mydininghub.com/en/meal-plans/meal-plan-options?cat=diningdollars-216958">View Dining Dollar Plans</ExtLink>
                </div>
              </Card>
              <p className="text-xs text-muted-foreground">
                <ExtLink href="https://howard.mydininghub.com/en/terms-and-conditions">Review Terms &amp; Conditions</ExtLink>
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Dining Rewards */}
          <AccordionItem value="rewards" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold text-foreground">Sign Up to Get Rewarded!</AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-2">
              <p className="text-sm text-muted-foreground">Love dining with us? Enjoy tasty rewards and stay in the loop on promotions, insider perks, dining program news, and exciting events.</p>
              <ExtLink href="https://howard.mydininghub.com/en/meal-plans/dining-rewards">View Dining Rewards</ExtLink>
            </AccordionContent>
          </AccordionItem>

          {/* Getting Started */}
          <AccordionItem value="getting-started" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold text-foreground">Getting Started With a Meal Plan</AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-2">
              <p className="text-sm text-muted-foreground">Make the most of your meal plan with the tips and tools to help you manage.</p>
              <ExtLink href="https://howard.mydininghub.com/en/meal-plans/meal-plans-101">Meal Plans 101</ExtLink>
            </AccordionContent>
          </AccordionItem>

          {/* Check Balance */}
          <AccordionItem value="check-balance" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold text-foreground">Check Balance</AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-2">
              <p className="text-sm text-muted-foreground">Already have a meal plan? Check before you chow — learn how to check your balance and set alerts.</p>
              <ExtLink href="https://howard.mydininghub.com/en/meal-plans/check-your-balance">Check Your Balance</ExtLink>
            </AccordionContent>
          </AccordionItem>

          {/* Catering */}
          <AccordionItem value="catering" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold text-foreground">Catering</AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3">
              <p className="text-sm text-muted-foreground">Our catering services offer gourmet cuisine, flexible options, and impeccable service, ensuring that every event is not just catered — it's completely personalized.</p>
              <div className="mt-1">
                <ExtLink href="https://howard.catertrax.com/">View Menus &amp; Start Your Order</ExtLink>
              </div>
              <Card className="p-4 border-border space-y-2">
                <h4 className="font-semibold text-foreground text-sm">Contact Catering</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">Dominique Venson</span> — Catering Director<br/>
                    <a href="mailto:venson-dominique@aramark.com" className="text-primary hover:underline">venson-dominique@aramark.com</a> · <a href="tel:2029384681" className="text-primary hover:underline">202-938-4681</a>
                  </p>
                  <p><span className="font-medium text-foreground">Gabrielle Rocker</span> — Catering Operations Manager<br/>
                    <a href="mailto:rocker-gabrielle@aramark.com" className="text-primary hover:underline">rocker-gabrielle@aramark.com</a>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">All catering orders should be placed 14 business days prior to your event when possible.</p>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* About */}
          <AccordionItem value="about" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold text-foreground">Get To Know Howard University Hospitality Services</AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3">
              <p className="text-sm text-muted-foreground">We make it our mission to elevate every aspect of your campus dining experience, making you feel right at home from your very first visit to graduation day.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="p-3 border-border">
                  <h4 className="font-semibold text-foreground text-xs">Artisan Cooking, Every Day</h4>
                  <p className="text-xs text-muted-foreground mt-1">Every meal is thoughtfully prepared by skilled chefs, using quality ingredients to bring bold authentic flavors.</p>
                </Card>
                <Card className="p-3 border-border">
                  <h4 className="font-semibold text-foreground text-xs">Global Flavors, Local Favorites</h4>
                  <p className="text-xs text-muted-foreground mt-1">From internationally inspired dishes to craveable classics, menus that celebrate culture and taste.</p>
                </Card>
                <Card className="p-3 border-border">
                  <h4 className="font-semibold text-foreground text-xs">Fuel To Fit Your Day</h4>
                  <p className="text-xs text-muted-foreground mt-1">With customizable plans and convenient locations, we make dining easy wherever your day takes you.</p>
                </Card>
                <Card className="p-3 border-border">
                  <h4 className="font-semibold text-foreground text-xs">Sustainability Starts With Us</h4>
                  <p className="text-xs text-muted-foreground mt-1">Through active responsibility, building a greener future for our campus community.</p>
                </Card>
              </div>
              <ExtLink href="https://howard.mydininghub.com/en/about-us/sustainability">Learn About Sustainability</ExtLink>
            </AccordionContent>
          </AccordionItem>

          {/* Job Opportunities */}
          <AccordionItem value="jobs" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold text-foreground">Job Opportunities</AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-2">
              <p className="text-sm text-muted-foreground">Looking to pursue your potential? Explore job opportunities to develop professional skills, contribute to campus life, and advance your career.</p>
              <ExtLink href="https://howard.mydininghub.com/en/about-us/careers">View Job Opportunities</ExtLink>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </div>
  );
}
