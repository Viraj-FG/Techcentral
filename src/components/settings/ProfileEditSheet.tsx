import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileEditSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentName: string;
  currentAge: number | null;
  currentWeight: number | null;
  currentHeight: number | null;
  currentGender: string;
  currentActivityLevel: string;
  onSave: () => void;
}

export const ProfileEditSheet = ({
  open,
  onClose,
  userId,
  currentName,
  currentAge,
  currentWeight,
  currentHeight,
  currentGender,
  currentActivityLevel,
  onSave,
}: ProfileEditSheetProps) => {
  const { toast } = useToast();
  const [userName, setUserName] = useState(currentName);
  const [age, setAge] = useState<string>(currentAge?.toString() || "");
  const [weight, setWeight] = useState<string>(currentWeight?.toString() || "");
  const [height, setHeight] = useState<string>(currentHeight?.toString() || "");
  const [gender, setGender] = useState<string>(currentGender || "");
  const [activityLevel, setActivityLevel] = useState<string>(currentActivityLevel || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUserName(currentName);
    setAge(currentAge?.toString() || "");
    setWeight(currentWeight?.toString() || "");
    setHeight(currentHeight?.toString() || "");
    setGender(currentGender || "");
    setActivityLevel(currentActivityLevel || "");
  }, [currentName, currentAge, currentWeight, currentHeight, currentGender, currentActivityLevel]);

  const handleSave = async () => {
    if (!userName.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    // Validate numeric fields
    if (age && (parseInt(age) < 0 || parseInt(age) > 120)) {
      toast({
        title: "Error",
        description: "Age must be between 0 and 120",
        variant: "destructive",
      });
      return;
    }

    if (weight && parseFloat(weight) < 0) {
      toast({
        title: "Error",
        description: "Weight must be a positive number",
        variant: "destructive",
      });
      return;
    }

    if (height && parseFloat(height) < 0) {
      toast({
        title: "Error",
        description: "Height must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_name: userName,
          user_age: age ? parseInt(age) : null,
          user_weight: weight ? parseFloat(weight) : null,
          user_height: height ? parseFloat(height) : null,
          user_gender: gender || null,
          user_activity_level: activityLevel || null,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully",
      });
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-secondary/10 pb-4">
          <SheetTitle className="text-xl font-semibold text-secondary">Edit Profile</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto h-[calc(80vh-140px)] pb-4">
          <div>
            <Label htmlFor="userName" className="text-foreground">Full Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="mt-2"
              placeholder="Enter your name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age" className="text-foreground">Age</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-2"
                placeholder="Age"
                min="0"
                max="120"
              />
            </div>

            <div>
              <Label htmlFor="gender" className="text-foreground">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight" className="text-foreground">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-2"
                placeholder="Weight"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <Label htmlFor="height" className="text-foreground">Height (inches)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="mt-2"
                placeholder="Height"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="activityLevel" className="text-foreground">Activity Level</Label>
            <Select value={activityLevel} onValueChange={setActivityLevel}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                <SelectItem value="lightly_active">Lightly Active (1-3 days/week)</SelectItem>
                <SelectItem value="moderately_active">Moderately Active (3-5 days/week)</SelectItem>
                <SelectItem value="very_active">Very Active (6-7 days/week)</SelectItem>
                <SelectItem value="extremely_active">Extremely Active (athlete)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
