import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import KaevaAperture from "./KaevaAperture";

interface HouseholdSetupProps {
  onComplete: (householdId: string) => void;
}

const HouseholdSetup = ({ onComplete }: HouseholdSetupProps) => {
  const [householdName, setHouseholdName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createHousehold = async (name: string) => {
    setIsCreating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Get user's name for default household name
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_name')
        .eq('id', user.id)
        .single();

      const finalName = name || `${profile?.user_name || 'My'} Household`;

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          owner_id: user.id,
          name: finalName
        })
        .select()
        .single();

      if (householdError) throw householdError;

      // Update profile with household_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_household_id: household.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Household created",
        description: `Welcome to ${finalName}!`,
      });

      onComplete(household.id);
    } catch (error) {
      console.error("Error creating household:", error);
      toast({
        title: "Error",
        description: "Failed to create household. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <KaevaAperture size="lg" state="idle" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">One More Thing...</h1>
          <p className="text-muted-foreground">
            Let's set up your household to organize your inventory and recipes.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="household-name">Household Name</Label>
            <Input
              id="household-name"
              type="text"
              placeholder="e.g., Smith Family, My Home"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => createHousehold(householdName)}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Household"}
            </Button>

            <Button
              onClick={() => createHousehold("")}
              disabled={isCreating}
              variant="ghost"
              className="w-full"
            >
              Use Default Name
            </Button>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          You can invite family members and manage your household later from Settings.
        </p>
      </div>
    </motion.div>
  );
};

export default HouseholdSetup;
