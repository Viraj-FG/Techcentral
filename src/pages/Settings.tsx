import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, Shield, Users, Heart, Clock, Sparkles, PawPrint, 
  ArrowLeft, Save, Leaf, ShieldAlert, Home 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuroraBackground from "@/components/AuroraBackground";
import ConversationHistory from "@/components/ConversationHistory";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

const profileSchema = z.object({
  userName: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  dietaryValues: z.string().max(500, "Dietary values must be less than 500 characters"),
  allergies: z.string().max(500, "Allergies must be less than 500 characters"),
  skinType: z.string().max(50, "Skin type must be less than 50 characters"),
  hairType: z.string().max(50, "Hair type must be less than 50 characters"),
  householdAdults: z.number().min(0).max(20),
  householdKids: z.number().min(0).max(20),
  householdDogs: z.number().min(0).max(20),
  householdCats: z.number().min(0).max(20),
  petDetails: z.string().max(500, "Pet details must be less than 500 characters"),
  healthGoals: z.string().max(1000, "Health goals must be less than 1000 characters"),
  lifestyleGoals: z.string().max(1000, "Lifestyle goals must be less than 1000 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      userName: "",
      dietaryValues: "",
      allergies: "",
      skinType: "",
      hairType: "",
      householdAdults: 0,
      householdKids: 0,
      householdDogs: 0,
      householdCats: 0,
      petDetails: "",
      healthGoals: "",
      lifestyleGoals: "",
    }
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/auth');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const beautyProfile = profile.beauty_profile as { skinType?: string; hairType?: string } | null;
          reset({
            userName: profile.user_name || "",
            dietaryValues: Array.isArray(profile.dietary_preferences) 
              ? profile.dietary_preferences.join(", ") 
              : "",
            allergies: Array.isArray(profile.allergies) 
              ? profile.allergies.join(", ") 
              : "",
            skinType: beautyProfile?.skinType || "",
            hairType: beautyProfile?.hairType || "",
            householdAdults: profile.household_adults || 0,
            householdKids: profile.household_kids || 0,
            householdDogs: 0, // TODO: Fetch from pets table
            householdCats: 0, // TODO: Fetch from pets table
            petDetails: "",
            healthGoals: Array.isArray(profile.health_goals) 
              ? profile.health_goals.join(", ") 
              : "",
            lifestyleGoals: Array.isArray(profile.lifestyle_goals) 
              ? profile.lifestyle_goals.join(", ") 
              : "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        navigate('/');
      }
    };

    loadProfile();
  }, [reset, navigate]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          user_name: data.userName,
          dietary_preferences: data.dietaryValues
            .split(",")
            .map(v => v.trim())
            .filter(v => v.length > 0),
          allergies: data.allergies
            .split(",")
            .map(v => v.trim())
            .filter(v => v.length > 0),
          beauty_profile: {
            skinType: data.skinType || null,
            hairType: data.hairType || null,
          },
          household_adults: data.householdAdults,
          household_kids: data.householdKids,
          health_goals: data.healthGoals
            .split(",")
            .map(v => v.trim())
            .filter(v => v.length > 0),
          lifestyle_goals: data.lifestyleGoals
            .split(",")
            .map(v => v.trim())
            .filter(v => v.length > 0),
        })
        .eq('id', session.user.id);

      if (error) {
        throw error;
      }
      
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully",
      });

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-kaeva-seattle-slate overflow-y-auto">
      <AuroraBackground vertical="food" />
      
      <div className="relative z-10 p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={kaevaTransition}
          className="max-w-4xl mx-auto pb-16"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/')}
                variant="glass"
                size="icon"
              >
                <ArrowLeft size={20} strokeWidth={1.5} />
              </Button>
              <div>
                <h1 className="text-display text-3xl text-white">SETTINGS</h1>
                <p className="text-body text-white/60 mt-1">Manage your digital twin profile</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="glass"
              size="icon"
            >
              <Home size={20} strokeWidth={1.5} />
            </Button>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 glass-card">
                <TabsTrigger value="personal" className="text-micro">Personal</TabsTrigger>
                <TabsTrigger value="food" className="text-micro">Food</TabsTrigger>
                <TabsTrigger value="beauty" className="text-micro">Beauty</TabsTrigger>
                <TabsTrigger value="household" className="text-micro">Household</TabsTrigger>
                <TabsTrigger value="goals" className="text-micro">Goals</TabsTrigger>
                <TabsTrigger value="history" className="text-micro">History</TabsTrigger>
              </TabsList>

              {/* Personal Tab */}
              <TabsContent value="personal">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={kaevaTransition}
                  className="glass-card p-6 space-y-6"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <User className="text-kaeva-sage" size={24} strokeWidth={1.5} />
                    <h2 className="text-display text-xl text-white">PERSONAL INFORMATION</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="userName" className="text-white/90 text-micro">Full Name</Label>
                      <Input
                        id="userName"
                        {...register("userName")}
                        className="mt-2"
                        placeholder="Enter your name"
                      />
                      {errors.userName && (
                        <p className="text-destructive text-micro mt-1">{errors.userName.message}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Food Tab */}
              <TabsContent value="food">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 space-y-6"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <Leaf className="text-emerald-400" size={24} strokeWidth={1.5} />
                    <h2 className="text-xl font-light tracking-wider text-white">The Palate</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dietaryValues" className="text-white/90">Dietary Values</Label>
                      <Input
                        id="dietaryValues"
                        {...register("dietaryValues")}
                        className="mt-2 bg-white/5 border-white/10 text-white"
                        placeholder="e.g., Vegan, Halal, Kosher (comma-separated)"
                      />
                      {errors.dietaryValues && (
                        <p className="text-red-400 text-sm mt-1">{errors.dietaryValues.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="allergies" className="text-white/90">Food Allergies</Label>
                      <Input
                        id="allergies"
                        {...register("allergies")}
                        className="mt-2 bg-white/5 border-white/10 text-white"
                        placeholder="e.g., Nuts, Gluten, Dairy (comma-separated)"
                      />
                      {errors.allergies && (
                        <p className="text-red-400 text-sm mt-1">{errors.allergies.message}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Beauty Tab */}
              <TabsContent value="beauty">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 space-y-6"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <Sparkles className="text-orange-400" size={24} strokeWidth={1.5} />
                    <h2 className="text-xl font-light tracking-wider text-white">The Mirror</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="skinType" className="text-white/90">Skin Type</Label>
                      <Input
                        id="skinType"
                        {...register("skinType")}
                        className="mt-2 bg-white/5 border-white/10 text-white"
                        placeholder="e.g., Dry, Oily, Combination, Sensitive"
                      />
                      {errors.skinType && (
                        <p className="text-red-400 text-sm mt-1">{errors.skinType.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="hairType" className="text-white/90">Hair Type</Label>
                      <Input
                        id="hairType"
                        {...register("hairType")}
                        className="mt-2 bg-white/5 border-white/10 text-white"
                        placeholder="e.g., Straight, Wavy, Curly, Coily"
                      />
                      {errors.hairType && (
                        <p className="text-red-400 text-sm mt-1">{errors.hairType.message}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Household Tab */}
              <TabsContent value="household">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 space-y-6"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <Users className="text-emerald-400" size={24} strokeWidth={1.5} />
                    <h2 className="text-xl font-light tracking-wider text-white">The Tribe</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="householdAdults" className="text-white/90">Adults</Label>
                      <Input
                        id="householdAdults"
                        type="number"
                        {...register("householdAdults", { valueAsNumber: true })}
                        className="mt-2 bg-white/5 border-white/10 text-white"
                        min="0"
                      />
                      {errors.householdAdults && (
                        <p className="text-red-400 text-sm mt-1">{errors.householdAdults.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="householdKids" className="text-white/90">Kids</Label>
                      <Input
                        id="householdKids"
                        type="number"
                        {...register("householdKids", { valueAsNumber: true })}
                        className="mt-2 bg-white/5 border-white/10 text-white"
                        min="0"
                      />
                      {errors.householdKids && (
                        <p className="text-red-400 text-sm mt-1">{errors.householdKids.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="householdDogs" className="text-white/90">Dogs</Label>
                      <Input
                        id="householdDogs"
                        type="number"
                        {...register("householdDogs", { valueAsNumber: true })}
                        className="mt-2 bg-white/5 border-white/10 text-white"
                        min="0"
                      />
                      {errors.householdDogs && (
                        <p className="text-red-400 text-sm mt-1">{errors.householdDogs.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="householdCats" className="text-white/90">Cats</Label>
                      <Input
                        id="householdCats"
                        type="number"
                        {...register("householdCats", { valueAsNumber: true })}
                        className="mt-2 bg-white/5 border-white/10 text-white"
                        min="0"
                      />
                      {errors.householdCats && (
                        <p className="text-red-400 text-sm mt-1">{errors.householdCats.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="petDetails" className="text-white/90 flex items-center gap-2">
                      <PawPrint className="w-4 h-4 text-sky-400" />
                      Pet Details
                    </Label>
                    <Input
                      id="petDetails"
                      {...register("petDetails")}
                      className="mt-2 bg-white/5 border-white/10 text-white"
                      placeholder="e.g., Golden Retriever (age 3), Two cats"
                    />
                    {errors.petDetails && (
                      <p className="text-red-400 text-sm mt-1">{errors.petDetails.message}</p>
                    )}
                  </div>
                </motion.div>
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 space-y-6"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <Heart className="text-emerald-400" size={24} strokeWidth={1.5} />
                    <h2 className="text-xl font-light tracking-wider text-white">The Mission</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="healthGoals" className="text-white/90">Health Goals</Label>
                      <Input
                        id="healthGoals"
                        {...register("healthGoals")}
                        className="mt-2 bg-white/5 border-white/10 text-white"
                        placeholder="e.g., Weight Loss, Muscle Gain, Heart Health (comma-separated)"
                      />
                      {errors.healthGoals && (
                        <p className="text-red-400 text-sm mt-1">{errors.healthGoals.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="lifestyleGoals" className="text-white/90">Lifestyle Goals</Label>
                      <Input
                        id="lifestyleGoals"
                        {...register("lifestyleGoals")}
                        className="mt-2 bg-white/5 border-white/10 text-white"
                        placeholder="e.g., Meal Prep Efficiency, Self-Care Routine (comma-separated)"
                      />
                      {errors.lifestyleGoals && (
                        <p className="text-red-400 text-sm mt-1">{errors.lifestyleGoals.message}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6"
                >
                  <ConversationHistory />
                </motion.div>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={kaevaTransition}
              className="mt-6 flex flex-col sm:flex-row gap-3"
            >
              <Button
                type="submit"
                disabled={isSaving}
                variant="primary"
                className="flex-1 py-6 shadow-lg shadow-kaeva-sage/20"
              >
                {isSaving ? (
                  <>
                    <Save size={20} strokeWidth={1.5} className="mr-2 animate-pulse" />
                    <span className="text-micro">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} strokeWidth={1.5} className="mr-2" />
                    <span className="text-micro">Save Changes</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => navigate('/')}
                variant="glass"
                className="flex-1 sm:flex-none"
              >
                <span className="text-micro">Cancel</span>
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
