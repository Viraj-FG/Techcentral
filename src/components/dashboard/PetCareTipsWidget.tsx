import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Clock, AlertTriangle, Utensils, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
}

interface CareTip {
  type: 'feeding' | 'health' | 'warning' | 'general';
  title: string;
  description: string;
  icon: any;
  species: string;
}

const DOG_CARE_TIPS: CareTip[] = [
  {
    type: 'feeding',
    title: 'Feeding Schedule',
    description: 'Adult dogs: 2 meals per day (morning and evening). Puppies under 6 months: 3-4 meals per day.',
    icon: Utensils,
    species: 'dog'
  },
  {
    type: 'health',
    title: 'Exercise Needs',
    description: 'Dogs need 30-120 minutes of exercise daily depending on breed and age. Include walks, playtime, and mental stimulation.',
    icon: Heart,
    species: 'dog'
  },
  {
    type: 'warning',
    title: 'Toxic Foods',
    description: 'NEVER feed: chocolate, grapes, raisins, onions, garlic, xylitol (artificial sweetener), macadamia nuts, avocado, alcohol.',
    icon: AlertTriangle,
    species: 'dog'
  },
  {
    type: 'health',
    title: 'Dental Care',
    description: 'Brush teeth 2-3 times per week. Provide dental chews. Schedule annual dental checkups.',
    icon: Heart,
    species: 'dog'
  },
  {
    type: 'general',
    title: 'Grooming',
    description: 'Brush regularly (daily for long-haired breeds). Bathe every 4-6 weeks. Trim nails monthly.',
    icon: Sparkles,
    species: 'dog'
  }
];

const CAT_CARE_TIPS: CareTip[] = [
  {
    type: 'feeding',
    title: 'Feeding Schedule',
    description: 'Adult cats: 2-3 small meals per day. Kittens under 6 months: 3-4 meals per day. Always provide fresh water.',
    icon: Utensils,
    species: 'cat'
  },
  {
    type: 'health',
    title: 'Litter Box Maintenance',
    description: 'Scoop daily, full clean weekly. One litter box per cat, plus one extra. Place in quiet, accessible locations.',
    icon: Heart,
    species: 'cat'
  },
  {
    type: 'warning',
    title: 'Toxic Foods & Plants',
    description: 'NEVER feed: chocolate, onions, garlic, grapes, raisins, alcohol, caffeine. Toxic plants: lilies, tulips, azaleas, sago palm.',
    icon: AlertTriangle,
    species: 'cat'
  },
  {
    type: 'health',
    title: 'Preventive Care',
    description: 'Annual vet checkups. Keep vaccinations current. Monthly flea/tick prevention. Indoor cats need mental stimulation.',
    icon: Heart,
    species: 'cat'
  },
  {
    type: 'general',
    title: 'Enrichment',
    description: 'Provide scratching posts, climbing towers, interactive toys. Play sessions 10-15 minutes, 2-3 times daily.',
    icon: Sparkles,
    species: 'cat'
  }
];

const GENERAL_PET_TIPS: CareTip[] = [
  {
    type: 'health',
    title: 'Annual Checkups',
    description: 'Schedule yearly veterinary exams. Senior pets (7+ years) benefit from twice-yearly checkups.',
    icon: Heart,
    species: 'general'
  },
  {
    type: 'general',
    title: 'Microchipping',
    description: 'Ensure your pet is microchipped and registration is current. Update contact info if you move.',
    icon: Sparkles,
    species: 'general'
  },
  {
    type: 'health',
    title: 'Emergency Preparedness',
    description: 'Keep emergency vet contact info handy. Have a pet first aid kit. Know signs of distress: lethargy, vomiting, difficulty breathing.',
    icon: AlertTriangle,
    species: 'general'
  }
];

export const PetCareTipsWidget = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, breed, age')
        .eq('user_id', user.id);

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelevantTips = (): CareTip[] => {
    const tips: CareTip[] = [];
    const hasDogs = pets.some(p => p.species.toLowerCase() === 'dog');
    const hasCats = pets.some(p => p.species.toLowerCase() === 'cat');

    if (hasDogs) tips.push(...DOG_CARE_TIPS);
    if (hasCats) tips.push(...CAT_CARE_TIPS);
    tips.push(...GENERAL_PET_TIPS);

    return tips;
  };

  const getTipColor = (type: CareTip['type']) => {
    switch (type) {
      case 'feeding':
        return 'bg-secondary/10 border-secondary/30 text-secondary';
      case 'health':
        return 'bg-accent/10 border-accent/30 text-accent';
      case 'warning':
        return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'general':
        return 'bg-primary/10 border-primary/30 text-primary';
      default:
        return 'bg-muted/10 border-border text-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="h-20 bg-muted rounded" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (pets.length === 0) {
    return (
      <Card className="glass-card p-6 text-center">
        <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground">
          Add pets to your household to see personalized care tips
        </p>
      </Card>
    );
  }

  const relevantTips = getRelevantTips();

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Pet Care Tips</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {pets.length} {pets.length === 1 ? 'pet' : 'pets'}
        </Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {relevantTips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-lg border ${getTipColor(tip.type)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1">{tip.title}</h4>
                    <p className="text-xs opacity-90 leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};
