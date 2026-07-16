import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, Leaf, TreePine, Car, Plane, Smartphone, 
  Trophy, Award, ChevronRight, CheckCircle2, RefreshCw, Info 
} from 'lucide-react';
import { UserProfile } from '../types';
import { useLanguage } from '../lib/i18n';
import { triggerHaptic, HapticPattern } from '../lib/haptics';

interface CO2CalculatorProps {
  user: UserProfile;
}

// Milestone threshold definitions in kg CO2 saved
interface Milestone {
  id: string;
  threshold: number;
  titleDa: string;
  titleEn: string;
  descDa: string;
  descEn: string;
  emoji: string;
  colorClass: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'seed',
    threshold: 10,
    titleDa: 'Grønt Frø',
    titleEn: 'Green Seed',
    descDa: 'Begyndelsen på en fantastisk klimarejse!',
    descEn: 'The start of an amazing climate journey!',
    emoji: '🌱',
    colorClass: 'from-emerald-400 to-green-500'
  },
  {
    id: 'cadet',
    threshold: 50,
    titleDa: 'Genbrugs-Kadet',
    titleEn: 'Circular Cadet',
    descDa: 'Du har etableret sunde sorteringsvaner.',
    descEn: 'You have established healthy sorting habits.',
    emoji: '🛡️',
    colorClass: 'from-blue-400 to-indigo-500'
  },
  {
    id: 'combatant',
    threshold: 150,
    titleDa: 'Klimakæmper',
    titleEn: 'Carbon Combatant',
    descDa: 'Din CO₂-besparelse gør en målbar forskel!',
    descEn: 'Your carbon prevention is making a measurable difference!',
    emoji: '⚔️',
    colorClass: 'from-purple-500 to-pink-500'
  },
  {
    id: 'elite',
    threshold: 300,
    titleDa: 'Grøn Elite',
    titleEn: 'Eco Elite',
    descDa: 'En sand mester i ressourcegenanvendelse.',
    descEn: 'A true champion of resource circularity.',
    emoji: '✨',
    colorClass: 'from-amber-400 to-orange-500'
  },
  {
    id: 'guardian',
    threshold: 600,
    titleDa: 'Planetens Vogter',
    titleEn: 'Guardian of Aarhus',
    descDa: 'Dit klimaaftryk krymper med stormskridt!',
    descEn: 'Your carbon footprint is shrinking at a rapid pace!',
    emoji: '🪐',
    colorClass: 'from-teal-400 to-emerald-600'
  },
  {
    id: 'legend',
    threshold: 1200,
    titleDa: 'Klima-Legende',
    titleEn: 'Climate Legend',
    descDa: 'Du har afværget massive mængder CO₂ for evigt.',
    descEn: 'You have prevented massive amounts of CO2 forever.',
    emoji: '👑',
    colorClass: 'from-yellow-400 via-red-500 to-purple-600'
  }
];

// Play a celebratory multi-chord sound using Web Audio API
function playMilestoneCelebrationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Arpeggio chord notes: C4 (261.63), E4 (329.63), G4 (392.00), C5 (523.25), E5 (659.25), G5 (783.99)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      // Sparkle chime effect with a higher sine frequency
      if (idx === notes.length - 1) {
        osc.type = 'sine';
      }

      gain.gain.setValueAtTime(0.0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  } catch (error) {
    console.warn('Failed playing celebration audio:', error);
  }
}

