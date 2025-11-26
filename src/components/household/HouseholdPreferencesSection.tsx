import { Share2, ChevronRight, Loader2 } from "lucide-react";

interface HouseholdPreferencesSectionProps {
  householdId?: string | null;
  onGenerateInvite: () => void;
  isCreatingInvite?: boolean;
}

export const HouseholdPreferencesSection = ({
  householdId,
  onGenerateInvite,
  isCreatingInvite = false,
}: HouseholdPreferencesSectionProps) => {
  return (
    <section>
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Preferences
      </h2>
      <div className="glass-card rounded-3xl overflow-hidden divide-y divide-secondary/10">
        
        {/* Invite Members Row */}
        <button
          onClick={onGenerateInvite}
          disabled={!householdId || isCreatingInvite}
          className="w-full px-6 py-4 flex items-center gap-4 hover:bg-secondary/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {isCreatingInvite ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <Share2 className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-secondary">Invite Members</p>
            <p className="text-sm text-muted-foreground">
              {isCreatingInvite ? 'Generating link...' : 'Share household access with others'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </button>

      </div>
    </section>
  );
};
