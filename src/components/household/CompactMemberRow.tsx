import { ChevronRight } from "lucide-react";
import { MemberAvatarCircle } from "./MemberAvatarCircle";

interface CompactMemberRowProps {
  member: {
    id: string;
    name?: string;
    allergies?: string[];
    dietaryRestrictions?: string[];
    healthConditions?: string[];
  };
  onClick: () => void;
}

export const CompactMemberRow = ({ member, onClick }: CompactMemberRowProps) => {
  const allergyCount = member.allergies?.length || 0;
  const restrictionCount = member.dietaryRestrictions?.length || 0;
  const conditionCount = member.healthConditions?.length || 0;

  const subtitleParts: string[] = [];
  if (allergyCount > 0) subtitleParts.push(`${allergyCount} ${allergyCount === 1 ? 'allergy' : 'allergies'}`);
  if (restrictionCount > 0) subtitleParts.push(`${restrictionCount} ${restrictionCount === 1 ? 'restriction' : 'restrictions'}`);
  if (conditionCount > 0) subtitleParts.push(`${conditionCount} ${conditionCount === 1 ? 'condition' : 'conditions'}`);

  const subtitle = subtitleParts.length > 0 
    ? subtitleParts.join(' • ') 
    : 'No dietary restrictions';

  return (
    <button
      onClick={onClick}
      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-secondary/5 transition-colors text-left"
    >
      <MemberAvatarCircle name={member.name || 'Unknown'} size="md" />
      
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-secondary truncate">
          {member.name || 'Unknown Member'}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {subtitle}
        </p>
      </div>
      
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
};