export default function CO2Calculator({ user }: CO2CalculatorProps) {
  const { language } = useLanguage();
  
  // Calculator inputs
  const [weeklyScans, setWeeklyScans] = useState<number>(10);
  const [years, setYears] = useState<number>(5);
  const [materialType, setMaterialType] = useState<'mixed' | 'glass_metal' | 'pet_plast' | 'cartons'>('mixed');

  // Milestone tracking to prevent double-celebrating the same milestone in a single sliding action
  const [unlockedMilestone, setUnlockedMilestone] = useState<Milestone | null>(null);
  const [celebratedIds, setCelebratedIds] = useState<Set<string>>(() => {
    // Read already achieved milestones based on current baseline so they are not auto-triggered on mount
    const achieved = new Set<string>();
    MILESTONES.forEach(m => {
      if (user.co2SavedKg >= m.threshold) {
        achieved.add(m.id);
      }
    });
    return achieved;
  });

  // Carbon factor in kg CO2 saved per item
  const carbonFactor = useMemo(() => {
    switch (materialType) {
      case 'glass_metal': return 0.140; // 140g average
      case 'pet_plast': return 0.060;   // 60g average
      case 'cartons': return 0.045;     // 45g average
      case 'mixed': 
      default:
        // Calculate based on their actual average if they have scans, otherwise fallback to 0.08 (80g)
        if (user.scansCount > 0 && user.co2SavedKg > 0) {
          return Math.max(0.03, Math.min(0.2, user.co2SavedKg / user.scansCount));
        }
        return 0.085; // default mixed average (85g)
    }
  }, [materialType, user.scansCount, user.co2SavedKg]);

  // Projected lifetime savings calculation
  const projectedCO2 = useMemo(() => {
    const futureSavings = weeklyScans * 52 * years * carbonFactor;
    return Number((user.co2SavedKg + futureSavings).toFixed(1));
  }, [user.co2SavedKg, weeklyScans, years, carbonFactor]);

  // Equivalents calculations
  const equivalents = useMemo(() => {
    return {
      carKm: Number((projectedCO2 * 8.2).toFixed(0)), // 1 kg CO2 ~ 8.2 km driving diesel car
      trees: Number((projectedCO2 / 22.0).toFixed(1)), // A mature tree absorbs 22 kg CO2 per year
      flights: Number((projectedCO2 / 150.0).toFixed(1)), // Flights Cph -> London is ~150 kg CO2
      plasticBags: Number((projectedCO2 / 0.033).toFixed(0)), // Plastic bag is ~33g CO2
      phoneCharges: Number((projectedCO2 * 242.0).toFixed(0)) // 1 kg CO2 ~ 242 phone charges
    };
  }, [projectedCO2]);

  // Handle milestone checking on projection changes
  useEffect(() => {
    // Find highest milestone reached in this calculation
    let highestReached: Milestone | null = null;
    MILESTONES.forEach(m => {
      if (projectedCO2 >= m.threshold) {
        highestReached = m;
      }
    });

    if (highestReached) {
      const reached: Milestone = highestReached;
      if (!celebratedIds.has(reached.id)) {
        // Trigger magnificent celebration!
        setUnlockedMilestone(reached);
        setCelebratedIds(prev => {
          const next = new Set(prev);
          next.add(reached.id);
          return next;
        });

        // Haptic vibe
        triggerHaptic(HapticPattern.SCAN_SUCCESS);
        
        // Multi-chord sound
        playMilestoneCelebrationSound();

        // Confetti explosion
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C8F24A', '#10B981', '#3B82F6', '#F59E0B', '#A855F7']
        });
        
        // Continuous side bursts
        const end = Date.now() + 1500;
        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: ['#C8F24A', '#10B981', '#3B82F6']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: ['#C8F24A', '#10B981', '#3B82F6']
          });
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        requestAnimationFrame(frame);
      }
    }
  }, [projectedCO2, celebratedIds]);

  // Helper to reset milestone triggers to let user replay
  const handleResetTriggers = () => {
    triggerHaptic(HapticPattern.LIGHT_TAP);
    const achieved = new Set<string>();
    MILESTONES.forEach(m => {
      if (user.co2SavedKg >= m.threshold) {
        achieved.add(m.id);
      }
    });
    setCelebratedIds(achieved);
    setWeeklyScans(5);
    setYears(1);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-5 mt-4 shadow-sm text-left flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <div>
            <h3 className="text-sm font-black text-primary uppercase tracking-tight">
              {language === 'da' ? 'Klimaberegner & Milepæle' : 'CO₂ Calculator & Milestones'}
            </h3>
            <p className="text-[10px] text-muted-text font-bold">
              {language === 'da' ? 'Estimer din livstidsindsats for miljøet' : 'Project your lifetime carbon footprint prevention'}
            </p>
          </div>
        </div>
        <button
          onClick={handleResetTriggers}
          className="text-[9px] font-black text-primary/50 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider bg-gray-50 border border-gray-150 rounded-lg px-2 py-1"
          title={language === 'da' ? 'Nulstil kalkulator' : 'Reset calculator'}
        >
          <RefreshCw className="w-3 h-3" />
          <span>{language === 'da' ? 'Nulstil' : 'Reset'}</span>
        </button>
      </div>

      {/* Inputs Section */}
      <div className="flex flex-col gap-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-150/50">
        
        {/* Sliders Title */}
        <div className="flex items-center justify-between text-[10px] font-black uppercase text-primary tracking-wider">
          <span>{language === 'da' ? 'Fremtidige Vaner' : 'Future Habits'}</span>
          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-mono">
            {language === 'da' ? 'Sparer ca.' : 'Saves approx.'} {(carbonFactor * 1000).toFixed(0)}g CO₂ / item
          </span>
        </div>

        {/* Sliders Mix Selection */}
        <div className="grid grid-cols-4 gap-1 mt-1">
          {[
            { id: 'mixed', labelDa: 'Blandet', labelEn: 'Mixed', emoji: '♻️' },
            { id: 'pet_plast', labelDa: 'Plast', labelEn: 'Plast', emoji: '🟣' },
            { id: 'glass_metal', labelDa: 'Glas/Metal', labelEn: 'Glass', emoji: '🐳' },
            { id: 'cartons', labelDa: 'Kartoner', labelEn: 'Carton', emoji: '🟢' }
          ].map(mat => (
            <button
              key={mat.id}
              onClick={() => {
                triggerHaptic(HapticPattern.LIGHT_TAP);
                setMaterialType(mat.id as any);
              }}
              className={`py-1.5 rounded-xl border text-[9px] font-black flex flex-col items-center justify-center gap-0.5 uppercase transition-all cursor-pointer ${
                materialType === mat.id
                  ? 'bg-primary border-primary text-accent shadow-2xs'
                  : 'bg-white border-gray-200 text-primary/60 hover:text-primary hover:bg-gray-50'
              }`}
            >
              <span>{mat.emoji}</span>
              <span>{language === 'da' ? mat.labelDa : mat.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Weekly Scans Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs font-bold text-primary">
            <span>{language === 'da' ? 'Scanninger pr. uge:' : 'Weekly scans:'}</span>
            <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
              {weeklyScans} {language === 'da' ? 'stk' : 'pcs'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="40"
            value={weeklyScans}
            onChange={(e) => {
              const val = Number(e.target.value);
              setWeeklyScans(val);
              if (val % 5 === 0) triggerHaptic(HapticPattern.LIGHT_TAP);
            }}
            className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer appearance-none mt-1"
          />
        </div>

        {/* Years Projection Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs font-bold text-primary">
            <span>{language === 'da' ? 'Tidshorisont:' : 'Time horizon:'}</span>
            <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">
              {years} {language === 'da' ? (years === 1 ? 'år' : 'år') : (years === 1 ? 'year' : 'years')}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="40"
            value={years}
            onChange={(e) => {
              const val = Number(e.target.value);
              setYears(val);
              if (val % 5 === 0) triggerHaptic(HapticPattern.LIGHT_TAP);
            }}
            className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer appearance-none mt-1"
          />
        </div>
      </div>

      {/* Projection Score Card */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary-dark text-white rounded-2xl p-4 shadow-md flex items-center justify-between relative overflow-hidden border border-black/10">
        
        {/* Abstract background decorative circles */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-accent/10 pointer-events-none" />
        <div className="absolute right-4 -top-12 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

        <div className="flex flex-col z-10">
          <span className="text-[9px] font-black text-accent uppercase tracking-wider flex items-center gap-1 leading-none mb-1">
            <Sparkles className="w-3 h-3 text-accent shrink-0 animate-pulse" />
            {language === 'da' ? 'Estimeret Livstidsbesparelse' : 'Projected Lifetime Savings'}
          </span>
          
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white font-sans tracking-tight">
              {projectedCO2.toLocaleString(language === 'da' ? 'da-DK' : 'en-US')}
            </span>
            <span className="text-sm font-black text-accent uppercase">kg CO₂</span>
          </div>

          <p className="text-[9px] text-white/70 font-bold mt-1.5 max-w-[200px] leading-snug">
            {language === 'da' 
              ? `Inkluderer din nuværende grønne indsats på ${user.co2SavedKg} kg CO₂!`
              : `Includes your current active recycling impact of ${user.co2SavedKg} kg CO₂!`}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/15 px-3 py-2.5 rounded-xl text-center shrink-0 z-10 max-w-[110px]">
          <span className="text-[8px] font-black uppercase text-accent leading-none tracking-wider block mb-1">
            {language === 'da' ? 'Svarer til' : 'Equivalent to'}
          </span>
          <span className="text-sm font-black leading-none text-white font-mono block mb-0.5">
            {equivalents.trees.toLocaleString(language === 'da' ? 'da-DK' : 'en-US')}
          </span>
          <span className="text-[8px] font-bold text-white/80 leading-tight block">
            {language === 'da' ? 'træer vokset i 1 år' : 'trees grown for 1 year'}
          </span>
        </div>
      </div>

      {/* Equivalents bento grid */}
      <div className="grid grid-cols-2 gap-2.5 mt-1">
        
        {/* Car travel saved */}
        <div className="bg-amber-50/50 border border-amber-200/50 p-2.5 rounded-xl flex items-start gap-2 text-left">
          <span className="p-1.5 bg-amber-100 rounded-lg text-sm shrink-0">🚗</span>
          <div>
            <span className="text-[8px] font-black text-amber-900 uppercase tracking-wide block leading-none mb-1">
              {language === 'da' ? 'Bilrejse aflyst' : 'Car travel avoided'}
            </span>
            <span className="text-xs font-black text-amber-950 font-mono">
              {equivalents.carKm.toLocaleString(language === 'da' ? 'da-DK' : 'en-US')} km
            </span>
            <span className="text-[8.5px] text-amber-800/80 font-bold block leading-snug mt-0.5">
              {language === 'da' ? 'i en standard dieselbil' : 'in a standard diesel car'}
            </span>
          </div>
        </div>

        {/* Flight emissions prevented */}
        <div className="bg-sky-50/50 border border-sky-200/50 p-2.5 rounded-xl flex items-start gap-2 text-left">
          <span className="p-1.5 bg-sky-100 rounded-lg text-sm shrink-0">✈️</span>
          <div>
            <span className="text-[8px] font-black text-sky-900 uppercase tracking-wide block leading-none mb-1">
              {language === 'da' ? 'Flyrejser sparet' : 'Flights prevented'}
            </span>
            <span className="text-xs font-black text-sky-950 font-mono">
              {equivalents.flights} {language === 'da' ? 'rejser' : 'flights'}
            </span>
            <span className="text-[8.5px] text-sky-800/80 font-bold block leading-snug mt-0.5">
              {language === 'da' ? 'Cph ⇄ London retur' : 'Cph ⇄ London roundtrips'}
            </span>
          </div>
        </div>

        {/* Plastic bags saved */}
        <div className="bg-purple-50/50 border border-purple-200/50 p-2.5 rounded-xl flex items-start gap-2 text-left">
          <span className="p-1.5 bg-purple-100 rounded-lg text-sm shrink-0">🛍️</span>
          <div>
            <span className="text-[8px] font-black text-purple-900 uppercase tracking-wide block leading-none mb-1">
              {language === 'da' ? 'Plastposer sparet' : 'Plastic bags saved'}
            </span>
            <span className="text-xs font-black text-purple-950 font-mono">
              {equivalents.plasticBags.toLocaleString(language === 'da' ? 'da-DK' : 'en-US')} {language === 'da' ? 'stk' : 'bags'}
            </span>
            <span className="text-[8.5px] text-purple-800/80 font-bold block leading-snug mt-0.5">
              {language === 'da' ? 'fra plastikforurening' : 'from plastic pollution'}
            </span>
          </div>
        </div>

        {/* Phone charge cycles */}
        <div className="bg-emerald-50/50 border border-emerald-200/50 p-2.5 rounded-xl flex items-start gap-2 text-left">
          <span className="p-1.5 bg-emerald-100 rounded-lg text-sm shrink-0">🔋</span>
          <div>
            <span className="text-[8px] font-black text-emerald-900 uppercase tracking-wide block leading-none mb-1">
              {language === 'da' ? 'Mobilopladninger' : 'Phone charges'}
            </span>
            <span className="text-xs font-black text-emerald-950 font-mono">
              {equivalents.phoneCharges.toLocaleString(language === 'da' ? 'da-DK' : 'en-US')} {language === 'da' ? 'gange' : 'times'}
            </span>
            <span className="text-[8.5px] text-emerald-800/80 font-bold block leading-snug mt-0.5">
              {language === 'da' ? '100% strømcyklusser' : '100% battery cycles'}
            </span>
          </div>
        </div>
      </div>

      {/* Milestone Pathway tracker */}
      <div className="flex flex-col gap-2.5 mt-1 border-t border-gray-100 pt-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-primary tracking-wider">
            {language === 'da' ? 'Milepæle baseret på dit estimat' : 'Milestones based on projection'}
          </span>
          <span className="text-[9px] text-muted-text font-extrabold">
            {celebratedIds.size} {language === 'da' ? 'låst op' : 'unlocked'}
          </span>
        </div>

        <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-thin snap-x">
          {MILESTONES.map(milestone => {
            const isUnlocked = projectedCO2 >= milestone.threshold;
            const isCurrentBaselineUnlocked = user.co2SavedKg >= milestone.threshold;
            
            return (
              <div 
                key={milestone.id}
                className={`min-w-[125px] snap-center rounded-xl p-2.5 border text-center flex flex-col gap-1.5 relative overflow-hidden transition-all ${
                  isUnlocked 
                    ? 'bg-[#FAF9F6] border-[#C8F24A] shadow-3xs' 
                    : 'bg-gray-50/50 border-gray-200 opacity-70'
                }`}
              >
                {/* Visual badge top overlay */}
                <div className="flex justify-between items-center">
                  <span className="text-lg">{milestone.emoji}</span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${
                    isCurrentBaselineUnlocked
                      ? 'bg-emerald-100 text-emerald-800'
                      : isUnlocked
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isCurrentBaselineUnlocked 
                      ? (language === 'da' ? 'Ægte ✓' : 'Real ✓') 
                      : isUnlocked 
                        ? (language === 'da' ? 'Estimeret' : 'Projected') 
                        : (language === 'da' ? 'Låst' : 'Locked')}
                  </span>
                </div>

                <div className="text-left mt-1">
                  <h5 className="text-[10.5px] font-black text-primary leading-tight truncate">
                    {language === 'da' ? milestone.titleDa : milestone.titleEn}
                  </h5>
                  <p className="text-[8.5px] text-muted-text leading-none font-black font-mono mt-0.5">
                    {milestone.threshold} kg CO₂
                  </p>
                </div>

                {/* Progress bar inside node */}
                <div className="w-full bg-gray-200 rounded-full h-[3px] overflow-hidden mt-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked ? 'bg-emerald-500' : 'bg-gray-350'
                    }`}
                    style={{ width: `${Math.min((projectedCO2 / milestone.threshold) * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Celebratory Overlay Modal */}
      <AnimatePresence>
        {unlockedMilestone && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/95 backdrop-blur-md z-[99999] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Ambient decorative glowing spots */}
            <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-white rounded-3xl border border-gray-150 p-6 max-w-sm w-full shadow-2xl relative flex flex-col items-center gap-4 text-left"
            >
              {/* Decorative top crown */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-accent flex items-center justify-center text-4xl shadow-lg border-4 border-white animate-bounce-short">
                {unlockedMilestone.emoji}
              </div>

              <div className="w-full text-center mt-10">
                <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-emerald-700 animate-pulse" />
                  {language === 'da' ? 'Ny milepæl nået!' : 'New milestone reached!'}
                </span>
                
                <h4 className="text-2xl font-black text-primary uppercase tracking-tight mt-3">
                  {language === 'da' ? unlockedMilestone.titleDa : unlockedMilestone.titleEn}
                </h4>
                
                <div className="text-sm font-extrabold text-indigo-700 font-mono mt-0.5">
                  {unlockedMilestone.threshold} kg CO₂ {language === 'da' ? 'besparet (estimeret)' : 'prevented (projected)'}
                </div>

                <p className="text-xs text-muted-text font-semibold leading-relaxed mt-3 px-2">
                  {language === 'da' ? unlockedMilestone.descDa : unlockedMilestone.descEn}
                </p>
              </div>

              {/* Dynamic stats preview */}
              <div className="w-full bg-gray-50 border border-gray-150 p-3.5 rounded-2xl flex flex-col gap-2 mt-1">
                <span className="text-[8.5px] font-black text-muted-text uppercase tracking-wider block">
                  {language === 'da' ? 'Miljømæssig indflydelse' : 'Environmental Equivalence'}
                </span>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🚗</span>
                    <div>
                      <span className="text-[8px] font-bold text-muted-text block leading-none">Diesel Km</span>
                      <span className="text-[10.5px] font-extrabold text-primary font-mono">
                        {equivalents.carKm.toLocaleString(language === 'da' ? 'da-DK' : 'en-US')} km
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🌳</span>
                    <div>
                      <span className="text-[8px] font-bold text-muted-text block leading-none">{language === 'da' ? 'Træer' : 'Trees'}</span>
                      <span className="text-[10.5px] font-extrabold text-primary font-mono">
                        {equivalents.trees.toLocaleString(language === 'da' ? 'da-DK' : 'en-US')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dismiss Action */}
              <button
                onClick={() => {
                  triggerHaptic(HapticPattern.LIGHT_TAP);
                  setUnlockedMilestone(null);
                }}
                className="w-full bg-primary hover:bg-primary-dark text-accent py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center mt-2 shadow-sm"
              >
                {language === 'da' ? 'Fortsæt med at sortere! ♻️' : 'Keep on recycling! ♻️'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
