import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, Search, ArrowUpDown, Copy, ChevronRight, Heart, ExternalLink, 
  Sparkles, Share2, X, Check, CreditCard, Award 
} from 'lucide-react';
import { UserProfile, RewardOffer, Voucher, Transaction } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { triggerHaptic, HapticPattern } from '../../lib/haptics';

interface RewardOffersSectionProps {
  user: UserProfile;
  onChangeUser: (updates: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => void;
  language: 'da' | 'en';
  onAddTx: (tx: Transaction) => void;
  onShowSuccessToast: (msg: string) => void;
}

const REWARD_OFFERS: RewardOffer[] = [
  // Coupons (Kuponer)
  { id: 'coop', emoji: '🛒', partner: 'Coop', description: '50 kr butiks-rabat', cost: 500, category: 'coupon' },
  { id: 'kaffe', emoji: '☕', partner: 'Original Coffee', description: 'Gratis øko kaffe', cost: 200, category: 'coupon' },
  { id: 'biograf', emoji: '🎬', partner: 'Nordisk Film', description: '1 fribillet', cost: 800, category: 'coupon' },
  { id: 'croissant', emoji: '🥐', partner: '7-Eleven', description: 'Friskbagt croissant', cost: 150, category: 'coupon' },
  { id: 'is', emoji: '🍦', partner: 'Paradis Is', description: '2 kugler øko-is', cost: 300, category: 'coupon' },

  // Codes (Rabatkoder)
  { id: 'rejsekort', emoji: '🚆', partner: 'DSB / Rejsekort', description: '25 kr rejse-saldo', cost: 250, category: 'code' },
  { id: 'spotify', emoji: '🎵', partner: 'Spotify Premium', description: '1 mdr fri musik', cost: 600, category: 'code' },
  { id: 'nextory', emoji: '📚', partner: 'Nextory E-bøger', description: '45 dages læsning', cost: 350, category: 'code' },
  { id: 'wolt', emoji: '🍔', partner: 'Wolt Food', description: '30 kr leverings-kode', cost: 400, category: 'code' },
  { id: 'tier', emoji: '🛴', partner: 'Tier Scooters', description: '2 køre-kreditter', cost: 180, category: 'code' },

  // Awards (Miljø-priser & Doneringer)
  { id: 'trae', emoji: '🌳', partner: 'Growing Trees', description: 'Plant et træ i DK', cost: 100, category: 'award' },
  { id: 'havplast', emoji: '🌊', partner: 'Ocean Cleanup', description: 'Fjern 1 kg hav-plast', cost: 150, category: 'award' },
  { id: 'regnskov', emoji: '🐒', partner: 'Verdens Skove', description: 'Beskyt 50m² regnskov', cost: 220, category: 'award' },
  { id: 'solcelle', emoji: '☀️', partner: 'Green Energy', description: 'Doner 10 m solenergi', cost: 80, category: 'award' },
  { id: 'champion_cert', emoji: '🏆', partner: 'Cirkel Clean', description: 'Grøn Ambassadør diplom', cost: 1200, category: 'award' },
];

export default function RewardOffersSection({ user, onChangeUser, language, onAddTx, onShowSuccessToast }: RewardOffersSectionProps) {
  const { t } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'coupon' | 'code' | 'award'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'cost_asc' | 'cost_desc'>('default');

  const [modalOffer, setModalOffer] = useState<RewardOffer | null>(null);
  const [selectedVoucherForBarcode, setSelectedVoucherForBarcode] = useState<Voucher | null>(null);

  // States for dynamic loyalty shop payment selection & success animation
  const [claimPaymentMethod, setClaimPaymentMethod] = useState<'points' | 'balance'>('points');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [redemptVoucher, setRedemptVoucher] = useState<Voucher | null>(null);
  const [redemptCostLabel, setRedemptCostLabel] = useState('');

  // Reset payment method selection and errors on modal change
  useEffect(() => {
    if (modalOffer) {
      setClaimPaymentMethod('points');
      setClaimError(null);
    }
  }, [modalOffer]);

  const handleCopyVoucherCode = (code: string) => {
    triggerHaptic(HapticPattern.LIGHT_TAP);
    navigator.clipboard.writeText(code);
    onShowSuccessToast(t('copied'));
  };

  const handleMarkVoucherUsed = (voucherId: string) => {
    triggerHaptic(HapticPattern.LIGHT_TAP);
    onChangeUser(prev => {
      const updatedVouchers = (prev.vouchers || []).map(v => 
        v.id === voucherId ? { ...v, isUsed: true } : v
      );
      const updated = {
        ...prev,
        vouchers: updatedVouchers
      };
      localStorage.setItem('cirkel_user', JSON.stringify(updated));
      return updated;
    });
    setSelectedVoucherForBarcode(null);
    onShowSuccessToast(language === 'da' ? 'Kupon markeret som brugt!' : 'Coupon marked as used successfully!');
  };

  const handleClaimOffer = (offer: RewardOffer) => {
    triggerHaptic(HapticPattern.LIGHT_TAP);
    const isPoints = claimPaymentMethod === 'points';
    const cashCost = offer.cost / 10;

    if (isPoints) {
      if (user.points < offer.cost) {
        setClaimError(language === 'da'
          ? "Du har desværre ikke point nok til dette tilbud. Scan mere emballage for at optjene Cirkel Points!"
          : "You do not have enough points for this offer. Scan more packagings to earn Cirkel Points!");
        return;
      }
    } else {
      if (user.balance < cashCost) {
        setClaimError(language === 'da'
          ? `Din saldo (${user.balance.toFixed(2)} kr) dækker ikke prisen på ${cashCost.toFixed(2)} kr.`
          : `Your balance (${user.balance.toFixed(2)} kr) does not cover the price of ${cashCost.toFixed(2)} kr.`);
        return;
      }
    }

    // Generate active offline voucher object
    const randomVoucherCode = `${offer.id.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 3); // 3 months validity

    const savedCostValue = isPoints ? offer.cost : cashCost;

    const newVoucher: Voucher = {
      id: Math.random().toString(),
      title: offer.description,
      partner: offer.partner,
      code: randomVoucherCode,
      emoji: offer.emoji,
      cost: savedCostValue,
      expiryDate: expiry.toLocaleDateString(language === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      isUsed: false,
      category: offer.category || 'coupon',
    };

    onChangeUser(prev => {
      const existingVouchers = prev.vouchers || [];
      const updated = {
        ...prev,
        points: isPoints ? prev.points - offer.cost : prev.points,
        balance: isPoints ? prev.balance : Number((prev.balance - cashCost).toFixed(2)),
        vouchers: [newVoucher, ...existingVouchers],
      };
      localStorage.setItem('cirkel_user', JSON.stringify(updated));
      return updated;
    });

    const newTx: Transaction = {
      id: Math.random().toString(),
      title: offer.category === 'award'
        ? `${language === 'da' ? 'Bidrag' : 'Contribution'}: ${offer.partner}`
        : `${language === 'da' ? 'Kupon indløst' : 'Coupon claimed'}: ${offer.partner}`,
      date: language === 'da' ? 'I dag' : 'Today',
      amount: isPoints ? `-${offer.cost} CP` : `-${cashCost.toFixed(2)} kr`,
      isPoints: isPoints
    };
    onAddTx(newTx);
    
    // Save details for beautiful success animation screen instead of a raw toast
    setRedemptVoucher(newVoucher);
    setRedemptCostLabel(isPoints ? `${offer.cost} CP` : `${cashCost.toFixed(2)} kr`);
    setModalOffer(null);
    setShowSuccessAnim(true);
  };

  // Safe voucher filters divided up in coupons - codes - awards
  const storedVouchers = user.vouchers || [];
  const activeCoupons = storedVouchers.filter(v => !v.isUsed && (!v.category || v.category === 'coupon'));
  const activeCodes = storedVouchers.filter(v => !v.isUsed && v.category === 'code');
  const activeAwards = storedVouchers.filter(v => !v.isUsed && v.category === 'award');
  const totalActiveVouchersCount = activeCoupons.length + activeCodes.length + activeAwards.length;

  // Filter reward offers according to chosen sub category & search query & sorting metric
  const filteredRewardOffers = useMemo(() => {
    let result = REWARD_OFFERS.filter(
      offer => selectedCategory === 'all' || offer.category === selectedCategory
    );

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        offer => offer.partner.toLowerCase().includes(q) || offer.description.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'cost_asc') {
      result = [...result].sort((a, b) => a.cost - b.cost);
    } else if (sortBy === 'cost_desc') {
      result = [...result].sort((a, b) => b.cost - a.cost);
    }

    return result;
  }, [selectedCategory, searchQuery, sortBy]);

  // Helper mapping for deep outer promotion redirect addresses
  const getPartnerRedeemLink = (partner: string) => {
    const term = partner.toLowerCase();
    if (term.includes('spotify')) return 'https://www.spotify.com/redeem';
    if (term.includes('wolt')) return 'https://wolt.com';
    if (term.includes('dsb') || term.includes('rejsekort')) return 'https://www.rejsekort.dk';
    if (term.includes('nextory')) return 'https://www.nextory.dk';
    if (term.includes('tier')) return 'https://www.tier.app';
    return 'https://cirkel.app';
  };

  return (
    <>
      {/* Spend points section (LOYALTY SHOP) */}
      <div className="text-left bg-white border border-gray-150 p-5 rounded-3xl shadow-3xs flex flex-col gap-4">
        <div>
          <h4 className="text-xs font-black text-primary uppercase tracking-wider">{t('loyalty_shop_title')}</h4>
          <p className="text-[11px] text-muted-text font-semibold mt-1 leading-normal">
            {t('loyalty_shop_desc')}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x shrink-0">
          {(['all', 'coupon', 'code', 'award'] as const).map((cat) => {
            const isActive = selectedCategory === cat;
            let label = '';
            if (cat === 'all') label = language === 'da' ? 'Alle 🌟' : 'All 🌟';
            else if (cat === 'coupon') label = t('tab_coupons');
            else if (cat === 'code') label = t('tab_codes');
            else if (cat === 'award') label = t('tab_awards');

            return (
              <button
                id={`tab-rewards-${cat}`}
                key={cat}
                onClick={() => {
                  triggerHaptic(HapticPattern.LIGHT_TAP);
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer snap-start shrink-0 select-none ${
                  isActive
                    ? 'bg-primary text-white shadow-3xs scale-102 font-black'
                    : 'bg-gray-55 hover:bg-gray-100 border border-gray-150 text-muted-text'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Search & Sorting Row inside Shop */}
        <div className="flex gap-2 items-center shrink-0">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-primary/40 absolute left-3 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'da' ? "Søg i shop (f.eks. Coop, Wolt...)" : "Search shop (e.g. Coop, Wolt...)"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-150 rounded-xl pl-8.5 pr-8 py-2 text-[10.5px] font-semibold outline-hidden focus:border-primary text-primary transition-colors placeholder:text-primary/35"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary/80 text-xs font-black cursor-pointer"
                title={language === 'da' ? "Ryd søgning" : "Clear search"}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sorter trigger button */}
          <button
            onClick={() => {
              triggerHaptic(HapticPattern.LIGHT_TAP);
              setSortBy(prev => prev === 'default' ? 'cost_asc' : prev === 'cost_asc' ? 'cost_desc' : 'default');
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-150 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-black text-primary select-none cursor-pointer transition-all shrink-0 active:scale-97"
            title={language === 'da' ? "Sorter efter point" : "Sort by points"}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-primary/50 shrink-0" />
            <span className="uppercase tracking-wider text-[8px] font-black">
              {sortBy === 'default' 
                ? (language === 'da' ? 'Sorter' : 'Sort') 
                : sortBy === 'cost_asc' 
                  ? 'CP: ↗' 
                  : 'CP: ↘'
              }
            </span>
          </button>
        </div>

        {/* Dynamic Items Carousel/Grid list */}
        <div className="flex gap-3 overflow-x-auto pb-3 pt-1 snap-x scrollbar-none min-h-[140px]">
          {filteredRewardOffers.length > 0 ? (
            filteredRewardOffers.map((offer) => (
              <button
                id={`offer-${offer.id}-btn`}
                key={offer.id}
                onClick={() => {
                  triggerHaptic(HapticPattern.LIGHT_TAP);
                  setModalOffer(offer);
                }}
                className="bg-gray-50 border border-gray-150 hover:border-primary rounded-2xl p-4 min-w-[140px] max-w-[140px] flex flex-col items-center text-center shadow-3xs snap-start shrink-0 select-none cursor-pointer duration-150 active:scale-97 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-150 flex items-center justify-center text-3xl mb-2.5 shadow-3xs filter drop-shadow-3xs relative">
                  {offer.emoji}
                  {/* Category small badge indicator */}
                  <span className="absolute -top-1.5 -right-1.5 text-[6.5px] bg-primary text-white border border-primary/20 rounded-full px-1.5 py-0.5 scale-90 leading-none font-black uppercase tracking-wider">
                    {offer.category === 'coupon' ? 'coup' : offer.category === 'code' ? 'code' : 'awrd'}
                  </span>
                </div>
                <h4 className="text-xs font-black text-primary truncate w-full">{offer.partner}</h4>
                <p className="text-[10px] text-muted-text font-bold mt-1 h-7 line-clamp-2 leading-tight w-full">{offer.description}</p>
                <div className="bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-xl py-1.5 px-3 mt-3 w-full transition-colors flex items-center justify-center gap-1 font-sans">
                  <Coins className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-[10px] font-black text-primary tracking-wide leading-none">{offer.cost} CP</span>
                </div>
              </button>
            ))
          ) : (
            <div className="w-full text-center py-10 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/20">
              <span className="text-xl">🔍</span>
              <p className="text-xs font-black text-muted-text mt-2">
                {language === 'da' ? 'Ingen resultater matcher søgningen' : 'No matches found in the shop'}
              </p>
              <span className="text-[9px] font-bold text-muted-text mt-1">Prøv at rydde søgefeltet</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Vouchers Wallet List */}
      <div className="text-left">
        <span className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-3">
          {language === 'da' ? 'Mine Fordele & Certifikater' : 'My Items & Certificates'} ({totalActiveVouchersCount})
        </span>
        
        {totalActiveVouchersCount > 0 ? (
          <div className="flex flex-col gap-6">
            
            {/* Category 1: Physical Store Coupons */}
            {activeCoupons.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest pl-1">
                  🎟️ {language === 'da' ? 'Aktive Butikskuponer' : 'Active Shop Coupons'} ({activeCoupons.length})
                </span>
                <div className="flex flex-col gap-2 bg-white border border-gray-200 p-3 rounded-2xl shadow-3xs divide-y divide-gray-100">
                  {activeCoupons.map((voucher) => (
                    <div 
                      id={`active-coupon-${voucher.id}`}
                      key={voucher.id}
                      onClick={() => {
                        triggerHaptic(HapticPattern.LIGHT_TAP);
                        setSelectedVoucherForBarcode(voucher);
                      }}
                      className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0 cursor-pointer group/item text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-150 flex items-center justify-center text-xl shadow-4xs group-hover/item:border-amber-300 shrink-0">
                          {voucher.emoji}
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-[#9CA3AF] uppercase block leading-none">{voucher.partner}</span>
                          <span className="text-xs font-black text-primary leading-tight block mt-1">{voucher.title}</span>
                          <span className="text-[8.5px] font-bold text-muted-text mt-1 block leading-none">{t('kupon_udløb')}: {voucher.expiryDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-primary/40 group-hover/item:text-primary">
                        <span className="text-[9px] font-black uppercase tracking-widest mr-1 invisible xs:visible">Scan</span>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category 2: Digital Promo Codes */}
            {activeCodes.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest pl-1">
                  🔑 {language === 'da' ? 'Digitale Rabatkoder' : 'Digital Promo Codes'} ({activeCodes.length})
                </span>
                <div className="flex flex-col gap-2 bg-white border border-gray-200 p-3 rounded-2xl shadow-3xs divide-y divide-gray-100">
                  {activeCodes.map((voucher) => (
                    <div 
                      id={`active-code-${voucher.id}`}
                      key={voucher.id}
                      onClick={() => {
                        triggerHaptic(HapticPattern.LIGHT_TAP);
                        setSelectedVoucherForBarcode(voucher);
                      }}
                      className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0 cursor-pointer group/item text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-150 flex items-center justify-center text-xl shadow-4xs group-hover/item:border-indigo-300 shrink-0">
                          {voucher.emoji}
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-[#9CA3AF] uppercase block leading-none">{voucher.partner}</span>
                          <span className="text-xs font-black text-primary leading-tight block mt-1">{voucher.title}</span>
                          
                          {/* Easy Instant Copy section on list item itself */}
                          <div className="flex items-center gap-1.5 mt-1 bg-gray-50 p-1 px-2 rounded-md border border-gray-150 inline-flex" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[9.5px] font-extrabold font-mono text-primary/80">{voucher.code}</span>
                            <button 
                              onClick={() => handleCopyVoucherCode(voucher.code)}
                              className="text-primary/45 hover:text-primary transition-colors cursor-pointer"
                              title={language === 'da' ? "Kopier rabatkode" : "Copy promo code"}
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-primary/40 group-hover/item:text-primary">
                        <span className="text-[9px] font-black uppercase tracking-widest mr-1 invisible xs:visible">Indløs</span>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category 3: Eco Donations & Certificates */}
            {activeAwards.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest pl-1">
                  🌳 {language === 'da' ? 'Eko-Certifikater & Mindesmærker' : 'Eco Certificates & Awards'} ({activeAwards.length})
                </span>
                <div className="flex flex-col gap-2 bg-white border border-gray-200 p-3 rounded-2xl shadow-3xs divide-y divide-gray-100">
                  {activeAwards.map((voucher) => (
                    <div 
                      id={`active-award-${voucher.id}`}
                      key={voucher.id}
                      onClick={() => {
                        triggerHaptic(HapticPattern.LIGHT_TAP);
                        setSelectedVoucherForBarcode(voucher);
                      }}
                      className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0 cursor-pointer group/item text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl shadow-4xs group-hover/item:border-emerald-300 shrink-0">
                          {voucher.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-extrabold text-emerald-800 uppercase block leading-none">{voucher.partner}</span>
                            <span className="text-[8.5px] font-black uppercase bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded-md leading-none select-none tracking-wide">Diplom</span>
                          </div>
                          <span className="text-xs font-black text-primary leading-tight block mt-1">{voucher.title}</span>
                          <span className="text-[8.5px] font-medium text-emerald-800 mt-1 block leading-none flex items-center gap-0.5 font-sans">
                            <Heart className="w-3 h-3 text-emerald-600 fill-emerald-600 shrink-0" /> Verified Eco Contribution
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-emerald-600/60 group-hover/item:text-emerald-800 font-sans">
                        <span className="text-[9px] font-black uppercase tracking-widest mr-1 invisible xs:visible">Vis</span>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="text-center p-7 border-2 border-dashed border-gray-200 rounded-3xl bg-white/40">
            <span className="text-2xl select-none">🎟️</span>
            <p className="text-xs font-extrabold text-muted-text mt-2">{t('ingen_kuponer')}</p>
            <p className="text-[10px] text-muted-text font-bold mt-1 leading-normal">
              {language === 'da' ? 'Indløs dine optjente Cirkel Points for at modtage personlige fordele i shoppen!' : 'Spend your points to generate store discounts & eco milestones!'}
            </p>
          </div>
        )}
      </div>

      {/* Claim Offer Confirmation Modal */}
      <AnimatePresence>
        {modalOffer && (
          <div className="fixed inset-0 bg-primary/45 backdrop-blur-xs z-55 flex items-end justify-center p-4 animate-in fade-in duration-200">
            <motion.div 
              className="bg-white rounded-t-[2.5rem] rounded-b-2xl border border-gray-150 max-w-sm w-full p-6 shadow-2xl relative select-none flex flex-col gap-5 text-left"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <button 
                id="close-offer-modal-btn"
                onClick={() => setModalOffer(null)}
                className="absolute right-4 top-4 w-8 h-8 border border-gray-150 rounded-full flex items-center justify-center hover:bg-gray-50 active:scale-90 cursor-pointer text-primary transition-all shadow-3xs"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center mt-3 gap-3">
                <span className="text-5.5.xl mb-1 filter drop-shadow-xs select-none leading-none">{modalOffer.emoji}</span>
                <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">{modalOffer.partner}</span>
                <p className="text-xs text-muted-text font-semibold px-4 mt-1 leading-relaxed">
                  {language === 'da'
                    ? modalOffer.category === 'award'
                      ? `Vil du forvandle dit bidrag til denne miljømæssige indsats i samarbejde med ${modalOffer.partner}? Vælg din foretrukne betalingsmetode nedenfor.`
                      : modalOffer.category === 'code'
                        ? `Vil du aktivere denne partner-rabatkode til ${modalOffer.partner}? Vælg din foretrukne betalingsmetode nedenfor.`
                        : `Vil du generere denne rabatkupon til ${modalOffer.partner}? Vælg din foretrukne betalingsmetode nedenfor.`
                    : modalOffer.category === 'award'
                      ? `Would you like to authorize this eco contribution with ${modalOffer.partner}? Choose your preferred payment method below.`
                      : modalOffer.category === 'code'
                        ? `Would you like to unlock this partner discount key with ${modalOffer.partner}? Choose your preferred payment method below.`
                        : `Do you want to claim this store voucher with ${modalOffer.partner}? Choose your preferred payment method below.`
                  }
                </p>

                {/* Interactive Payment Selector */}
                <div className="w-full flex flex-col gap-1.5 text-left mt-1.5 px-1 font-sans">
                  <span className="text-[9px] font-black tracking-widest text-[#9CA3AF] uppercase">Betalingsmetode / Method</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(HapticPattern.LIGHT_TAP);
                        setClaimPaymentMethod('points');
                        setClaimError(null);
                      }}
                      className={`py-3 px-3.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        claimPaymentMethod === 'points'
                          ? 'bg-primary text-accent border-primary font-black shadow-xs'
                          : 'bg-gray-55 hover:bg-gray-100 text-muted-text border-gray-150 font-bold'
                      }`}
                    >
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>{modalOffer.cost} CP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(HapticPattern.LIGHT_TAP);
                        setClaimPaymentMethod('balance');
                        setClaimError(null);
                      }}
                      className={`py-3 px-3.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        claimPaymentMethod === 'balance'
                          ? 'bg-primary text-accent border-primary font-black shadow-xs'
                          : 'bg-gray-55 hover:bg-gray-100 text-muted-text border-gray-150 font-bold'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      <span>{(modalOffer.cost / 10).toFixed(2)} kr</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Balance Tracker */}
                <div className="flex gap-2 items-center bg-gray-50 border border-gray-150 p-3 rounded-2xl w-full text-left">
                  <Award className="w-4.5 h-4.5 text-primary shrink-0" />
                  <span className="text-[9.5px] font-black text-primary/75 uppercase tracking-wide leading-tight font-sans">
                    {claimPaymentMethod === 'points' ? (
                      language === 'da'
                        ? `Din saldo: ${user.points} CP · Rest efter: ${user.points - modalOffer.cost} CP`
                        : `Your Balance: ${user.points} CP · Remaining: ${user.points - modalOffer.cost} CP`
                    ) : (
                      language === 'da'
                        ? `Din saldo: ${user.balance.toFixed(2)} kr · Rest efter: ${(user.balance - (modalOffer.cost / 10)).toFixed(2)} kr`
                        : `Your Balance: ${user.balance.toFixed(2)} kr · Remaining: ${(user.balance - (modalOffer.cost / 10)).toFixed(2)} kr`
                    )}
                  </span>
                </div>

