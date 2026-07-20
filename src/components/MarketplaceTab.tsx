import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ShoppingBag, Gift, Sparkles } from 'lucide-react';
import { UserProfile, Transaction } from '../types';
import { useLanguage } from '../lib/i18n';
import { triggerHaptic, HapticPattern } from '../lib/haptics';

// Import subcomponents directly from the wallet folder
import RewardOffersSection from './wallet/RewardOffersSection';
import ReferralSection from './wallet/ReferralSection';

interface MarketplaceTabProps {
  user: UserProfile;
  onChangeUser: (updates: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => void;
}

export default function MarketplaceTab({ user, onChangeUser }: MarketplaceTabProps) {
  const { language } = useLanguage();
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const showSuccessToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4500);
  };

  const handleAddTx = (newTx: Transaction) => {
    // Append to localStorage transactions history
    const cachedTxs = localStorage.getItem('cirkel_txs');
    const txs: Transaction[] = cachedTxs ? JSON.parse(cachedTxs) : [];
    const updated = [newTx, ...txs];
    localStorage.setItem('cirkel_txs', JSON.stringify(updated));
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

      {/* Header Info Block */}
      <div className="flex items-center gap-3 bg-white p-5 rounded-3xl border border-primary/5 shadow-xs">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <ShoppingBag className="w-5 h-5 text-indigo-700" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase text-primary leading-none">
            {language === 'da' ? 'Marketplace' : 'Marketplace'}
          </h3>
          <p className="text-[10px] text-primary/55 font-bold mt-1">
            {language === 'da' ? 'Brug dine Cirkel Points på grønne rabatkoder og donér til planeten' : 'Spend your circular tokens on organic partner offers or charity donations'}
          </p>
        </div>
      </div>

      {/* Balance Indicator for context */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-indigo-950 flex justify-between items-center">
        <div>
          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-200">Din rådighedssum</span>
          <h4 className="text-2xl font-black tracking-tight text-white mt-1">
            {user.points} <span className="text-indigo-300 text-sm font-black">CP</span>
          </h4>
        </div>
        <div className="bg-white/10 px-3.5 py-2 rounded-2xl border border-white/15 text-right shrink-0">
          <span className="text-[8px] font-bold text-indigo-200 block">Dækværdi i kr</span>
          <span className="text-xs font-mono font-black text-[#C8F24A]">{(user.points / 10).toFixed(2)} kr</span>
        </div>
      </div>

      {/* 1. Loyalty Discount Shop and Vouchers */}
      <RewardOffersSection 
        user={user} 
        onChangeUser={onChangeUser} 
        language={language} 
        onAddTx={handleAddTx} 
        onShowSuccessToast={showSuccessToast} 
      />

      {/* 2. Viral Referral Rewards Card */}
      <ReferralSection 
        user={user} 
        onChangeUser={onChangeUser} 
        language={language} 
        onAddTx={handleAddTx} 
        onShowSuccessToast={showSuccessToast} 
      />

    </div>
  );
}
