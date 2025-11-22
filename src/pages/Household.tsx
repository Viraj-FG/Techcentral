import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Users, 
  Share2, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Copy,
  Check,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import HouseholdMemberCard from "@/components/HouseholdMemberCard";
import { HouseholdMember } from "@/components/HouseholdMemberCard";
import HouseholdMemberForm from "@/components/HouseholdMemberForm";

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
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch household members
  useEffect(() => {
    fetchMembers();
    fetchUserProfile();
    
    // Set up realtime subscription
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
    
    // Generate invite link with user's household ID
    const baseUrl = window.location.origin;
    const inviteCode = btoa(`${session.user.id}:${Date.now()}`); // Simple encoding, should use proper tokens in production
    const inviteLink = `${baseUrl}/household/join?code=${inviteCode}`;
    
    navigator.clipboard.writeText(inviteLink);
    setInviteLinkCopied(true);
    
    toast({
      title: "Invite Link Copied",
      description: "Share this link with household members to give them access",
    });

    setTimeout(() => setInviteLinkCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-kaeva-void">
      {/* Header */}
      <div className="border-b border-kaeva-sage/10 bg-kaeva-void/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="hover:bg-kaeva-sage/10"
              >
                <ArrowLeft className="w-5 h-5 text-kaeva-sage" />
              </Button>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-kaeva-accent" />
                <h1 className="text-2xl font-light text-kaeva-sage">Household Roster</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={generateInviteLink}
                className="gap-2 border-kaeva-sage/20 hover:bg-kaeva-accent/10"
              >
                {inviteLinkCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Invite Link
                  </>
                )}
              </Button>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-kaeva-accent hover:bg-kaeva-accent/90 text-kaeva-void">
                    <Plus className="w-4 h-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl bg-kaeva-void border-kaeva-sage/20 max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-kaeva-sage">Add Household Member</DialogTitle>
                    <DialogDescription className="text-kaeva-sage/70">
                      Create a detailed profile for your family member
                    </DialogDescription>
                  </DialogHeader>
                  <HouseholdMemberForm
                    onSubmit={handleAddMember}
                    onCancel={() => setIsAddDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Summary */}
        {userProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-2xl mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">👤</div>
              <div>
                <h3 className="text-xl font-medium text-kaeva-sage">
                  {userProfile.user_name || 'You'} (Primary User)
                </h3>
                {userProfile.calculated_tdee && (
                  <p className="text-sm text-kaeva-sage/70">
                    Baseline: {userProfile.calculated_tdee} cal/day
                    {userProfile.user_age && ` • Age ${userProfile.user_age}`}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {Array.isArray(userProfile.dietary_preferences) && userProfile.dietary_preferences.map((pref: string, idx: number) => (
                <span key={idx} className="text-xs px-3 py-1 rounded-full bg-kaeva-sage/10 text-kaeva-sage/70">
                  {pref}
                </span>
              ))}
              {Array.isArray(userProfile.allergies) && userProfile.allergies.map((allergy: string, idx: number) => (
                <span key={idx} className="text-xs px-3 py-1 rounded-full bg-destructive/20 text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {allergy}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Household Members */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-kaeva-sage/50 animate-pulse">Loading household members...</div>
          </div>
        ) : members.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 rounded-2xl text-center"
          >
            <Users className="w-16 h-16 text-kaeva-sage/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-kaeva-sage mb-2">No Household Members Yet</h3>
            <p className="text-kaeva-sage/70 mb-6 max-w-md mx-auto">
              Add family members to enable personalized safety alerts, dietary filtering, and precise nutritional recommendations for everyone.
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2 bg-kaeva-accent hover:bg-kaeva-accent/90 text-kaeva-void"
            >
              <Plus className="w-4 h-4" />
              Add Your First Member
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className="glass-card p-6 rounded-2xl hover:bg-kaeva-sage/5 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <HouseholdMemberCard member={member} index={index} />
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dialog open={editingMember?.id === member.id} onOpenChange={(open) => !open && setEditingMember(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingMember(member)}
                              className="hover:bg-kaeva-accent/20"
                            >
                              <Edit className="w-4 h-4 text-kaeva-sage" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl bg-kaeva-void border-kaeva-sage/20 max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-kaeva-sage">Edit Household Member</DialogTitle>
                              <DialogDescription className="text-kaeva-sage/70">
                                Update {member.name || 'this member'}'s profile
                              </DialogDescription>
                            </DialogHeader>
                            <HouseholdMemberForm
                              initialData={member}
                              onSubmit={handleUpdateMember}
                              onCancel={() => setEditingMember(null)}
                            />
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingMember(member)}
                          className="hover:bg-destructive/20"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass-card p-6 rounded-2xl border-2 border-kaeva-accent/20"
        >
          <h3 className="text-lg font-medium text-kaeva-sage mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-kaeva-accent" />
            Why Add Household Members?
          </h3>
          <ul className="space-y-2 text-sm text-kaeva-sage/70">
            <li className="flex items-start gap-2">
              <span className="text-kaeva-accent mt-0.5">•</span>
              <span><strong>Safety Alerts:</strong> Automatic warnings for allergies and toxic ingredients</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-kaeva-accent mt-0.5">•</span>
              <span><strong>Personalized Nutrition:</strong> Tailored meal plans and portion recommendations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-kaeva-accent mt-0.5">•</span>
              <span><strong>Medical-Grade Accuracy:</strong> TDEE calculations and health-condition-specific filtering</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-kaeva-accent mt-0.5">•</span>
              <span><strong>Smart Shopping:</strong> Member-specific shopping lists and budget planning</span>
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <AlertDialogContent className="bg-kaeva-void border-kaeva-sage/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-kaeva-sage">Remove Household Member</AlertDialogTitle>
            <AlertDialogDescription className="text-kaeva-sage/70">
              Are you sure you want to remove {deletingMember?.name || 'this member'} from your household? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-kaeva-sage/20 text-kaeva-sage hover:bg-kaeva-sage/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Household;
