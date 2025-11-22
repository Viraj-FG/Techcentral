import { useState } from 'react';
import { PawPrint } from 'lucide-react';
import type { PetData } from '../ScanResults';

const PetIdResult = ({ data }: { data?: PetData }) => {
  const [petName, setPetName] = useState('');

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Pet image/illustration */}
      <div className="relative w-48 h-48 mx-auto">
        {data.detectedImage ? (
          <img 
            src={data.detectedImage} 
            alt="Detected pet" 
            className="w-full h-full object-cover rounded-2xl border-4 border-kaeva-sage/30"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-kaeva-sage/20 to-kaeva-mint/10 rounded-2xl border-4 border-kaeva-sage/30 flex items-center justify-center">
            <PawPrint className="w-24 h-24 text-kaeva-sage" />
          </div>
        )}
        {/* Glow effect */}
        <div className="absolute inset-0 bg-kaeva-sage/20 blur-3xl rounded-2xl -z-10" />
      </div>

      {/* Pet info card */}
      <div className="p-6 bg-gradient-to-br from-kaeva-sage/10 to-kaeva-mint/5 rounded-2xl border border-kaeva-sage/20">
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
        <input
          type="text"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder={`Enter your ${data.breed || data.species}'s name...`}
          className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-kaeva-sage/50 focus:ring-2 focus:ring-kaeva-sage/20"
          autoFocus
        />
      </div>

      {/* Fun fact */}
      <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-kaeva-sage">💡 Guardian Mode:</span> We'll now monitor your inventory for foods toxic to {data.species}s and alert you before purchase!
        </p>
      </div>
    </div>
  );
};

export default PetIdResult;
