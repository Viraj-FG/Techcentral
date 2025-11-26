import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PawPrint, Dog, Cat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { kaevaEntranceVariants } from "@/hooks/useKaevaMotion";

interface PetRosterCardProps {
  userId: string;
}

export const PetRosterCard = ({ userId }: PetRosterCardProps) => {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPets = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        setPets(data || []);
      } catch (error) {
        console.error('Error fetching pets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [userId]);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse overflow-hidden">
        <div className="h-24 bg-slate-700/20 rounded"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={kaevaEntranceVariants}
      initial="hidden"
      animate="visible"
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
            <PawPrint className="text-secondary" size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Pet Roster</h3>
            <p className="text-sm text-slate-400">{pets.length} {pets.length === 1 ? 'Pet' : 'Pets'}</p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/household')}
          className="text-xs"
        >
          Manage
        </Button>
      </div>

      {pets.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-400 text-sm mb-3">No pets registered yet</p>
          <Button
            variant="secondary"
            onClick={() => navigate('/household')}
            className="gap-2"
          >
            <PawPrint size={16} strokeWidth={1.5} />
            Add Your First Pet
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {pets.map((pet, index) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer overflow-hidden"
              onClick={() => navigate('/household')}
            >
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                {pet.species.toLowerCase() === 'dog' ? (
                  <Dog className="text-secondary" size={20} strokeWidth={1.5} />
                ) : pet.species.toLowerCase() === 'cat' ? (
                  <Cat className="text-secondary" size={20} strokeWidth={1.5} />
                ) : (
                  <PawPrint className="text-secondary" size={20} strokeWidth={1.5} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{pet.name}</p>
                <p className="text-xs text-slate-400 truncate capitalize">
                  {pet.species} {pet.breed && `• ${pet.breed}`}
                </p>
              </div>

              {pet.toxic_flags_enabled && (
                <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" title="Safety monitoring enabled" />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
