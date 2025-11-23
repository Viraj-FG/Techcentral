import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";

const ContextPreview = () => {
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchContext = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      // Fetch household
      const { data: household } = await supabase
        .from("household_members")
        .select("*")
        .eq("user_id", session.user.id);

      // Fetch pets
      const { data: pets } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", session.user.id);

      // Fetch inventory
      const { data: inventory } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", session.user.id)
        .order("last_activity_at", { ascending: false })
        .limit(20);

      // Fetch shopping list
      const { data: shoppingList } = await supabase
        .from("shopping_list")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "pending");

      setContext({
        profile,
        household,
        pets,
        inventory,
        shoppingList,
      });
    } catch (err) {
      console.error("Failed to fetch context:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  const buildContextPrompt = () => {
    if (!context) return "";

    const { profile, household, pets, inventory, shoppingList } = context;

    const allergies =
      profile?.allergies?.length > 0
        ? `Allergies: ${profile.allergies.join(", ")}`
        : "";
    const dietary =
      profile?.dietary_preferences?.length > 0
        ? profile.dietary_preferences.join(", ")
        : "";
    const shieldLine = [allergies, dietary].filter(Boolean).join(" | ") || "None";

    const householdSummary =
      household
        ?.map((m: any) => {
          const allergies = m.allergies?.length > 0 ? ` (${m.allergies.join(", ")})` : "";
          return `${m.name || m.member_type}${allergies}`;
        })
        .join(", ") || "None";

    const petsSummary =
      pets?.map((p: any) => `${p.name} (${p.species})`).join(", ") || "None";

    const inventorySummary =
      inventory?.slice(0, 5).map((i: any) => `${i.name} (${i.quantity || 0})`).join(", ") ||
      "No items";

    const cartCount = shoppingList?.length || 0;

    return `[USER CONTEXT]
Name: ${profile?.user_name || "User"}
TDEE Baseline: ${profile?.calculated_tdee || "Not calculated"} calories/day
Shield: ${shieldLine}
Tribe: ${householdSummary} | Pets: ${petsSummary}
Inventory Snapshot: ${inventorySummary}
Cart Status: ${cartCount} items pending
[END CONTEXT]`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Context Preview</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchContext}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="formatted">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="formatted">Formatted Prompt</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="formatted" className="mt-4">
            <pre className="p-4 bg-secondary rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
              {context ? buildContextPrompt() : "Loading..."}
            </pre>
          </TabsContent>
          <TabsContent value="raw" className="mt-4">
            <pre className="p-4 bg-secondary rounded-lg text-xs overflow-x-auto">
              {context ? JSON.stringify(context, null, 2) : "Loading..."}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContextPreview;
