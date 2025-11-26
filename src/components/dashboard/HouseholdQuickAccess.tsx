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
      className="glass-card p-4 rounded-2xl cursor-pointer hover:bg-secondary/5 transition-all group overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors flex-shrink-0">
            <Users className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-secondary truncate">Household Roster</h3>
            {isLoading ? (
              <p className="text-xs text-secondary/50 animate-pulse truncate">Loading...</p>
            ) : memberCount > 0 ? (
              <p className="text-xs text-secondary/70 truncate">
                {memberCount} {memberCount === 1 ? 'member' : 'members'} registered
              </p>
            ) : (
              <p className="text-xs text-secondary/70 flex items-center gap-1">
                <Plus className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Add family members</span>
              </p>
            )}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-secondary/30 group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </motion.div>
  );
};

export default HouseholdQuickAccess;
