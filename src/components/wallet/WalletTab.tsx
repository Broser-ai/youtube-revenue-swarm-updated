import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, CreditCard, Radio, ShieldCheck, ArrowRight, Smartphone, RefreshCw, Layers } from 'lucide-react';
import { UserProfile, Transaction } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { triggerHaptic, HapticPattern } from '../../lib/haptics';

// Sub-components import
import BalanceCard from './BalanceCard';
import TransactionHistory from './TransactionHistory';

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
  const [isNfcActive, setIsNfcActive] = useState(false);
  const [nfcSuccess, setNfcSuccess] = useState(false);

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

  const handleTriggerNfc = () => {
    triggerHaptic(HapticPattern.LIGHT_TAP);
    setIsNfcActive(true);
    setNfcSuccess(false);

    // Simulate scanning/handshake over NFC/Bluetooth with smartbin
    setTimeout(() => {
      triggerHaptic(HapticPattern.SCAN_SUCCESS);
      setNfcSuccess(true);
      showSuccessToast(
        language === 'da'
          ? 'NFC-Kort parret med Cirkel Smart-Spand! Beholder åbnet. 🔓'
          : 'NFC Card linked to Cirkel Smart Bin! Lid opened. 🔓'
      );
      
      // Auto close after success
      setTimeout(() => {
        setIsNfcActive(false);
        setNfcSuccess(false);
      }, 1500);
    }, 2200);
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

      {/* 1. Main Balance & MobilePay Cash-out Block */}
      <BalanceCard 
        user={user} 
        onChangeUser={onChangeUser} 
        language={language} 
        onAddTx={handleAddTx} 
        onShowSuccessToast={showSuccessToast} 
      />

      {/* 2. Interactive Digital Cirkel Member NFC Card */}
      <div className="bg-white rounded-3xl p-5 border border-primary/5 shadow-xs flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-black tracking-widest text-[#85A912] bg-[#85A912]/10 px-2 py-0.5 rounded border border-[#85A912]/25 uppercase">
            NFC Digital Borger ID
          </span>
          <h3 className="text-sm font-black uppercase text-primary mt-2">
            {language === 'da' ? 'Cirkel Digitale Medlemskort' : 'Cirkel Digital Member Card'}
          </h3>
          <p className="text-[10px] text-primary/50 font-bold mt-1">
            {language === 'da' 
              ? 'Hold din mobil tæt på Cirkels IoT Smart-Spande for automatisk at åbne dem og logge dine indleveringer' 
              : 'Hold your mobile near Cirkel IoT Smart Bins to open them instantly and claim circular credits'}
          </p>
        </div>

        {/* High-fidelity CSS Card representation */}
        <motion.div 
          whileHover={{ scale: 1.02, rotate: -1 }}
          whileTap={{ scale: 0.98 }}
          className="relative h-48 rounded-2xl bg-gradient-to-tr from-primary to-slate-900 border border-white/10 text-white p-5 flex flex-col justify-between overflow-hidden shadow-md cursor-pointer"
          onClick={handleTriggerNfc}
        >
          {/* Wave background decor */}
          <div className="absolute right-0 top-0 w-44 h-44 bg-[#C8F24A]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/4 bottom-0 w-32 h-32 bg-sky-300/5 rounded-full blur-xl pointer-events-none" />

          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[13px] font-black tracking-tighter text-white">cirkel</span>
              <span className="text-[7px] font-extrabold text-[#C8F24A] uppercase tracking-widest leading-none mt-0.5">Eco-Member Card</span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 border border-white/15 px-2 py-0.5 rounded-lg text-[8px] font-mono font-black text-[#C8F24A]">
              <Radio className="w-2.5 h-2.5 animate-pulse text-[#C8F24A]" />
              <span>NFC ACTIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs shadow-inner">
              📱
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/50 leading-none">Borger Navn</span>
              <span className="text-xs font-black text-white mt-1 leading-none">{user.fullName}</span>
            </div>
          </div>

          <div className="flex justify-between items-end border-t border-white/10 pt-2.5">
            <div className="flex flex-col">
              <span className="text-[7.5px] font-black text-white/40 uppercase tracking-widest leading-none">Medlems ID</span>
              <span className="text-[10px] font-mono font-black text-white mt-1 leading-none">
                CP-DK-{user.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[7.5px] font-black text-white/40 uppercase tracking-widest leading-none">Sikkerhedsklasse</span>
              <span className="text-[10px] font-black text-[#C8F24A] mt-1 leading-none flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                MitID Verified
              </span>
            </div>
          </div>
        </motion.div>

        {/* NFC Trigger action button */}
        <button
          id="trigger-nfc-card-btn"
          onClick={handleTriggerNfc}
          disabled={isNfcActive}
          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
            isNfcActive 
              ? 'bg-primary/5 text-primary border border-primary/10' 
              : 'bg-[#C8F24A] hover:bg-[#b5dc3e] text-primary shadow-sm active:scale-98'
          }`}
        >
          {isNfcActive ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{language === 'da' ? 'Søger efter Smart-Spand...' : 'Looking for smart bin...'}</span>
            </div>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>{language === 'da' ? 'Simuler NFC Smart-Spand Parring' : 'Simulate NFC Smart-Bin Pairing'}</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Historic Activity Transaction Logs */}
      <TransactionHistory 
        txs={txs} 
        scansCount={user.scansCount} 
        language={language} 
      />

      {/* NFC Pairing Modal Simulation */}
      <AnimatePresence>
        {isNfcActive && (
          <div className="fixed inset-0 bg-[#002b49]/45 backdrop-blur-xs flex items-center justify-center p-6 z-55 animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-6 relative text-left"
            >
              <div>
                <span className="text-[9px] font-black bg-primary/5 text-primary border border-primary/10 tracking-widest uppercase px-3 py-1 rounded-full">
                  NFC Contactless Engine
                </span>
                <h4 className="text-lg font-black text-primary uppercase tracking-wider mt-3">
                  {language === 'da' ? 'Forbinder med Smart-Spand' : 'Pairing with Smart-Bin'}
                </h4>
                <p className="text-[9px] text-primary/60 font-bold mt-1">
                  {language === 'da' ? 'Hold din telefon tæt på det grønne Cirkel logo på skraldespanden...' : 'Place your simulated device close to the smart waste-bin receptor...'}
                </p>
              </div>

              {/* NFC visual loop */}
              <div className="relative w-32 h-32 rounded-full border border-slate-100 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-2 border-dashed ${nfcSuccess ? 'border-emerald-500 animate-none' : 'border-[#85A912] animate-spin'}`} style={{ animationDuration: '4s' }} />
                
                <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center">
                  {nfcSuccess ? (
                    <motion.div
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg"
                    >
                      <CheckCircle className="w-7 h-7" />
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-3xl"
                    >
                      📡
                    </motion.div>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-primary font-black uppercase">
                {nfcSuccess ? (
                  <span className="text-emerald-700">✓ IoT Beholder Parret! Låget åbner</span>
                ) : (
                  "Udfører kryptografisk handshake..."
                )}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
