import { useState } from "react";
import { HouseholdMember } from "./HouseholdMemberCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface HouseholdMemberFormProps {
  initialData?: Partial<HouseholdMember>;
  onSubmit: (member: HouseholdMember) => void;
  onCancel: () => void;
}

const HouseholdMemberForm = ({ initialData, onSubmit, onCancel }: HouseholdMemberFormProps) => {
  const [formData, setFormData] = useState<Partial<HouseholdMember>>({
    type: initialData?.type || 'adult',
    name: initialData?.name || '',
    age: initialData?.age || undefined,
    ageGroup: initialData?.ageGroup || undefined,
    biometrics: initialData?.biometrics || {},
    allergies: initialData?.allergies || [],
    dietaryRestrictions: initialData?.dietaryRestrictions || [],
    healthConditions: initialData?.healthConditions || []
  });

  const [currentAllergy, setCurrentAllergy] = useState('');
  const [currentRestriction, setCurrentRestriction] = useState('');
  const [currentCondition, setCurrentCondition] = useState('');

  const addItem = (field: 'allergies' | 'dietaryRestrictions' | 'healthConditions', value: string) => {
    if (!value.trim()) return;
    const currentArray = formData[field] || [];
    if (!currentArray.includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }));
    }
  };

  const removeItem = (field: 'allergies' | 'dietaryRestrictions' | 'healthConditions', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(item => item !== value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Please enter a name');
      return;
    }
    onSubmit(formData as HouseholdMember);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-kaeva-sage">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-kaeva-sage/70">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Mom, Emma, Dad"
              className="bg-kaeva-void/50 border-kaeva-sage/20 text-kaeva-sage"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-kaeva-sage/70">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="bg-kaeva-void/50 border-kaeva-sage/20 text-kaeva-sage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-kaeva-void border-kaeva-sage/20">
                <SelectItem value="adult">Adult</SelectItem>
                <SelectItem value="elderly">Elderly</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="toddler">Toddler</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age" className="text-kaeva-sage/70">Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
              placeholder="e.g., 8"
              className="bg-kaeva-void/50 border-kaeva-sage/20 text-kaeva-sage"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ageGroup" className="text-kaeva-sage/70">Age Group</Label>
            <Select
              value={formData.ageGroup}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, ageGroup: value }))}
            >
              <SelectTrigger className="bg-kaeva-void/50 border-kaeva-sage/20 text-kaeva-sage">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-kaeva-void border-kaeva-sage/20">
                <SelectItem value="infant">Infant</SelectItem>
                <SelectItem value="toddler">Toddler</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="teen">Teen</SelectItem>
                <SelectItem value="adult">Adult</SelectItem>
                <SelectItem value="elderly">Elderly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Biometrics (Optional) */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-kaeva-sage">Biometrics (Optional)</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-kaeva-sage/70">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              value={formData.biometrics?.weight || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                biometrics: { ...prev.biometrics, weight: parseFloat(e.target.value) || undefined }
              }))}
              placeholder="e.g., 65"
              className="bg-kaeva-void/50 border-kaeva-sage/20 text-kaeva-sage"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height" className="text-kaeva-sage/70">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              value={formData.biometrics?.height || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                biometrics: { ...prev.biometrics, height: parseFloat(e.target.value) || undefined }
              }))}
              placeholder="e.g., 165"
              className="bg-kaeva-void/50 border-kaeva-sage/20 text-kaeva-sage"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gender" className="text-kaeva-sage/70">Gender</Label>
            <Select
              value={formData.biometrics?.gender}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                biometrics: { ...prev.biometrics, gender: value }
              }))}
            >
              <SelectTrigger className="bg-kaeva-void/50 border-kaeva-sage/20 text-kaeva-sage">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-kaeva-void border-kaeva-sage/20">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activityLevel" className="text-kaeva-sage/70">Activity Level</Label>
            <Select
              value={formData.biometrics?.activityLevel}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                biometrics: { ...prev.biometrics, activityLevel: value }
              }))}
            >
              <SelectTrigger className="bg-kaeva-void/50 border-kaeva-sage/20 text-kaeva-sage">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-kaeva-void border-kaeva-sage/20">
                <SelectItem value="sedentary">Sedentary</SelectItem>
                <SelectItem value="light">Lightly Active</SelectItem>
                <SelectItem value="moderate">Moderately Active</SelectItem>
                <SelectItem value="active">Very Active</SelectItem>
                <SelectItem value="very_active">Extremely Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Allergies */}
      <div className="space-y-3">
        <Label className="text-kaeva-sage/70">Allergies</Label>
        <div className="flex gap-2">
          <Input
            value={currentAllergy}
            onChange={(e) => setCurrentAllergy(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addItem('allergies', currentAllergy);
                setCurrentAllergy('');
              }
            }}
            placeholder="e.g., Peanuts, Dairy..."
            className="bg-kaeva-void/50 border-kaeva-sage/20 text-kaeva-sage"
          />
          <Button
            type="button"
            onClick={() => {
              addItem('allergies', currentAllergy);
              setCurrentAllergy('');
            }}
            variant="outline"
            className="border-kaeva-sage/20"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.allergies?.map((allergy, idx) => (
            <Badge key={idx} variant="destructive" className="gap-1">
              {allergy}
              <button
                type="button"
                onClick={() => removeItem('allergies', allergy)}
                className="hover:bg-destructive/20 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div className="space-y-3">
        <Label className="text-kaeva-sage/70">Dietary Restrictions</Label>
        <div className="flex gap-2">
          <Input
            value={currentRestriction}
            onChange={(e) => setCurrentRestriction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addItem('dietaryRestrictions', currentRestriction);
                setCurrentRestriction('');
              }
            }}
            placeholder="e.g., Vegan, Low Sodium..."
            className="bg-kaeva-void/50 border-kaeva-sage/20 text-kaeva-sage"
          />
          <Button
            type="button"
            onClick={() => {
              addItem('dietaryRestrictions', currentRestriction);
              setCurrentRestriction('');
            }}
            variant="outline"
            className="border-kaeva-sage/20"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.dietaryRestrictions?.map((restriction, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1">
              {restriction}
              <button
                type="button"
                onClick={() => removeItem('dietaryRestrictions', restriction)}
                className="hover:bg-secondary/20 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Health Conditions */}
      <div className="space-y-3">
        <Label className="text-kaeva-sage/70">Health Conditions</Label>
        <div className="flex gap-2">
          <Input
            value={currentCondition}
            onChange={(e) => setCurrentCondition(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addItem('healthConditions', currentCondition);
                setCurrentCondition('');
              }
            }}
            placeholder="e.g., Diabetes, Hypertension..."
            className="bg-kaeva-void/50 border-kaeva-sage/20 text-kaeva-sage"
          />
          <Button
            type="button"
            onClick={() => {
              addItem('healthConditions', currentCondition);
              setCurrentCondition('');
            }}
            variant="outline"
            className="border-kaeva-sage/20"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.healthConditions?.map((condition, idx) => (
            <Badge key={idx} className="gap-1 bg-kaeva-accent/20 text-kaeva-accent hover:bg-kaeva-accent/30">
              {condition}
              <button
                type="button"
                onClick={() => removeItem('healthConditions', condition)}
                className="hover:bg-kaeva-accent/20 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-kaeva-sage/20 text-kaeva-sage hover:bg-kaeva-sage/10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-kaeva-accent hover:bg-kaeva-accent/90 text-kaeva-void"
        >
          {initialData ? 'Update Member' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
};

export default HouseholdMemberForm;
