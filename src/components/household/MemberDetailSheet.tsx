import { Edit, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MemberAvatarCircle } from "./MemberAvatarCircle";
import { HouseholdMember } from "@/components/HouseholdMemberCard";

interface MemberDetailSheetProps {
  member: (HouseholdMember & { id: string }) | null;
  open: boolean;
  onClose: () => void;
  onEdit: (member: HouseholdMember & { id: string }) => void;
  onDelete: (member: HouseholdMember & { id: string }) => void;
}

export const MemberDetailSheet = ({
  member,
  open,
  onClose,
  onEdit,
  onDelete,
}: MemberDetailSheetProps) => {
  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] sm:h-auto sm:max-w-[500px] bg-background border-secondary/20 overflow-y-auto"
      >
        <SheetHeader className="space-y-4 pb-6 border-b border-secondary/10">
          <div className="flex flex-col items-center gap-4 pt-4">
            <MemberAvatarCircle name={member.name || 'Unknown'} size="lg" />
            <div className="text-center">
              <SheetTitle className="text-2xl text-secondary">
                {member.name || 'Unknown Member'}
              </SheetTitle>
              {member.age && (
                <p className="text-sm text-muted-foreground mt-1">
                  Age {member.age}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Biometrics Section */}
          {member.biometrics && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Biometrics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {member.biometrics.weight && (
                  <div className="glass-card p-3 rounded-xl">
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="text-base font-medium text-secondary">{member.biometrics.weight} lbs</p>
                  </div>
                )}
                {member.biometrics.height && (
                  <div className="glass-card p-3 rounded-xl">
                    <p className="text-xs text-muted-foreground">Height</p>
                    <p className="text-base font-medium text-secondary">{member.biometrics.height} in</p>
                  </div>
                )}
                {member.biometrics.gender && (
                  <div className="glass-card p-3 rounded-xl">
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="text-base font-medium text-secondary capitalize">{member.biometrics.gender}</p>
                  </div>
                )}
                {member.biometrics.activityLevel && (
                  <div className="glass-card p-3 rounded-xl">
                    <p className="text-xs text-muted-foreground">Activity</p>
                    <p className="text-base font-medium text-secondary capitalize">{member.biometrics.activityLevel}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dietary Restrictions */}
          {member.dietaryRestrictions && member.dietaryRestrictions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Dietary Restrictions
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.dietaryRestrictions.map((restriction, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm rounded-full bg-secondary/10 text-secondary"
                  >
                    {restriction}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergies */}
          {member.allergies && member.allergies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Allergies
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.allergies.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm rounded-full bg-destructive/20 text-destructive flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Health Conditions */}
          {member.healthConditions && member.healthConditions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Health Conditions
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.healthConditions.map((condition, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm rounded-full bg-accent/20 text-accent"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-6 border-t border-secondary/10">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-secondary/20 hover:bg-accent/10"
            onClick={() => {
              onEdit(member);
              onClose();
            }}
          >
            <Edit className="w-4 h-4" />
            Edit Member
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-destructive/20 hover:bg-destructive/10 text-destructive"
            onClick={() => {
              onDelete(member);
              onClose();
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
