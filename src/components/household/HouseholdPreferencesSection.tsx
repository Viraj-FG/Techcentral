import { useState, useEffect } from "react";
import { Share2, ChevronRight, Loader2, Home, Users, Bell, BellOff, Edit2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HouseholdPreferencesSectionProps {
  householdId?: string | null;
  onGenerateInvite: () => void;
  isCreatingInvite?: boolean;
}

interface HouseholdMembership {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    user_name: string | null;
  } | null;
}

export const HouseholdPreferencesSection = ({
  householdId,
  onGenerateInvite,
  isCreatingInvite = false,
}: HouseholdPreferencesSectionProps) => {
  const { toast } = useToast();
  const [householdName, setHouseholdName] = useState<string>("");
  const [isOwner, setIsOwner] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [safetyAlertsEnabled, setSafetyAlertsEnabled] = useState(true);
  
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isRolesSheetOpen, setIsRolesSheetOpen] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [memberships, setMemberships] = useState<HouseholdMembership[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (householdId) {
      fetchHouseholdData();
      fetchMemberships();
    }
  }, [householdId]);

  const fetchHouseholdData = async () => {
    if (!householdId) return;

    const { data: household } = await supabase
      .from('households')
      .select('name, owner_id')
      .eq('id', householdId)
      .single();

    if (household) {
      setHouseholdName(household.name);
      setNewHouseholdName(household.name);
      
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(household.owner_id === user?.id);
    }
  };

  const fetchMemberships = async () => {
    if (!householdId) return;

    const { data } = await supabase
      .from('household_memberships')
      .select(`
        id,
        user_id,
        role,
        profiles:user_id (
          user_name
        )
      `)
      .eq('household_id', householdId);

    if (data) {
      setMemberships(data as any);
    }
  };

  const handleSaveHouseholdName = async () => {
    if (!householdId || !newHouseholdName.trim()) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('households')
      .update({ name: newHouseholdName.trim() })
      .eq('id', householdId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update household name",
        variant: "destructive",
      });
    } else {
      setHouseholdName(newHouseholdName.trim());
      setIsEditNameOpen(false);
      toast({
        title: "Success",
        description: "Household name updated",
      });
    }
    setIsSaving(false);
  };

  const handleRoleChange = async (membershipId: string, newRole: string) => {
    const { error } = await supabase
      .from('household_memberships')
      .update({ role: newRole })
      .eq('id', membershipId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Member role updated",
      });
      fetchMemberships();
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    toast({
      title: enabled ? "Notifications Enabled" : "Notifications Disabled",
      description: enabled ? "You'll receive household updates" : "Household notifications muted",
    });
  };

  const handleSafetyAlertsToggle = async (enabled: boolean) => {
    setSafetyAlertsEnabled(enabled);
    toast({
      title: enabled ? "Safety Alerts On" : "Safety Alerts Off",
      description: enabled ? "You'll be alerted about allergens and toxins" : "Safety alerts disabled",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'admin':
        return 'bg-accent/20 text-accent border-accent/30';
      default:
        return 'bg-secondary/20 text-secondary border-secondary/30';
    }
  };

  return (
    <section>
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Preferences
      </h2>
      <div className="glass-card rounded-3xl overflow-hidden divide-y divide-secondary/10">
        
        {/* Household Name Row */}
        <button
          onClick={() => setIsEditNameOpen(true)}
          className="w-full px-6 py-4 flex items-center gap-4 hover:bg-secondary/5 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <Home className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-secondary">Household Name</p>
            <p className="text-sm text-muted-foreground truncate">
              {householdName || "Not set"}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </button>

        {/* Member Roles Row */}
        {isOwner && (
          <button
            onClick={() => setIsRolesSheetOpen(true)}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-secondary/5 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-secondary">Member Roles</p>
              <p className="text-sm text-muted-foreground">
                Manage permissions for {memberships.length} {memberships.length === 1 ? 'member' : 'members'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </button>
        )}

        {/* Notifications Toggle Row */}
        <div className="w-full px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-secondary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-secondary">Household Notifications</p>
            <p className="text-sm text-muted-foreground">
              {notificationsEnabled ? 'Get updates on household activity' : 'Notifications muted'}
            </p>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={handleNotificationToggle}
            className="flex-shrink-0"
          />
        </div>

        {/* Safety Alerts Toggle Row */}
        <div className="w-full px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-secondary">Safety Alerts</p>
            <p className="text-sm text-muted-foreground">
              {safetyAlertsEnabled ? 'Alert on allergens and toxins' : 'Safety alerts off'}
            </p>
          </div>
          <Switch
            checked={safetyAlertsEnabled}
            onCheckedChange={handleSafetyAlertsToggle}
            className="flex-shrink-0"
          />
        </div>

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

      {/* Edit Household Name Dialog */}
      <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
        <DialogContent className="bg-background border-secondary/20">
          <DialogHeader>
            <DialogTitle className="text-secondary">Edit Household Name</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Give your household a memorable name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="household-name" className="text-secondary">Household Name</Label>
              <Input
                id="household-name"
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                placeholder="e.g., The Smith Family"
                className="border-secondary/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditNameOpen(false)}
              className="border-secondary/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveHouseholdName}
              disabled={isSaving || !newHouseholdName.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Roles Sheet */}
      <Sheet open={isRolesSheetOpen} onOpenChange={setIsRolesSheetOpen}>
        <SheetContent className="bg-background border-secondary/20 w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-secondary">Member Roles</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Manage permissions for household members
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {memberships.map((membership) => (
              <div key={membership.id} className="glass-card p-4 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-secondary">
                      {membership.profiles?.user_name || 'Unknown User'}
                    </p>
                    <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(membership.role)}`}>
                      {membership.role}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Role</Label>
                  <Select
                    value={membership.role}
                    onValueChange={(newRole) => handleRoleChange(membership.id, newRole)}
                  >
                    <SelectTrigger className="border-secondary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {membership.role === 'owner' && "Full control over household"}
                  {membership.role === 'admin' && "Can manage members and settings"}
                  {membership.role === 'member' && "Can view and edit household data"}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};
