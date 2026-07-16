import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, X, Copy } from 'lucide-react';
import { UserProfile, Transaction } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { triggerHaptic, HapticPattern } from '../../lib/haptics';

// Sub-components import
import WeeklyHabitChart from './WeeklyHabitChart';
import MaterialBreakdown from './MaterialBreakdown';
import ImpactMetrics from './ImpactMetrics';
import CommunityLeaderboard from './CommunityLeaderboard';
import MembershipStatus from './MembershipStatus';
import BalanceCard from './BalanceCard';
import ReferralSection from './ReferralSection';
import TransactionHistory from './TransactionHistory';
import RewardOffersSection from './RewardOffersSection';

interface WalletTabProps {
  user: UserProfile;
  onChangeUser: (updates: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => void;
}

const INITIAL_TXS: Transaction[] = [
  { id: 'tx-1', title: 'Plastik sorteret (Drop Point)', date: 'I dag', amount: '+0,75 kr' },
  { id: 'tx-2', title: 'Dåse scannet (Pant-automat)', date: 'I dag', amount: '+0,15 kr' },
  { id: 'tx-3', title: 'Bonus: 10 scanninger streak!', date: 'I går', amount: '+2,00 kr' },
  { id: 'tx-4', title: 'Glasflaske (Hjemme-foto)', date: 'I mandags', amount: '+0,15 kr' },
];

export default function WalletTab({ user, onChangeUser }: WalletTabProps) {
  const { language } = useLanguage();
  
  // Central states
  const [txs, setTxs] = useState<Transaction[]>(() => {
    const cachedTxs = localStorage.getItem('cirkel_txs');
    return cachedTxs ? JSON.parse(cachedTxs) : INITIAL_TXS;
  });

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState('');

  // Sync transactions state to localStorage
  useEffect(() => {
    localStorage.setItem('cirkel_txs', JSON.stringify(txs));
  }, [txs]);

  const showSuccessToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4500);
  };

  const handleAddTx = (newTx: Transaction) => {
    setTxs(prev => [newTx, ...prev]);
  };

  const handleShareImpact = async () => {
    triggerHaptic(HapticPattern.LIGHT_TAP);
    const co2Val = user.co2SavedKg.toFixed(2);
    const drivingVal = (user.co2SavedKg * 8.2).toFixed(1);
    const treesVal = Math.round(user.co2SavedKg * 16.6);
    const bulbsVal = Math.round(user.co2SavedKg * 58);
    const scansCount = user.scansCount;

    const textDa = `🌱 Cirkel — Mit Grønne Regnskab 🌍\n\nJeg har sparet hele ${co2Val} kg CO₂e ved at genanvende ${scansCount} emballager med Cirkel! ♻️\n\nMin klimaindvirkning svarer til:\n🚗 Køre ${drivingVal} km mindre i bil\n🌳 Træ-absorptionsdage: ${treesVal} dage\n💡 Strøm til en LED-pære i ${bulbsVal} timer\n\nBliv en del af Danmarks grønneste fællesskab og modtag CP-belønninger for dit genbrug! 💚\n👉 Hent Cirkel i dag!`;

    const textEn = `🌱 Cirkel — My Green Footprint 🌍\n\nI have prevented ${co2Val} kg of CO₂e emissions by recycling ${scansCount} packagings using Cirkel! ♻️\n\nMy environmental impact is equivalent to:\n🚗 Driving ${drivingVal} km less in a standard car\n🌳 Absorption power: ${treesVal} days of a mature tree\n💡 Powering an LED lightbulb for ${bulbsVal} hours\n\nJoin the future of circular consumption and help protect our planet! 💚\n👉 Get Cirkel today!`;

    const finalText = language === 'da' ? textDa : textEn;
    setShareText(finalText);

    if (navigator.share) {
      try {
        await navigator.share({
          title: language === 'da' ? 'Min Cirkel Klimaindvirkning' : 'My Cirkel Ecological Impact',
          text: finalText,
        });
        triggerHaptic(HapticPattern.SCAN_SUCCESS);
        showSuccessToast(language === 'da' ? 'Delt med succes! 🎉' : 'Shared successfully! 🎉');
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-4 pb-12 flex flex-col gap-6 select-none animate-in fade-in duration-200 text-left">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div 
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-primary border-2 border-accent text-white px-5 py-4 rounded-2xl flex items-center gap-3 shadow-2xl z-55 w-[90%] max-w-md"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
          >
            <div className="bg-accent/10 p-1 rounded-lg shrink-0">
              <CheckCircle className="w-5 h-5 text-accent shrink-0" />
            </div>
            <p className="text-xs font-black leading-tight text-left">{actionSuccess}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Membership Status Block */}
      <MembershipStatus user={user} language={language} />

      {/* 2. Main Balance & MobilePay Cash-out Block */}
      <BalanceCard 
        user={user} 
        onChangeUser={onChangeUser} 
        language={language} 
        onAddTx={handleAddTx} 
        onShowSuccessToast={showSuccessToast} 
      />

      {/* 3. Personal Green Impact Metrics Dashboard */}
      <ImpactMetrics 
        user={user} 
        language={language} 
        onShareImpact={handleShareImpact} 
      />

      {/* 4. Weekly Habits Bar Chart */}
      <WeeklyHabitChart 
        user={user} 
        language={language} 
      />

      {/* 5. Material Breakdown Donut Chart */}
      <MaterialBreakdown 
        user={user} 
        language={language} 
      />

      {/* 6. Friends & Neighbors Community Leaderboard */}
      <CommunityLeaderboard 
        user={user} 
        language={language} 
        onShowSuccessToast={showSuccessToast} 
      />

      {/* 7. Loyalty Discount Shop and Vouchers */}
      <RewardOffersSection 
        user={user} 
        onChangeUser={onChangeUser} 
        language={language} 
        onAddTx={handleAddTx} 
        onShowSuccessToast={showSuccessToast} 
      />

      {/* 8. Viral Referral Rewards Card */}
      <ReferralSection 
        user={user} 
        onChangeUser={onChangeUser} 
        language={language} 
        onAddTx={handleAddTx} 
        onShowSuccessToast={showSuccessToast} 
      />

      {/* 9. Historic Activity Transaction Logs */}
      <TransactionHistory 
        txs={txs} 
        scansCount={user.scansCount} 
        language={language} 
      />

      {/* Share Impact Modal Overlay */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-primary/45 backdrop-blur-xs z-55 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <motion.div
              className="bg-white border border-gray-150 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative select-none flex flex-col gap-4 text-left"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button
                id="close-share-modal-btn"
                onClick={() => setShowShareModal(false)}
                className="absolute right-4 top-4 w-8 h-8 border border-gray-150 rounded-full flex items-center justify-center hover:bg-gray-50 active:scale-90 cursor-pointer text-primary transition-all shadow-3xs"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-2.5 items-center mt-3 text-left">
                <span className="text-3xl filter drop-shadow-3xs text-left font-sans select-none animate-bounce">🌱</span>
                <div>
                  <h4 className="text-sm font-black text-primary uppercase tracking-wider">
                    {language === 'da' ? 'Del Dit Grønne Regnskab' : 'Share Your Green Impact'}
                  </h4>
                  <p className="text-[10px] text-muted-text font-semibold">
                    {language === 'da' ? 'Vis dine venner din personlige CO₂e-besparelse' : 'Show friends your personal carbon savings'}
                  </p>
                </div>
              </div>

              {/* Text Area Card Preview */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 text-left font-sans select-all cursor-default max-h-60 overflow-y-auto">
                <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-2 leading-none">
                  {language === 'da' ? 'FORHÅNDSVISNING AF DELING' : 'SHARE TEXT PREVIEW'}
                </span>
                <p className="text-[11px] text-primary font-bold whitespace-pre-wrap leading-relaxed">
                  {shareText}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 font-sans">
                <button
                  id="copy-share-text-btn"
                  onClick={() => {
                    triggerHaptic(HapticPattern.LIGHT_TAP);
                    navigator.clipboard.writeText(shareText);
                    showSuccessToast(language === 'da' ? 'Kopieret til udklipsholder! 📋' : 'Copied to clipboard! 📋');
                    setShowShareModal(false);
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{language === 'da' ? 'Kopier & Luk' : 'Copy & Close'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
