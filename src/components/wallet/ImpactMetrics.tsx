import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Leaf, Share2, Activity } from 'lucide-react';
import { UserProfile } from '../../types';
import { triggerHaptic, HapticPattern } from '../../lib/haptics';
import MaterialBreakdown from './MaterialBreakdown';

interface ImpactMetricsProps {
  user: UserProfile;
  language: 'da' | 'en';
  onShareImpact: () => void;
}

export default function ImpactMetrics({ user, language, onShareImpact }: ImpactMetricsProps) {
  const [impactMetric, setImpactMetric] = useState<'monthly' | 'cumulative'>('cumulative');
  const [activeHoverPoint, setActiveHoverPoint] = useState<any>(null);

  const MONTHS_LIST = useMemo(() => {
    return language === 'da' 
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun'] 
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  }, [language]);

  const co2TrendData = useMemo(() => {
    const monthlyRatios = [0.12, 0.15, 0.18, 0.22, 0.15, 0.18];
    let cumulativeSum = 0;
    return MONTHS_LIST.map((month, index) => {
      const monthlyValue = Number((user.co2SavedKg * monthlyRatios[index]).toFixed(1));
      cumulativeSum = Number((cumulativeSum + monthlyValue).toFixed(1));
      return {
        month,
        monthly: monthlyValue,
        cumulative: cumulativeSum,
      };
    });
  }, [user.co2SavedKg, MONTHS_LIST]);

  const displayCo2Value = useMemo(() => {
    if (activeHoverPoint) {
      return impactMetric === 'cumulative' ? activeHoverPoint.cumulative : activeHoverPoint.monthly;
    }
    return user.co2SavedKg;
  }, [activeHoverPoint, impactMetric, user.co2SavedKg]);

  const activeMonthLabel = useMemo(() => {
    if (activeHoverPoint) {
      return activeHoverPoint.month;
    }
    return language === 'da' ? 'I alt (Hittil)' : 'Total (To Date)';
  }, [activeHoverPoint, language]);

  const drivingEquivalent = useMemo(() => {
    return Number((displayCo2Value * 8.2).toFixed(1));
  }, [displayCo2Value]);

  const treeAbsorptionDays = useMemo(() => {
    return Math.round(displayCo2Value * 16.6);
  }, [displayCo2Value]);

  const lightbulbHours = useMemo(() => {
    return Math.round(displayCo2Value * 58);
  }, [displayCo2Value]);

  return (
    <>
      {/* Personal Impact Summary Card */}
      <div id="personal-impact-summary-card" className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm text-left flex flex-col gap-5 transition-all duration-300 hover:shadow-md animate-once animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-3xs">
              <Leaf className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <span className="text-[9px] font-black tracking-widest text-[#9CA3AF] uppercase block leading-none">
                {language === 'da' ? 'MILJØREGNSKAB' : 'ECOLOGICAL BALANCE'}
              </span>
              <h4 className="text-xs font-black text-primary uppercase tracking-wider mt-1">
                {language === 'da' ? 'Personlig Klimaindvirkning' : 'Personal Impact'}
              </h4>
            </div>
          </div>
          {/* Eco-Tier Badge */}
          <div className="bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-3xs select-none">
            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">
              {(() => {
                const co2 = user.co2SavedKg;
                if (co2 < 1.0) return language === 'da' ? '🌱 Spire' : '🌱 Sprout';
                if (co2 < 5.0) return language === 'da' ? '🌿 Grøn Partner' : '🌿 Green Partner';
                if (co2 < 15.0) return language === 'da' ? '🌲 Miljøhelt' : '🌲 Eco Hero';
                return language === 'da' ? '🏆 Champion' : '🏆 Champion';
              })()}
            </span>
          </div>
        </div>

        {/* Main CO2e Figure Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/80 border border-gray-150 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex flex-col justify-center">
            <span className="text-[9px] font-black text-muted-text uppercase tracking-widest block leading-none">
              {language === 'da' ? 'AKKUMULERET CO₂e BESPARET' : 'CUMULATIVE CO₂e PREVENTED'}
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4.5xl font-black text-primary tracking-tighter leading-none">
                {user.co2SavedKg.toFixed(2)}
              </span>
              <span className="text-sm font-black text-primary">kg CO₂e</span>
            </div>
            <p className="text-[10px] text-muted-text font-bold mt-2 leading-normal">
              {language === 'da' 
                ? `Beregnet på tværs af dine ${user.scansCount} registrerede genanvendelser.` 
                : `Calculated across your ${user.scansCount} registered packaging recycles.`}
            </p>
          </div>

          {/* Goal tracker ring/progress */}
          <div className="border-t md:border-t-0 md:border-l border-gray-200/60 pt-3 md:pt-0 md:pl-4 flex flex-col justify-center">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-text mb-1">
              <span>{language === 'da' ? 'Årligt Mål (50 kg)' : 'Annual Goal (50 kg)'}</span>
              <span className="text-primary">{((user.co2SavedKg / 50) * 100).toFixed(1)}%</span>
            </div>
            {/* Custom progress bar */}
            <div className="w-full h-3.5 bg-gray-200 rounded-full overflow-hidden border border-gray-200/40 relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (user.co2SavedKg / 50) * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-[9px] text-muted-text font-semibold mt-1.5 leading-relaxed">
              {language === 'da'
                ? `Du mangler ${(Math.max(0, 50 - user.co2SavedKg)).toFixed(1)} kg for at nå dit årlige mål.`
                : `You need ${(Math.max(0, 50 - user.co2SavedKg)).toFixed(1)} kg more to reach your yearly goal.`}
            </p>
          </div>
        </div>

        {/* Material Contribution Breakdown */}
        <MaterialBreakdown user={user} language={language} />

        {/* Dynamic educational tip */}
        <div className="border-t border-gray-150 pt-3 mt-1 text-center flex flex-col gap-3.5">
          <p className="text-[10px] text-[#9CA3AF] italic font-semibold leading-relaxed">
            🌿 {language === 'da'
              ? 'Hvert stykke genanvendt emballage sparer i gennemsnit 150g CO₂e sammenlignet med produktion af nye råmaterialer.'
              : 'Every single piece of recycled packaging saves an average of 150g CO₂e compared to virgin material manufacturing.'}
          </p>

          <button
            id="share-impact-btn"
            onClick={onShareImpact}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-2xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-97 cursor-pointer border border-emerald-700/10 shadow-3xs"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            {language === 'da' ? 'Del Min Klimaindvirkning' : 'Share My Impact'}
          </button>
        </div>
      </div>

      {/* Visual 'My Impact' CO2 Savings over time Dashboard */}
      <div className="bg-white border border-gray-250 rounded-3xl p-5 shadow-sm text-left flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-sm">🌍</span>
              <h4 className="text-xs font-black text-primary uppercase tracking-wider">
                {language === 'da' ? 'Min Grønne Indvirkning' : 'My Green Impact'}
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full select-none flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> Live Tracker
            </span>
          </div>

          <p className="text-[10px] text-muted-text font-semibold leading-normal">
            {language === 'da'
              ? 'Følg din personlige CO₂-reduktion over zeit i takt med at du scanner og genanvender emballage.'
              : 'Track your personal CO₂ reductions over time as you scan and sort household packagings.'}
          </p>
        </div>

        {/* Card with big animated count & timeframe switcher */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex justify-between items-start z-10">
            <div>
              <span className="text-[9px] font-black text-muted-text uppercase tracking-widest block leading-none">
                {language === 'da' ? 'KLIMAAFTRAK MODVIRKET' : 'CARBON PREVENTED'}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-3xl font-black text-primary tracking-tighter leading-none">
                  {displayCo2Value.toFixed(1)}
                </span>
                <span className="text-sm font-black text-primary">kg CO₂</span>
              </div>
              <span className="text-[9px] font-bold text-muted-text mt-0.5 block leading-none">
                {activeMonthLabel}
              </span>
            </div>

            {/* Metric Mode Switcher */}
            <div className="bg-white border border-gray-150 p-0.5 rounded-lg flex gap-0.5 shadow-2xs select-none">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(HapticPattern.LIGHT_TAP);
                  setImpactMetric('cumulative');
                }}
                className={`py-1.5 px-2 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  impactMetric === 'cumulative'
                    ? 'bg-primary text-white font-black'
                    : 'text-primary/60 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {language === 'da' ? 'Akkumuleret' : 'Accumulated'}
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(HapticPattern.LIGHT_TAP);
                  setImpactMetric('monthly');
                }}
                className={`py-1.5 px-2 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  impactMetric === 'monthly'
                    ? 'bg-primary text-white font-black'
                    : 'text-primary/60 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {language === 'da' ? 'Månedlig' : 'Monthly'}
              </button>
            </div>
          </div>

          {/* Recharts AreaChart Area */}
          <div className="w-full h-[140px] z-10 -ml-4 pr-1 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={co2TrendData}
                onMouseMove={(state: any) => {
                  if (state && state.activePayload && state.activePayload[0]) {
                    setActiveHoverPoint(state.activePayload[0].payload);
                  }
                }}
                onMouseLeave={() => {
                  setActiveHoverPoint(null);
                }}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCo2Wallet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#374151', fontSize: 10, fontWeight: '700' }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 8, fontWeight: '500' }}
                  width={20}
                />
                <Tooltip 
                  cursor={{ stroke: '#10B981', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const value = impactMetric === 'cumulative' ? data.cumulative : data.monthly;
                      return (
                        <div className="bg-primary/95 text-white border border-accent/20 rounded-xl p-2 shadow-lg text-[10px] pointer-events-none text-left">
                          <span className="font-bold uppercase tracking-wider block text-[8px] text-accent">{data.month}</span>
                          <span className="font-extrabold block mt-0.5">{value.toFixed(1)} kg CO₂</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey={impactMetric} 
                  stroke="#10B981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorCo2Wallet)"
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Interaction hint */}
          <span className="text-[8.5px] font-bold text-muted-text italic text-center select-none block -mt-2 animate-pulse">
            {language === 'da' 
              ? '👉 Bevæg fingeren eller musen over grafen for at aflæse specifikke uger' 
              : '👉 Hover/slide across the chart to inspect different months & update active equivalencies'}
          </span>
        </div>

        {/* Carbon Equivalency Dashboard section */}
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black text-muted-text uppercase tracking-wider block">
            {language === 'da' ? 'Hvad svarer denne besparelse til?' : 'What does this reduction represent?'}
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Driving neutralization */}
            <div className="bg-[#FAF9F6] border border-gray-150 p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all hover:bg-gray-50/80">
              <span className="text-xl filter drop-shadow-3xs mb-1">🚗</span>
              <span className="text-[11px] font-black text-primary">{drivingEquivalent} km</span>
              <span className="text-[8px] font-extrabold text-muted-text uppercase tracking-tighter mt-0.5 leading-tight">
                {language === 'da' ? 'Bilkørsel' : 'Car travel'}
              </span>
            </div>

            {/* Trees planting absorption */}
            <div className="bg-[#FAF9F6] border border-gray-150 p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all hover:bg-gray-50/80">
              <span className="text-xl filter drop-shadow-3xs mb-1">🌳</span>
              <span className="text-[11px] font-black text-primary">{treeAbsorptionDays} {language === 'da' ? 'dage' : 'days'}</span>
              <span className="text-[8px] font-extrabold text-muted-text uppercase tracking-tighter mt-0.5 leading-tight">
                {language === 'da' ? 'Træabsorbering' : 'Tree absorption'}
              </span>
            </div>

            {/* Energy standard lights */}
            <div className="bg-[#FAF9F6] border border-gray-150 p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all hover:bg-gray-50/80">
              <span className="text-xl filter drop-shadow-3xs mb-1">💡</span>
              <span className="text-[11px] font-black text-primary">{lightbulbHours} {language === 'da' ? 'timer' : 'hours'}</span>
              <span className="text-[8px] font-extrabold text-muted-text uppercase tracking-tighter mt-0.5 leading-tight">
                {language === 'da' ? 'LED-lys tændt' : 'LED bulb hours'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
