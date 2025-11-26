import { useState, useEffect } from "react";
import { X, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

type UnitSystem = "imperial" | "metric";

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
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
  const [isSaving, setIsSaving] = useState(false);

  // Conversion functions
  const lbsToKg = (lbs: number) => lbs * 0.453592;
  const kgToLbs = (kg: number) => kg / 0.453592;
  const inchesToCm = (inches: number) => inches * 2.54;
  const cmToInches = (cm: number) => cm / 2.54;

  // Calculate BMI
  const calculateBMI = (): number | null => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    
    if (!weightNum || !heightNum || weightNum <= 0 || heightNum <= 0) {
      return null;
    }

    // Convert to metric for BMI calculation (kg and meters)
    const weightKg = unitSystem === "imperial" ? lbsToKg(weightNum) : weightNum;
    const heightM = unitSystem === "imperial" ? inchesToCm(heightNum) / 100 : heightNum / 100;
    
    return weightKg / (heightM * heightM);
  };

  const getBMICategory = (bmi: number): { label: string; color: string } => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-accent" };
    if (bmi < 25) return { label: "Normal", color: "text-secondary" };
    if (bmi < 30) return { label: "Overweight", color: "text-primary" };
    return { label: "Obese", color: "text-destructive" };
  };

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  const toggleUnits = () => {
    const newSystem: UnitSystem = unitSystem === "imperial" ? "metric" : "imperial";
    
    // Convert weight
    if (weight) {
      const weightNum = parseFloat(weight);
      if (unitSystem === "imperial") {
        setWeight(lbsToKg(weightNum).toFixed(1));
      } else {
        setWeight(kgToLbs(weightNum).toFixed(1));
      }
    }
    
    // Convert height
    if (height) {
      const heightNum = parseFloat(height);
      if (unitSystem === "imperial") {
        setHeight(inchesToCm(heightNum).toFixed(1));
      } else {
        setHeight(cmToInches(heightNum).toFixed(1));
      }
    }
    
    setUnitSystem(newSystem);
  };

  useEffect(() => {
    setUserName(currentName);
    setAge(currentAge?.toString() || "");
    setWeight(currentWeight?.toString() || "");
    setHeight(currentHeight?.toString() || "");
    setGender(currentGender || "");
    setActivityLevel(currentActivityLevel || "");
    setUnitSystem("imperial"); // Reset to imperial on open
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
      // Convert to imperial (lbs and inches) for storage
      let weightToSave = weight ? parseFloat(weight) : null;
      let heightToSave = height ? parseFloat(height) : null;

      if (unitSystem === "metric") {
        if (weightToSave) weightToSave = kgToLbs(weightToSave);
        if (heightToSave) heightToSave = cmToInches(heightToSave);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          user_name: userName,
          user_age: age ? parseInt(age) : null,
          user_weight: weightToSave,
          user_height: heightToSave,
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleUnits}
              className="text-xs"
            >
              <Scale className="w-3 h-3 mr-1" />
              {unitSystem === "imperial" ? "Imperial" : "Metric"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto h-[calc(80vh-140px)] pb-4">
          {/* BMI Display */}
          {bmi && (
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Body Mass Index</p>
                  <p className="text-2xl font-semibold text-secondary">{bmi.toFixed(1)}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn("text-sm", bmiCategory?.color)}
                >
                  {bmiCategory?.label}
                </Badge>
              </div>
            </div>
          )}

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
              <Label htmlFor="weight" className="text-foreground">
                Weight ({unitSystem === "imperial" ? "lbs" : "kg"})
              </Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-2"
                placeholder={unitSystem === "imperial" ? "Weight in lbs" : "Weight in kg"}
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <Label htmlFor="height" className="text-foreground">
                Height ({unitSystem === "imperial" ? "inches" : "cm"})
              </Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="mt-2"
                placeholder={unitSystem === "imperial" ? "Height in inches" : "Height in cm"}
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