                {/* Inline error alerts */}
                {claimError && (
                  <div className="bg-rose-50 border border-rose-250 text-rose-600 px-3 py-2.5 rounded-2xl text-[10px] font-black w-full text-center leading-snug">
                    ⚠️ {claimError}
                  </div>
                )}

                <div className="flex gap-3 mt-4 w-full font-sans">
                  <button 
                    id="cancel-claim-btn"
                    onClick={() => setModalOffer(null)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-primary font-extrabold text-xs uppercase py-3.5 rounded-xl cursor-pointer transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    id="confirm-claim-btn"
                    onClick={() => handleClaimOffer(modalOffer)}
                    className="flex-1 bg-accent hover:opacity-95 text-primary font-extrabold text-xs uppercase py-3.5 rounded-xl cursor-pointer transition-colors"
                  >
                    {language === 'da' ? 'Bekræft' : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Digital Coupon & Code & Award Viewer Overlay Modal */}
      <AnimatePresence>
        {selectedVoucherForBarcode && (
          <div className="fixed inset-0 bg-primary/45 backdrop-blur-xs z-55 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <motion.div 
              className="bg-white border border-gray-150 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative select-none flex flex-col gap-5 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button 
                id="close-voucher-modal-btn"
                onClick={() => setSelectedVoucherForBarcode(null)}
                className="absolute right-4 top-4 w-8 h-8 border border-gray-150 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 active:scale-90 cursor-pointer text-primary transition-all shadow-3xs z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* ROUTER 1: In-store Coupon Barcode View */}
              {(!selectedVoucherForBarcode.category || selectedVoucherForBarcode.category === 'coupon') && (
                <>
                  <div className="flex flex-col items-center gap-2 mt-4 text-center">
                    <span className="text-4.5xl leading-none select-none filter drop-shadow-xs">{selectedVoucherForBarcode.emoji}</span>
                    <span className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-widest">{selectedVoucherForBarcode.partner}</span>
                    <h4 className="text-lg font-black text-primary leading-tight">{selectedVoucherForBarcode.title}</h4>
                    <p className="text-[10px] font-bold text-muted-text -mt-1">{t('kupon_udløb')}: {selectedVoucherForBarcode.expiryDate}</p>
                  </div>

                  {/* Simulated Visual Barcode Panel */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-3.5 w-full">
                    <span className="text-[9px] font-black text-muted-text uppercase tracking-wider">{t('stregkode_titel')}</span>
                    
                    {/* Barcode lines */}
                    <div className="flex items-center justify-center h-16 w-full px-2 max-w-[240px] bg-white border border-gray-150 rounded-lg overflow-hidden py-2 select-none">
                      {Array.from({ length: 42 }).map((_, index) => {
                        const widths = [1, 2, 3, 4, 1, 2, 1, 3, 2, 4];
                        const wIndex = index % widths.length;
                        const w = widths[wIndex];
                        const isGapValue = [2, 5, 8, 12, 17, 21, 24, 29, 34, 38].includes(index);
                        return (
                          <div 
                            key={index}
                            className={`h-full ${isGapValue ? 'bg-transparent' : 'bg-primary'}`}
                            style={{ width: `${isGapValue ? w * 2.5 : w}px` }}
                          />
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-gray-150 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors select-all cursor-pointer">
                      <span className="text-xs font-black font-mono tracking-wider text-primary">{selectedVoucherForBarcode.code}</span>
                      <button 
                        onClick={() => handleCopyVoucherCode(selectedVoucherForBarcode.code)}
                        className="p-1 text-primary/45 hover:text-primary transition-colors shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2 border-t border-gray-100 font-sans">
                    <button 
                      id="mark-voucher-used-btn"
                      onClick={() => handleMarkVoucherUsed(selectedVoucherForBarcode.id)}
                      className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-extrabold text-xs uppercase rounded-xl transition-all shadow-md cursor-pointer tracking-wider"
                    >
                      {t('mark_used_btn')}
                    </button>
                  </div>
                </>
              )}

              {/* ROUTER 2: Digital Online Promo Code Redemption */}
              {selectedVoucherForBarcode.category === 'code' && (
                <>
                  <div className="flex flex-col items-center gap-2 mt-4 text-center">
                    <span className="text-4.5xl leading-none select-none filter drop-shadow-xs">{selectedVoucherForBarcode.emoji}</span>
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
                      {language === 'da' ? 'Online Rabatkode' : 'Online Promo Key'}
                    </span>
                    <h4 className="text-lg font-black text-primary leading-tight mt-1">{selectedVoucherForBarcode.partner}</h4>
                    <p className="text-xs font-extrabold text-muted-text -mt-1 leading-tight">{selectedVoucherForBarcode.title}</p>
                    <span className="text-[9px] font-bold text-muted-text block mt-1">{t('kupon_udløb')}: {selectedVoucherForBarcode.expiryDate}</span>
                  </div>

                  {/* Promo content box */}
                  <div className="bg-indigo-50/50 border border-indigo-100/60 rounded-2xl p-4 flex flex-col gap-3.5 text-left w-full">
                    <span className="text-[9px] font-black text-indigo-950 uppercase tracking-wider block text-center">
                      {language === 'da' ? 'Kopier din kode nedenfor' : 'Copy your promo code below'}
                    </span>

                    {/* Copy Box */}
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 select-all cursor-pointer hover:bg-gray-50 transition-colors shadow-2xs">
                      <span className="text-sm font-black font-mono tracking-widest text-[#111827]">{selectedVoucherForBarcode.code}</span>
                      <button 
                        onClick={() => handleCopyVoucherCode(selectedVoucherForBarcode.code)}
                        className="bg-primary text-white hover:bg-primary/95 p-1.5 rounded-lg transition-all active:scale-90 cursor-pointer"
                        title={language === 'da' ? "Kopier rabatkode" : "Copy promo code"}
                      >
                        <Copy className="w-3.5 h-3.5 text-accent" />
                      </button>
                    </div>

                    {/* Simple Instructions */}
                    <div className="flex flex-col gap-1.5 border-t border-indigo-100/50 pt-3 font-sans">
                      <span className="text-[9px] font-black text-indigo-900 uppercase tracking-widest block">Vejledning</span>
                      <ul className="text-[10px] text-indigo-950 font-bold space-y-1 list-decimal list-inside pl-1 leading-relaxed">
                        <li>{language === 'da' ? 'Kopier koden ved at klikke på knappen ovenfor.' : 'Copy the code using the button above.'}</li>
                        <li>{language === 'da' ? 'Klik på knappen nederst for at gå til partner-siden.' : 'Click the button below to visit the partner portal.'}</li>
                        <li>{language === 'da' ? 'Indtast rabatkoden ved betaling for at udløse din rabat.' : 'Paste the promo key during checkout to activate benefits.'}</li>
                      </ul>
                    </div>
                  </div>

                  {/* Action row with Redirection */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 w-full font-sans">
                    <a
                      href={getPartnerRedeemLink(selectedVoucherForBarcode.partner)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-primary text-white font-black text-xs uppercase rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-1.5 animate-pulse"
                    >
                      <span>{language === 'da' ? `Åben i ${selectedVoucherForBarcode.partner}` : `Redeem at ${selectedVoucherForBarcode.partner}`}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-accent" />
                    </a>
                    
                    <button 
                      id="mark-voucher-used-btn"
                      onClick={() => handleMarkVoucherUsed(selectedVoucherForBarcode.id)}
                      className="w-full py-2 border border-gray-200 hover:bg-gray-100 text-primary font-black text-[10px] uppercase rounded-xl transition-colors text-center cursor-pointer"
                    >
                      {language === 'da' ? 'Marker som brugt i shoppen' : 'Mark as deactivated / used'}
                    </button>
                  </div>
                </>
              )}

              {/* ROUTER 3: Eco Award & Donation Certificate Display */}
              {selectedVoucherForBarcode.category === 'award' && (
                <>
                  {/* Beautiful Certificated Frame design */}
                  <div className="border-4 border-emerald-600/35 p-5 bg-stone-50/80 rounded-2xl relative overflow-hidden select-none border-dashed mb-1.5 w-full">
                    
                    {/* Certificate Watermark Stamps */}
                    <div className="absolute -right-5 -bottom-7 w-20 h-20 rounded-full border-4 border-emerald-800/10 flex items-center justify-center font-black select-none pointer-events-none transform -rotate-12 text-[7px] text-emerald-800/20 tracking-wider">
                      VERIFIED IMPACT
                    </div>

                    {/* Seal Badge Decoration top center background */}
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-2xl opacity-15 pointer-events-none select-none">
                      🍁
                    </div>

                    {/* Header text */}
                    <div className="text-center pb-3 border-b border-emerald-600/20">
                      <span className="text-[9.5px] font-black text-emerald-800 tracking-widest block uppercase">Cirkel Miljø-Diplom</span>
                      <span className="text-[6.5px] font-bold text-muted-text block mt-0.5 tracking-wider uppercase font-sans">Verified Certified Contribution</span>
                    </div>

                    {/* Core Credential body */}
                    <div className="my-5 text-center flex flex-col gap-3 font-serif">
                      <p className="text-[10px] text-muted-text font-sans font-medium italic leading-relaxed">
                        {language === 'da' ? 'Nærværende bekræftes hermed, at' : 'This is to officially certify that'}
                      </p>
                      
                      {/* Person Name Sign */}
                      <span className="text-base font-black text-primary font-sans tracking-tight border-b border-primary/25 pb-0.5 max-w-[200px] mx-auto block uppercase">
                        {user.fullName}
                      </span>

                      <p className="text-[10px] text-muted-text font-sans leading-relaxed px-1">
                        {language === 'da' ? (
                          <>
                            har indløst <span className="font-extrabold text-emerald-800 font-mono">{selectedVoucherForBarcode.cost} CP</span> til miljømæssigt formål til gavn for planeten i samarbejde med:
                          </>
                        ) : (
                          <>
                            has spent <span className="font-extrabold text-emerald-800 font-mono">{selectedVoucherForBarcode.cost} CP</span> towards essential eco contributions in partnerships with:
                          </>
                        )}
                      </p>

                      <div className="flex flex-col items-center gap-1.5 my-1.5 font-sans">
                        <span className="text-4.5xl leading-none filter drop-shadow-3xs shrink-0 select-none">{selectedVoucherForBarcode.emoji}</span>
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-wide leading-none">{selectedVoucherForBarcode.partner}</span>
                        <p className="text-[11px] font-bold text-emerald-800 mt-1 block tracking-tight select-none leading-tight">{selectedVoucherForBarcode.title}</p>
                      </div>
                    </div>

                    {/* Verified Footnote */}
                    <div className="flex justify-between items-center border-t border-emerald-600/20 pt-2.5 text-[7px] text-muted-text font-semibold font-sans">
                      <span className="uppercase text-emerald-800/80 font-black">CP Token No: {selectedVoucherForBarcode.code.substring(0, 9)}</span>
                      <span className="tracking-widest uppercase">CIRKEL.APP</span>
                    </div>
                  </div>

                  {/* Share Certificate Actions */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 flex-none font-sans w-full">
                    <button
                      onClick={() => {
                        setSelectedVoucherForBarcode(null);
                        onShowSuccessToast(language === 'da' ? 'Certifikat klar til deling på sociale medier! ✨' : 'Eco receipt prepared for social sharing! ✨');
                      }}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#C8F24A] stroke-[2.5]" />
                      <span>{language === 'da' ? 'Del Mit Miljø-Diplom' : 'Share My Green Certificate'}</span>
                    </button>

                    <button
                      onClick={() => handleCopyVoucherCode(`Jeg har doneret mine Cirkel Points til ${selectedVoucherForBarcode.partner} via Cirkel-appen for at bevirke: ${selectedVoucherForBarcode.title}! 🌳♻️`)}
                      className="w-full py-2 text-primary hover:bg-gray-100 font-black text-[10px] uppercase rounded-xl border border-gray-200 transition-colors cursor-pointer select-none"
                    >
                      {language === 'da' ? 'Kopier Donations-Tekst' : 'Copy contribution text'}
                    </button>
                  </div>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Redemption Success Animation Overlay Modal */}
      <AnimatePresence>
        {showSuccessAnim && redemptVoucher && (
          <div className="fixed inset-0 bg-primary/70 backdrop-blur-md z-55 flex items-center justify-center p-4">
            
            {/* Confetti Explosion Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
              {Array.from({ length: 22 }).map((_, i) => {
                const colors = ['#C8F24A', '#58C36A', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
                const size = Math.floor(Math.random() * 8) + 8;
                const rotate = Math.floor(Math.random() * 360);
                const xStart = Math.floor(Math.random() * 300) - 150;
                const xEnd = xStart + Math.floor(Math.random() * 160) - 80;
                
                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-xs shrink-0"
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: colors[i % colors.length],
                      left: '50%',
                      top: '40%',
                    }}
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      scale: 0.1, 
                      rotate: 0, 
                      opacity: 1 
                    }}
                    animate={{ 
                      x: xEnd, 
                      y: Math.floor(Math.random() * 350) + 150, 
                      scale: [1, 0.9, 0.4], 
                      rotate: rotate + 360, 
                      opacity: [1, 1, 0],
                    }}
                    transition={{ 
                      duration: Math.random() * 1.6 + 1.2, 
                      ease: "easeOut",
                      delay: Math.random() * 0.15 
                    }}
                  />
                );
              })}
            </div>

            {/* Main Success Dialog Container */}
            <motion.div 
              className="bg-white border border-gray-150 rounded-[2.5rem] max-w-sm w-full p-7 shadow-3xl relative select-none flex flex-col items-center text-center overflow-hidden"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 180 }}
            >
              {/* Top decoration circles */}
              <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-accent via-[#58C36A] to-primary" />

              {/* Giant Spring Checkmark Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.15 }}
                className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-[#58C36A] text-white rounded-full flex items-center justify-center mb-4.5 mt-2 shadow-lg shadow-emerald-250 relative"
              >
                <Check className="w-10 h-10 stroke-[3.5]" />
                
                {/* Embedded Sparks */}
                <span className="absolute -top-1.5 -right-1.5 text-lg animate-bounce select-none">✨</span>
                <span className="absolute -bottom-1 -left-1 text-md animate-pulse select-none leading-none">🌱</span>
              </motion.div>

              <motion.h4 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-primary leading-tight uppercase tracking-tight"
              >
                {language === 'da' ? 'Indløst!' : 'Claimed Successfully!'}
              </motion.h4>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs text-muted-text font-semibold px-2 mt-1 mb-5"
              >
                {language === 'da' 
                  ? 'Flot arbejde! Dine optjente midler understøtter en sund cirkulær livsstil.' 
                  : 'Fantastic work! Redeeming your currency supports a circular waste-free future!'
                }
              </motion.p>

              {/* Dynamic Spent Cost Highlight Tag */}
              <div className="bg-emerald-50 border border-emerald-200/60 px-5 py-2.5 rounded-2xl flex items-center gap-2 mb-6">
                <span className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">{language === 'da' ? 'FORBRUGT' : 'REDEEMED COST'}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-sm font-extrabold text-emerald-800 font-mono tracking-tight">{redemptCostLabel}</span>
              </div>

              {/* Ticket Coupon Voucher Details View */}
              <div className="w-full bg-slate-55 border border-dashed border-gray-250 rounded-2xl p-4.5 mb-6 text-left relative flex flex-col gap-2.5 font-sans">
                {/* Half-circle coupon notches */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-white border-r border-gray-200" />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-white border-l border-gray-200" />

                <div className="flex items-center gap-2.5 text-left">
                  <span className="text-3.5xl select-none leading-none filter drop-shadow-3xs shrink-0">{redemptVoucher.emoji}</span>
                  <div>
                    <span className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-widest leading-none block">{redemptVoucher.partner}</span>
                    <h5 className="text-sm font-black text-primary leading-snug mt-1">{redemptVoucher.title}</h5>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between select-all cursor-pointer bg-white/70 border rounded-xl px-3.5 py-2 hover:bg-white transition-colors">
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] font-black text-[#9CA3AF] uppercase tracking-wider">{language === 'da' ? 'DIN KODE' : 'PROMO CODE'}</span>
                    <span className="text-xs font-black font-mono tracking-widest text-[#111827] mt-0.5">{redemptVoucher.code}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic(HapticPattern.LIGHT_TAP);
                      navigator.clipboard.writeText(redemptVoucher.code);
                      onShowSuccessToast(language === 'da' ? 'Kopieret til udklipsholder!' : 'Copied to clipboard!');
                    }}
                    className="p-1.5 bg-primary hover:opacity-90 rounded-lg text-white transition-all active:scale-90 select-none shrink-0 cursor-pointer"
                    title={language === 'da' ? "Kopier rabatkode" : "Copy promo code"}
                  >
                    <Copy className="w-3.5 h-3.5 text-accent" />
                  </button>
                </div>

                <div className="text-[9px] font-bold text-muted-text flex items-center justify-between mt-1 px-1 shrink-0 font-sans leading-none">
                  <span>{language === 'da' ? 'Gyldig i 90 dage' : 'Valid for 90 days'}</span>
                  <span>{language === 'da' ? 'Udløb:' : 'Exp:'} {redemptVoucher.expiryDate}</span>
                </div>
              </div>

              {/* Confirm Dismiss Action */}
              <button 
                id="done-success-anim-btn"
                onClick={() => {
                  triggerHaptic(HapticPattern.LIGHT_TAP);
                  setShowSuccessAnim(false);
                  const successMsg = redemptVoucher.category === 'award'
                    ? (language === 'da' ? 'Tak for dit værdifulde bidrag! Se detaljerne under aktive diplomer.' : 'Thank you for your donation! Your impact diploma is ready in active vouchers.')
                    : (language === 'da' ? 'Kuponen er gemt! Scan eller kopier koden under aktive kuponer.' : 'Voucher locked in! Tap show details to view or copy checkout codes inside active vouchers.');
                  onShowSuccessToast(successMsg);
                }}
                className="w-full py-4 bg-primary hover:bg-primary/95 text-white hover:text-accent font-black text-xs uppercase rounded-xl transition-all shadow-md cursor-pointer select-none tracking-widest"
              >
                {language === 'da' ? 'Luk & se kuponpung' : 'Awesome, see wallet'}
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
