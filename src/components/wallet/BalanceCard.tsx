import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, ArrowUpRight, X } from 'lucide-react';
import { UserProfile, Transaction } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { triggerHaptic, HapticPattern } from '../../lib/haptics';

interface BalanceCardProps {
  user: UserProfile;
  onChangeUser: (updates: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => void;
  language: 'da' | 'en';
  onAddTx: (tx: Transaction) => void;
  onShowSuccessToast: (msg: string) => void;
}

export default function BalanceCard({ user, onChangeUser, language, onAddTx, onShowSuccessToast }: BalanceCardProps) {
  const { t } = useLanguage();
  const [mobilePayModal, setMobilePayModal] = useState(false);
  const [amountToPayout, setAmountToPayout] = useState(user.balance.toString());

  const getMultiplier = (status: string) => {
    if (status.includes('Sølv')) return 1.1;
    if (status.includes('Guld')) return 1.25;
    if (status.includes('Carbon') || status.includes('Diamond')) return 1.5;
    return 1.0;
  };

  const currentMultiplier = getMultiplier(user.memberStatus);

  useEffect(() => {
    setAmountToPayout(user.balance.toString());
  }, [user.balance, mobilePayModal]);

  const handlePayOutMobilePay = () => {
    const payoutVal = parseFloat(amountToPayout);
    if (isNaN(payoutVal) || payoutVal <= 0 || payoutVal > user.balance) {
      alert(t('fejl_payout'));
      return;
    }

    const currentTier = user.verificationTier || (user.isMitIDVerified ? 'mitid' : 'standard');
    if (currentTier === 'standard' && payoutVal > 50) {
      alert(language === 'da'
        ? "Grænse overskredet! Som uverificeret standard-bruger kan du maksimalt udbetale 50,00 kr per uge på grund af AML-lovgivningen (Anti-hvidvask). Gå til 'Profil' for at opgradere med CPR eller MitID."
        : "Limit exceeded! Standard unverified users can withdraw a maximum of 50.00 DKK per week due to AML laws. Go to 'Profile' to upgrade with CPR or MitID."
      );
      return;
    }
    if (currentTier === 'cpr' && payoutVal > 250) {
      alert(language === 'da'
        ? "Grænse overskredet! Som CPR-verificeret bruger kan du maksimalt udbetale 250,00 kr per uge. Gå til 'Profil' og fuldfør den fulde MitID-opgradering for ubegrænsede udbetalinger."
        : "Limit exceeded! CPR-verified users can withdraw a maximum of 250.00 DKK per week. Go to 'Profile' and complete MitID upgrade for unlimited payouts."
      );
      return;
    }

    onChangeUser(prev => {
      const updated = {
        ...prev,
        balance: Number((prev.balance - payoutVal).toFixed(2)),
      };
      localStorage.setItem('cirkel_user', JSON.stringify(updated));
      return updated;
    });

    const newTx: Transaction = {
      id: Math.random().toString(),
      title: language === 'da' ? 'Udbetalt til MobilePay' : 'Paid out to MobilePay',
      date: language === 'da' ? 'I dag' : 'Today',
      amount: `-${payoutVal.toFixed(2)} kr`
    };
    onAddTx(newTx);
    setMobilePayModal(false);
    onShowSuccessToast(t('udbetal_success'));
  };

  return (
    <>
      {/* Main Balance card matching circular dynamic look */}
      <div className="bg-primary text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col text-left">
        {/* Vector Background Arch */}
        <div className="absolute right-0 top-0 w-36 h-36 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
        
        <span className="text-xs font-black text-white/40 tracking-wider uppercase">
          {language === 'da' ? 'DIN SALDO' : 'YOUR BALANCE'}
        </span>
        <h3 className="text-4.5xl font-black text-accent mt-2 tracking-tighter leading-none animate-once animate-fade-in">
          {user.balance.toFixed(2)} kr
        </h3>

        <div className="flex flex-col gap-1 mt-4 border-t border-white/10 pt-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Coins className="w-4 h-4 shrink-0 animate-pulse" />
            <span>{user.points} Cirkel Points (CP)</span>
          </div>
          {currentMultiplier > 1.0 && (
            <p className="text-[10px] text-accent/85 font-semibold">
              ✨ {user.memberStatus} Boost: {currentMultiplier}x {language === 'da' ? 'point-multiplikator aktiv!' : 'points multiplier active!'}
            </p>
          )}
        </div>

        <button 
          id="payout-mobilepay-btn"
          onClick={() => {
            triggerHaptic(HapticPattern.LIGHT_TAP);
            setMobilePayModal(true);
          }}
          className="mt-6 w-full bg-accent hover:opacity-95 text-primary text-sm font-black py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 shadow-sm"
        >
          {language === 'da' ? 'Udbetal til MobilePay' : 'Cash out to MobilePay'} <ArrowUpRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* MobilePay cashout modal dialog container */}
      <AnimatePresence>
        {mobilePayModal && (
          <div className="fixed inset-0 bg-primary/45 backdrop-blur-xs z-55 flex items-center justify-center p-4">
            <motion.div 
              className="bg-white border border-gray-150 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative select-none flex flex-col gap-4 text-left"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button 
                id="close-mobilepay-modal-btn"
                onClick={() => setMobilePayModal(false)}
                className="absolute right-4 top-4 w-8 h-8 border border-gray-150 rounded-full flex items-center justify-center hover:bg-gray-50 active:scale-90 cursor-pointer text-primary transition-all shadow-3xs"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-2.5 items-center mt-3 text-left">
                <span className="text-3xl filter drop-shadow-3xs text-left">📲</span>
                <div>
                  <h4 className="text-sm font-black text-primary uppercase tracking-wider">{language === 'da' ? 'Udbetaling til MobilePay' : 'MobilePay Cash-out'}</h4>
                  <p className="text-[10px] text-muted-text font-semibold">{language === 'da' ? 'Overfør dine indløste pantpenge direkte til din bankkonto.' : 'Withdraw your redeemed recycling cash directly to your bank account.'}</p>
                </div>
              </div>

              {/* Verified Badge and status information */}
              <div className="bg-gray-50/70 border border-gray-200 p-3.5 rounded-2xl text-left flex flex-col gap-1.5">
                <span className="text-[8.5px] font-black text-muted-text uppercase tracking-widest block leading-none">VERIFIKATIONS-STATISTIK</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[11px] font-black text-primary uppercase tracking-wider">
                    {(() => {
                      const currentTier = user.verificationTier || (user.isMitIDVerified ? 'mitid' : 'standard');
                      if (currentTier === 'mitid') return language === 'da' ? '🛡️ Fuldt verificeret (MitID)' : '🛡️ Fully verified (MitID)';
                      if (currentTier === 'cpr') return language === 'da' ? '📝 CPR-verificeret' : '📝 CPR-verified';
                      return language === 'da' ? '⚠️ Uverificeret Standard' : '⚠️ Unverified Standard';
                    })()}
                  </span>
                  <span className="text-[9.5px] font-bold text-[#059669]">
                    {(() => {
                      const currentTier = user.verificationTier || (user.isMitIDVerified ? 'mitid' : 'standard');
                      if (currentTier === 'mitid') return language === 'da' ? 'Ingen grænser' : 'No limits';
                      if (currentTier === 'cpr') return language === 'da' ? 'Max 250 kr/uge' : 'Max 250 DKK/wk';
                      return language === 'da' ? 'Max 50 kr/uge' : 'Max 50 DKK/wk';
                    })()}
                  </span>
                </div>
              </div>

              {/* Payout Input Elements */}
              <div className="flex flex-col gap-3 mt-1.5 text-left font-sans">
                {/* Amount to cashout input block */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-wider pl-1">{language === 'da' ? 'Beløb (kr)' : 'Amount (DKK)'}</label>
                  <input
                    id="payout-amount-input"
                    type="number"
                    max={user.balance}
                    min={1}
                    value={amountToPayout}
                    onChange={(e) => setAmountToPayout(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary rounded-xl px-4 py-3 text-xs font-bold text-primary outline-hidden transition-all"
                  />
                </div>

                {/* Telephone MobilePay input block */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-wider pl-1">{language === 'da' ? 'Mobilnummer' : 'Mobile Number'}</label>
                  <input
                    id="payout-phone-input"
                    type="tel"
                    placeholder="f.eks. +45 12 34 56 78"
                    defaultValue={user.phoneNumber || '+45 '}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary rounded-xl px-4 py-3 text-xs font-bold text-primary outline-hidden transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-gray-100">
                <button
                  id="cancel-payout-btn"
                  onClick={() => setMobilePayModal(false)}
                  className="flex-1 py-3.5 border border-gray-150 hover:bg-gray-50 text-muted-text font-black text-xs uppercase rounded-xl transition-all cursor-pointer text-center"
                >
                  {language === 'da' ? 'Annuller' : 'Cancel'}
                </button>
                <button
                  id="confirm-payout-btn"
                  onClick={() => {
                    triggerHaptic(HapticPattern.LIGHT_TAP);
                    handlePayOutMobilePay();
                  }}
                  className="flex-1 py-3.5 bg-primary hover:bg-primary/95 text-white font-black text-xs uppercase rounded-xl transition-all shadow-md cursor-pointer text-center"
                >
                  {language === 'da' ? 'Udbetal nu' : 'Payout now'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
