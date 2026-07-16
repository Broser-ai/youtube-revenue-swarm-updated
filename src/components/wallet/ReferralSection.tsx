import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { UserProfile, Transaction } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { triggerHaptic, HapticPattern } from '../../lib/haptics';

interface ReferralSectionProps {
  user: UserProfile;
  onChangeUser: (updates: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => void;
  language: 'da' | 'en';
  onAddTx: (tx: Transaction) => void;
  onShowSuccessToast: (msg: string) => void;
}

export default function ReferralSection({ user, onChangeUser, language, onAddTx, onShowSuccessToast }: ReferralSectionProps) {
  const { t } = useLanguage();
  const [enteredRefCode, setEnteredRefCode] = useState('');
  const [appliedCodeError, setAppliedCodeError] = useState<string | null>(null);

  const referralCode = user.referralCode || `CIRKEL-${user.fullName.split(' ')[0].substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleCopyReferralCode = () => {
    triggerHaptic(HapticPattern.LIGHT_TAP);
    navigator.clipboard.writeText(referralCode);
    onShowSuccessToast(t('copied'));
  };

  const handleApplyReferralCode = () => {
    triggerHaptic(HapticPattern.LIGHT_TAP);
    setAppliedCodeError(null);
    const cleanCode = enteredRefCode.trim().toUpperCase();
    
    if (!cleanCode.startsWith('CIRKEL-') || cleanCode.length < 9) {
      setAppliedCodeError(t('referral_not_found'));
      return;
    }

    if (user.hasAppliedReferral) {
      alert(language === 'da' ? "Du har allerede indløst en velkomstinvitationskode!" : "You have already applied a welcome invitation code!");
      return;
    }

    onChangeUser(prev => {
      const updated = {
        ...prev,
        points: prev.points + 200,
        hasAppliedReferral: true,
      };
      localStorage.setItem('cirkel_user', JSON.stringify(updated));
      return updated;
    });

    const newTx: Transaction = {
      id: Math.random().toString(),
      title: language === 'da' ? 'Inviterings-gavekort indløst (+200 CP)' : 'Referral welcome bonus claimed (+200 CP)',
      date: language === 'da' ? 'I dag' : 'Today',
      amount: '+200 CP',
      isPoints: true
    };
    onAddTx(newTx);
    setEnteredRefCode('');
    onShowSuccessToast(t('referral_bonus_applied'));
  };

  return (
    <div className="bg-gradient-to-br from-[#182C21] to-[#2E4337] text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col text-left">
      <div className="absolute right-0 bottom-0 w-32 h-32 bg-accent/5 rounded-full blur-xl pointer-events-none" />
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-xl shrink-0 select-none">🎁</div>
        <div className="text-left flex-1">
          <h4 className="text-xs font-black text-accent uppercase tracking-wider leading-none mt-1">{t('inviter_venner')}</h4>
          <p className="text-[11px] text-white/70 font-semibold mt-2 leading-normal">
            {t('inviter_beskrivelse')}
          </p>
        </div>
      </div>

      {/* Copy Referral Code */}
      <div className="flex items-center gap-1.5 mt-5 bg-black/15 border border-white/10 p-3 rounded-2xl justify-between">
        <div className="text-left pl-1.5">
          <span className="text-[9px] font-black text-white/50 uppercase block tracking-wider">{t('din_invitationskode')}</span>
          <span className="text-xs font-black text-accent tracking-widest uppercase block font-mono mt-1 select-all">{referralCode}</span>
        </div>
        <button
          id="copy-referral-code-btn"
          onClick={handleCopyReferralCode}
          className="bg-accent hover:bg-accent/90 text-primary text-[10px] uppercase font-black py-2 px-3.5 rounded-xl cursor-pointer select-none transition-all active:scale-97 flex items-center gap-1 shrink-0"
        >
          <Copy className="w-3 h-3" /> {language === 'da' ? 'Kopier' : 'Copy'}
        </button>
      </div>

      {/* Enter Invitation Code form block */}
      {!user.hasAppliedReferral ? (
        <div className="mt-4 border-t border-white/10 pt-4 flex flex-col gap-2 text-left font-sans">
          <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Blev du inviteret af en ven?</span>
          <div className="flex gap-2">
            <input
              id="referral-input"
              type="text"
              placeholder="F.eks. CIRKEL-NAME-81"
              value={enteredRefCode}
              onChange={(e) => {
                setEnteredRefCode(e.target.value);
                setAppliedCodeError(null);
              }}
              className="flex-1 bg-white/5 rounded-xl border border-white/10 px-3.5 py-2.5 text-xs font-bold placeholder-white/30 text-accent font-mono uppercase tracking-widest outline-hidden focus:border-accent"
            />
            <button
              id="apply-referral-btn"
              onClick={handleApplyReferralCode}
              className="bg-accent text-primary text-[10px] font-black uppercase py-2 px-4 rounded-xl hover:opacity-95 cursor-pointer flex items-center justify-center transition-colors shadow-2xs shrink-0"
            >
              {t('indløs')}
            </button>
          </div>
          {appliedCodeError && (
            <span className="text-[9px] font-bold text-rose-400 mt-1">{appliedCodeError}</span>
          )}
        </div>
      ) : (
        <div className="mt-4 border-t border-white/10 pt-4 flex items-center gap-1.5 text-left text-accent select-none">
          <span className="text-base">✨</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-accent">{t('referral_bonus_applied')}</span>
        </div>
      )}
    </div>
  );
}
