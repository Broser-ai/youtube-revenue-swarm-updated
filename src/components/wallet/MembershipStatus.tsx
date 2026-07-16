import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { UserProfile } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { triggerHaptic, HapticPattern } from '../../lib/haptics';

interface MembershipStatusProps {
  user: UserProfile;
  language: 'da' | 'en';
}

export default function MembershipStatus({ user, language }: MembershipStatusProps) {
  const { t } = useLanguage();
  const [showTiersModal, setShowTiersModal] = useState(false);

  return (
    <>
      {/* Dynamic Membership Status Indicator Pills */}
      <div className="flex justify-between items-center bg-white border border-gray-150 p-4 rounded-2xl shadow-3xs text-left">
        <div className="flex gap-2.5 items-center">
          <span className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg filter drop-shadow-3xs">👑</span>
          <div>
            <span className="text-[9px] font-black tracking-widest text-[#9CA3AF] uppercase block leading-none">{t('member_status')}</span>
            <span className="text-sm font-black text-primary block mt-0.5">{user.memberStatus}</span>
          </div>
        </div>
        <button
          id="see-tiers-btn"
          onClick={() => {
            triggerHaptic(HapticPattern.LIGHT_TAP);
            setShowTiersModal(true);
          }}
          className="bg-primary/5 hover:bg-primary/10 text-primary py-2 px-3.5 rounded-xl text-[10px] uppercase font-black tracking-wider transition-colors active:scale-97 cursor-pointer"
        >
          {t('medlemstatus_tiers')}
        </button>
      </div>

      {/* Tiers Details Modal */}
      <AnimatePresence>
        {showTiersModal && (
          <div className="fixed inset-0 bg-primary/45 backdrop-blur-xs z-55 flex items-center justify-center p-4">
            <motion.div 
              className="bg-white border border-gray-150 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative select-none flex flex-col gap-4 text-left"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button 
                id="close-tiers-modal-btn"
                onClick={() => setShowTiersModal(false)}
                className="absolute right-4 top-4 w-8 h-8 border border-gray-150 rounded-full flex items-center justify-center hover:bg-gray-50 active:scale-90 cursor-pointer text-primary transition-all shadow-3xs"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-2.5 items-center mt-3 text-left">
                <span className="text-3xl filter drop-shadow-3xs text-left">🏆</span>
                <div>
                  <h4 className="text-sm font-black text-primary uppercase tracking-wider">
                    {language === 'da' ? 'Cirkel Medlemsfordele' : 'Cirkel Levels & Tiers'}
                  </h4>
                  <p className="text-[10px] text-muted-text font-semibold">
                    {language === 'da' ? 'Hæv dit niveau og få stærkere point-boost!' : 'Level up to unlock stronger point boosts!'}
                  </p>
                </div>
              </div>

              {/* Tiers list table mapping */}
              <div className="flex flex-col gap-2.5 mt-2 text-left">
                {/* Bronze */}
                <div className="p-3 bg-gray-50/60 border border-gray-200 rounded-xl flex justify-between items-center text-left">
                  <div className="text-left">
                    <span className="text-xs font-black text-[#111827] block leading-none">🥉 Bronze-medlem</span>
                    <span className="text-[9px] font-bold text-muted-text block mt-1">Level 1 - 3</span>
                  </div>
                  <span className="text-xs font-black text-primary/50">1.0x (Standard)</span>
                </div>

                {/* Sølv */}
                <div className={`p-3 border rounded-xl flex justify-between items-center text-left ${
                  user.memberStatus.includes('Sølv') ? 'bg-amber-50/20 border-amber-300 ring-1 ring-amber-300/30' : 'bg-gray-50/60 border-gray-200'
                }`}>
                  <div className="text-left">
                    <span className="text-xs font-black text-[#111827] block leading-none">🥈 Sølv-medlem</span>
                    <span className="text-[9px] font-bold text-muted-text block mt-1">Level 4 - 9</span>
                  </div>
                  <span className="text-xs font-black text-[#5F523E]">+10% Multiplier</span>
                </div>

                {/* Guld */}
                <div className={`p-3 border rounded-xl flex justify-between items-center text-left ${
                  user.memberStatus.includes('Guld') ? 'bg-amber-50/25 border-amber-300 ring-2 ring-amber-300/35 shadow-3xs' : 'bg-gray-50/60 border-gray-200'
                }`}>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-primary block leading-none">🥇 Guld-medlem</span>
                      {user.memberStatus.includes('Guld') && (
                        <span className="text-[8px] font-black uppercase text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full leading-none shrink-0 font-sans">
                          Aktiv
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-[#8A714C] block mt-1">Level 10 - 14</span>
                  </div>
                  <span className="text-xs font-black text-amber-700 font-mono">+25% Multiplier 👑</span>
                </div>

                {/* Carbon Champion */}
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex justify-between items-center text-left">
                  <div className="text-left">
                    <span className="text-xs font-black text-primary block leading-none">💎 Carbon-Champion</span>
                    <span className="text-[9px] font-bold text-muted-text block mt-1">Level 15+</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 font-mono">+50% Multiplier 🌍</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button 
                  id="confirm-tiers-done-btn"
                  onClick={() => setShowTiersModal(false)}
                  className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-extrabold text-xs uppercase rounded-xl transition-all shadow-md cursor-pointer text-center"
                >
                  {language === 'da' ? 'Forstået' : 'Got it'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
