import { useState } from 'react';
import { PawPrint, Heart, Scissors, Activity, Apple } from 'lucide-react';
import { MultiModalInput } from '@/components/ui/MultiModalInput';
import { UniversalFixSheet } from '@/components/ui/UniversalFixSheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getPetCareTips } from '@/lib/petCareData';
import type { PetData } from '../ScanResults';

const PetIdResult = ({ data }: { data?: PetData }) => {
  const [petName, setPetName] = useState('');

  if (!data) return null;

  const handleFixPet = async (correction: string) => {
    console.log("Re-analyzing pet with correction:", correction);
  };

  const careTips = getPetCareTips(data.species, data.breed);

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('health')) return <Heart className="w-4 h-4" />;
    if (category.toLowerCase().includes('grooming')) return <Scissors className="w-4 h-4" />;
    if (category.toLowerCase().includes('exercise')) return <Activity className="w-4 h-4" />;
    if (category.toLowerCase().includes('diet')) return <Apple className="w-4 h-4" />;
    return <PawPrint className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Pet image/illustration */}
      <div className="relative w-48 h-48 mx-auto">
        {data.detectedImage ? (
          <img 
            src={data.detectedImage} 
            alt="Detected pet" 
            className="w-full h-full object-cover rounded-2xl border-4 border-secondary/30"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-secondary/80 rounded-2xl border-4 border-secondary/30 flex items-center justify-center">
            <PawPrint className="w-24 h-24 text-secondary" />
          </div>
        )}
        {/* Glow effect */}
        <div className="absolute inset-0 bg-secondary/20 blur-3xl rounded-2xl -z-10" />
      </div>

      {/* Pet info card */}
      <div className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/80 rounded-2xl border border-secondary/20">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 uppercase tracking-wide">Species</label>
            <p className="text-2xl font-bold text-white capitalize">{data.species}</p>
          </div>
          
          {data.breed && (
            <div>
              <label className="text-sm text-slate-400 uppercase tracking-wide">Breed</label>
              <p className="text-xl font-semibold text-white">{data.breed}</p>
            </div>
          )}

          {data.size && (
            <div>
              <label className="text-sm text-slate-400 uppercase tracking-wide">Size</label>
              <p className="text-lg text-white capitalize">{data.size}</p>
            </div>
          )}
        </div>
      </div>

      {/* Name input */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-white uppercase tracking-wide">
          What's their name?
        </label>
        <MultiModalInput
          mode="text"
          placeholder={`Enter your ${data.breed || data.species}'s name...`}
          onSubmit={(name) => setPetName(name)}
          domain="pets"
          showHint={false}
        />
      </div>

      {/* Fix Pet Info */}
      <UniversalFixSheet
        domain="pet"
        onSubmit={handleFixPet}
        currentData={data}
        triggerLabel="Fix Pet Details"
      />

      {/* Pet Care Tips */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="care-guide">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-secondary" />
              Care Guide
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {careTips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-border/50">
                  <div className="flex-shrink-0 mt-0.5 text-secondary">
                    {getCategoryIcon(tip.category)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{tip.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tip.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Guardian Mode Notice */}
      <div className="p-4 bg-card/30 rounded-xl border border-border/50">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-secondary">💡 Guardian Mode:</span> We'll now monitor your inventory for foods toxic to {data.species}s and alert you before purchase!
        </p>
      </div>
    </div>
  );
};

export default PetIdResult;
