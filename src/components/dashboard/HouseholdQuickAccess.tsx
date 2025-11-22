import { motion } from "framer-motion";
import { Users, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const HouseholdQuickAccess = () => {
  const navigate = useNavigate();
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMemberCount();
  }, []);

  const fetchMemberCount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('household_members')
      .select('id', { count: 'exact' })
      .eq('user_id', session.user.id);

    if (!error && data) {
      setMemberCount(data.length);
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onClick={() => navigate('/household')}
      className="glass-card p-4 rounded-2xl cursor-pointer hover:bg-kaeva-sage/5 transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-kaeva-accent/20 flex items-center justify-center group-hover:bg-kaeva-accent/30 transition-colors">
            <Users className="w-5 h-5 text-kaeva-accent" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-kaeva-sage">Household Roster</h3>
            {isLoading ? (
              <p className="text-xs text-kaeva-sage/50 animate-pulse">Loading...</p>
            ) : memberCount > 0 ? (
              <p className="text-xs text-kaeva-sage/70">
                {memberCount} {memberCount === 1 ? 'member' : 'members'} registered
              </p>
            ) : (
              <p className="text-xs text-kaeva-sage/70 flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Add family members
              </p>
            )}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-kaeva-sage/30 group-hover:text-kaeva-accent group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
};

export default HouseholdQuickAccess;
