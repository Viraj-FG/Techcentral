import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  Plus, 
  ArrowLeft,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HouseholdMember } from "@/components/HouseholdMemberCard";
import HouseholdMemberForm from "@/components/HouseholdMemberForm";
import UniversalShell from "@/components/layout/UniversalShell";
import { HeroHeaderBanner } from "@/components/household/HeroHeaderBanner";
import { CompactMemberRow } from "@/components/household/CompactMemberRow";
import { MemberDetailSheet } from "@/components/household/MemberDetailSheet";
import { HouseholdPreferencesSection } from "@/components/household/HouseholdPreferencesSection";

interface StoredHouseholdMember extends HouseholdMember {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const Household = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [members, setMembers] = useState<StoredHouseholdMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StoredHouseholdMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<StoredHouseholdMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<StoredHouseholdMember | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  useEffect(() => {
    fetchMembers();
    fetchUserProfile();
    
    const channel = supabase
      .channel('household-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members'
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    setUserProfile(data);
  };

  const fetchMembers = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('household_members')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching household members:', error);
      toast({
        title: "Error",
        description: "Failed to load household members",
        variant: "destructive"
      });
    } else {
      const formattedMembers: StoredHouseholdMember[] = (data || []).map(member => ({
        id: member.id,
        user_id: member.user_id,
        type: member.member_type as 'adult' | 'child' | 'elderly' | 'toddler',
        name: member.name || undefined,
        ageGroup: member.age_group as 'infant' | 'toddler' | 'child' | 'teen' | 'adult' | 'elderly' | undefined,
        age: member.age || undefined,
        biometrics: {
          weight: member.weight || undefined,
          height: member.height || undefined,
          gender: member.gender || undefined,
          activityLevel: member.activity_level || undefined,
        },
        allergies: Array.isArray(member.allergies) ? member.allergies.map(a => String(a)) : [],
        dietaryRestrictions: Array.isArray(member.dietary_restrictions) ? member.dietary_restrictions.map(d => String(d)) : [],
        healthConditions: Array.isArray(member.health_conditions) ? member.health_conditions.map(h => String(h)) : [],
        created_at: member.created_at,
        updated_at: member.updated_at
      }));
      setMembers(formattedMembers);
    }
    setIsLoading(false);
  };

  const handleAddMember = async (member: HouseholdMember) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from('household_members')
      .insert({
        user_id: session.user.id,
        member_type: member.type,
        name: member.name || null,
        age: member.age || null,
        age_group: member.ageGroup || null,
        weight: member.biometrics?.weight || null,
        height: member.biometrics?.height || null,
        gender: member.biometrics?.gender || null,
        activity_level: member.biometrics?.activityLevel || null,
        dietary_restrictions: member.dietaryRestrictions || [],
        allergies: member.allergies || [],
        health_conditions: member.healthConditions || []
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add household member",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `${member.name || 'Member'} added to your household`,
      });
      setIsAddDialogOpen(false);
      fetchMembers();
    }
  };

  const handleUpdateMember = async (member: HouseholdMember) => {
    if (!editingMember) return;

    const { error } = await supabase
      .from('household_members')
      .update({
        member_type: member.type,
        name: member.name || null,
        age: member.age || null,
        age_group: member.ageGroup || null,
        weight: member.biometrics?.weight || null,
        height: member.biometrics?.height || null,
        gender: member.biometrics?.gender || null,
        activity_level: member.biometrics?.activityLevel || null,
        dietary_restrictions: member.dietaryRestrictions || [],
        allergies: member.allergies || [],
        health_conditions: member.healthConditions || []
      })
      .eq('id', editingMember.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update household member",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `${member.name || 'Member'} updated successfully`,
      });
      setEditingMember(null);
      fetchMembers();
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;

    const { error } = await supabase
      .from('household_members')
      .delete()
      .eq('id', deletingMember.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete household member",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `${deletingMember.name || 'Member'} removed from household`,
      });
      setDeletingMember(null);
      fetchMembers();
    }
  };

  const generateInviteLink = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    if (!userProfile?.current_household_id) {
      toast({
        title: "Error",
        description: "No household found. Please create a household first.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingInvite(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("create-household-invite", {
        body: {
          household_id: userProfile.current_household_id,
          expires_in_hours: 24,
          max_uses: 5,
        },
      });

      if (error) throw error;

      if (data?.invite_url) {
        await navigator.clipboard.writeText(data.invite_url);
        
        toast({
          title: "Invite Link Created",
          description: "Link copied to clipboard. Share it with household members!",
        });
      }
    } catch (err: any) {
      console.error("Error creating invite:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create invite link",
        variant: "destructive",
      });
    } finally {
      setIsCreatingInvite(false);
    }
  };

  return (
    <UniversalShell>
      {/* Simplified Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-secondary/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app')}
            className="hover:bg-secondary/10"
          >
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </Button>
          <h1 className="text-lg font-medium text-secondary">Household</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-32">
        
        {/* Hero Header Banner */}
        <HeroHeaderBanner />

        {/* MEMBERS Section */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Members
          </h2>
          {isLoading ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="text-secondary/50 animate-pulse">Loading members...</div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl overflow-hidden divide-y divide-secondary/10">
              {members.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-secondary/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No household members yet</p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-secondary/20"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Member
                  </Button>
                </div>
              ) : (
                <>
                  {members.map((member) => (
                    <CompactMemberRow
                      key={member.id}
                      member={member}
                      onClick={() => setSelectedMember(member)}
                    />
                  ))}
                  
                  {/* Add New Member Row */}
                  <button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-secondary/5 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-base font-medium text-primary">Add New Member</p>
                      <p className="text-sm text-muted-foreground">
                        You have {members.length} {members.length === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* PREFERENCES Section */}
        <HouseholdPreferencesSection
          householdId={userProfile?.current_household_id}
          onGenerateInvite={generateInviteLink}
          isCreatingInvite={isCreatingInvite}
        />

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-3xl border border-accent/20"
        >
          <h3 className="text-lg font-medium text-secondary mb-2">
            Why add household members?
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Get personalized safety alerts for each family member's allergies and conditions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Filter products and recipes based on everyone's dietary needs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Track nutrition goals customized for each person's activity level and health</span>
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Member Detail Sheet */}
      <MemberDetailSheet
        member={selectedMember}
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        onEdit={(member) => {
          setEditingMember(member as StoredHouseholdMember);
          setSelectedMember(null);
        }}
        onDelete={(member) => {
          setDeletingMember(member as StoredHouseholdMember);
          setSelectedMember(null);
        }}
      />

      {/* Add/Edit Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-background border-secondary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-secondary">Add Household Member</DialogTitle>
            <DialogDescription className="text-secondary/70">
              Create a detailed profile for your family member
            </DialogDescription>
          </DialogHeader>
          <HouseholdMemberForm
            onSubmit={handleAddMember}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-2xl bg-background border-secondary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-secondary">Edit Household Member</DialogTitle>
            <DialogDescription className="text-secondary/70">
              Update {editingMember?.name || 'this member'}'s profile
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <HouseholdMemberForm
              initialData={editingMember}
              onSubmit={handleUpdateMember}
              onCancel={() => setEditingMember(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <AlertDialogContent className="bg-background border-secondary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-secondary">Delete Household Member</AlertDialogTitle>
            <AlertDialogDescription className="text-secondary/70">
              Are you sure you want to remove {deletingMember?.name || 'this member'} from your household? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-secondary/20">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive hover:bg-destructive/90 text-background"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UniversalShell>
  );
};

export default Household;
