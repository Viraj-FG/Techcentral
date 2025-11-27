import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export const DatabaseInspector = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profilesRes, petsRes, inventoryRes] = await Promise.all([
        supabase.from("profiles").select("*").limit(10),
        supabase.from("pets").select("*").limit(10),
        supabase.from("inventory").select("*").limit(10),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (petsRes.error) throw petsRes.error;
      if (inventoryRes.error) throw inventoryRes.error;

      setProfiles(profilesRes.data || []);
      setPets(petsRes.data || []);
      setInventory(inventoryRes.data || []);
    } catch (error) {
      console.error("Load data error:", error);
      toast({
        title: "Load Failed",
        description: "Failed to load database data",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Inspector</CardTitle>
        <CardDescription>View recent data from all tables</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profiles">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1">
            <TabsTrigger value="profiles">Profiles ({profiles.length})</TabsTrigger>
            <TabsTrigger value="pets">Pets ({pets.length})</TabsTrigger>
            <TabsTrigger value="inventory">Inventory ({inventory.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-4">
            <ScrollArea className="h-[400px]">
              {profiles.map((profile) => (
                <div key={profile.id} className="mb-4 p-3 sm:p-4 rounded-lg border bg-card">
                  <pre className="text-[10px] sm:text-xs overflow-x-auto">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pets" className="space-y-4">
            <ScrollArea className="h-[400px]">
              {pets.map((pet) => (
                <div key={pet.id} className="mb-4 p-3 sm:p-4 rounded-lg border bg-card">
                  <pre className="text-[10px] sm:text-xs overflow-x-auto">
                    {JSON.stringify(pet, null, 2)}
                  </pre>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <ScrollArea className="h-[400px]">
              {inventory.map((item) => (
                <div key={item.id} className="mb-4 p-3 sm:p-4 rounded-lg border bg-card">
                  <pre className="text-[10px] sm:text-xs overflow-x-auto">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};