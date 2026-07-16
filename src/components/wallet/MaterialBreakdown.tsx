import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { UserProfile } from '../../types';
import { triggerHaptic, HapticPattern } from '../../lib/haptics';

interface MaterialBreakdownProps {
  user: UserProfile;
  language: 'da' | 'en';
}

export default function MaterialBreakdown({ user, language }: MaterialBreakdownProps) {
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const donutData = useMemo(() => {
    return [
      {
        name: language === 'da' ? 'Plast & PET' : 'Plastic & PET',
        value: Number((user.co2SavedKg * 0.45).toFixed(2)),
        count: Math.round(user.scansCount * 0.4),
        pct: 45,
        color: '#10b981', // emerald-500
        emoji: '🥤',
      },
      {
        name: language === 'da' ? 'Aluminium & Glas' : 'Metal & Glass',
        value: Number((user.co2SavedKg * 0.30).toFixed(2)),
        count: Math.round(user.scansCount * 0.3),
        pct: 30,
        color: '#3b82f6', // blue-500
        emoji: '🥫',
      },
      {
        name: language === 'da' ? 'Pap & Karton' : 'Paper & Cardboard',
        value: Number((user.co2SavedKg * 0.25).toFixed(2)),
        count: Math.round(user.scansCount * 0.3),
        pct: 25,
        color: '#f59e0b', // amber-500
        emoji: '📦',
      }
    ];
  }, [user.co2SavedKg, user.scansCount, language]);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-wider block">
        {language === 'da' ? 'Besparelse opdelt efter materialetype' : 'CO₂e savings by material type'}
      </span>
      
      <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-6 items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
        {/* Donut Chart Visualizer */}
        <div className="relative w-full h-[140px] flex items-center justify-center mx-auto max-w-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={56}
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={(_, index) => {
                  triggerHaptic(HapticPattern.LIGHT_TAP);
                  setActivePieIndex(index);
                }}
                onMouseLeave={() => {
                  setActivePieIndex(null);
                }}
              >
                {donutData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    style={{
                      filter: activePieIndex === index ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))' : 'none',
                      opacity: activePieIndex === null || activePieIndex === index ? 1 : 0.65,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text Indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
            {activePieIndex !== null ? (
              <>
                <span className="text-sm leading-none filter drop-shadow-3xs">
                  {donutData[activePieIndex].emoji}
                </span>
                <span className="text-[13px] font-black text-primary mt-1 leading-none">
                  {donutData[activePieIndex].pct}%
                </span>
                <span className="text-[7.5px] font-bold text-muted-text uppercase mt-0.5 tracking-tight leading-none truncate max-w-[70px]">
                  {donutData[activePieIndex].name.split(' ')[0]}
                </span>
              </>
            ) : (
              <>
                <span className="text-xs leading-none filter drop-shadow-3xs">♻️</span>
                <span className="text-[12px] font-black text-primary mt-1 leading-none">
                  {user.co2SavedKg.toFixed(1)}
                </span>
                <span className="text-[7.5px] font-bold text-muted-text uppercase mt-0.5 tracking-tight leading-none">
                  {language === 'da' ? 'KG I ALT' : 'KG TOTAL'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Material Bars / Legend */}
        <div className="flex flex-col gap-2.5 w-full">
          {donutData.map((item, index) => {
            const isHovered = activePieIndex === index;
            const isAnyHovered = activePieIndex !== null;
            return (
              <div 
                key={item.name} 
                className={`flex flex-col gap-1 transition-all duration-200 p-2 rounded-xl border ${
                  isHovered 
                    ? 'bg-white border-gray-200 shadow-3xs scale-[1.01]' 
                    : isAnyHovered 
                      ? 'opacity-40 scale-[0.99] border-transparent' 
                      : 'bg-transparent border-transparent hover:bg-gray-100/30'
                }`}
                onMouseEnter={() => setActivePieIndex(index)}
                onMouseLeave={() => setActivePieIndex(null)}
              >
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-primary flex items-center gap-1.5 min-w-0">
                    <span className="text-sm shrink-0">{item.emoji}</span> 
                    <span className="truncate">{item.name}</span>
                    <span className="text-[9px] font-medium text-[#9CA3AF] shrink-0">
                      ({item.count} {language === 'da' ? 'stk' : 'items'})
                    </span>
                  </span>
                  <span className="font-extrabold text-right shrink-0" style={{ color: item.color }}>
                    {item.value.toFixed(2)} kg CO₂e
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full" 
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
