import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Search, X, Share2 } from 'lucide-react';
import { UserProfile } from '../../types';
import { triggerHaptic, HapticPattern } from '../../lib/haptics';

interface CommunityLeaderboardProps {
  user: UserProfile;
  language: 'da' | 'en';
  onShowSuccessToast: (msg: string) => void;
}

export default function CommunityLeaderboard({ user, language, onShowSuccessToast }: CommunityLeaderboardProps) {
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | 'local'>('all');
  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  
  // Local states for cheering
  const [cheeredUsers, setCheeredUsers] = useState<Record<string, boolean>>({});
  const [cheerCounts, setCheerCounts] = useState<Record<string, number>>(() => ({
    'c-1': 42, 'c-2': 38, 'c-3': 29, 'c-4': 25, 'c-5': 19,
    'c-6': 15, 'c-7': 12, 'c-8': 8, 'c-9': 6, 'c-10': 3
  }));

  const DEFAULT_COMMUNITY_USERS = useMemo(() => [
    { id: 'c-1', name: 'Morten Jørgensen', co2SavedKg: 148.4, municipality: 'Aarhus Kommune', cheers: 42 },
    { id: 'c-2', name: 'Freja Schmidt', co2SavedKg: 132.8, municipality: 'Frederikssund Kommune', cheers: 38 },
    { id: 'c-3', name: 'Lars Poulsen', co2SavedKg: 119.5, municipality: 'Odense Kommune', cheers: 29 },
    { id: 'c-4', name: 'Sofie Nielsen', co2SavedKg: 104.2, municipality: 'Aalborg Kommune', cheers: 25 },
    { id: 'c-5', name: 'Henrik Vestergaard', co2SavedKg: 91.7, municipality: 'Aarhus Kommune', cheers: 19 },
    { id: 'c-6', name: 'Astrid Knudsen', co2SavedKg: 83.5, municipality: 'Frederikssund Kommune', cheers: 15 },
    { id: 'c-7', name: 'Mikkel Andersen', co2SavedKg: 52.1, municipality: 'Randers Kommune', cheers: 12 },
    { id: 'c-8', name: 'Ida Rasmussen', co2SavedKg: 34.3, municipality: 'Frederikssund Kommune', cheers: 8 },
    { id: 'c-9', name: 'Jonas Hansen', co2SavedKg: 18.8, municipality: 'Kolding Kommune', cheers: 6 },
    { id: 'c-10', name: 'Emma Christensen', co2SavedKg: 9.2, municipality: 'Frederikssund Kommune', cheers: 3 },
  ], []);

  const combinedLeaderboard = useMemo(() => {
    const userMunicipality = user.municipality || 'Frederikssund Kommune';
    const list = DEFAULT_COMMUNITY_USERS.map(u => ({
      id: u.id,
      name: u.name,
      co2SavedKg: u.co2SavedKg,
      municipality: u.municipality,
      cheers: cheerCounts[u.id] !== undefined ? cheerCounts[u.id] : u.cheers,
      isCurrentUser: false,
    }));

    // Add current user
    list.push({
      id: 'current-user',
      name: (user.fullName || 'Dig') + ' (Dig)',
      co2SavedKg: Number(user.co2SavedKg || 0),
      municipality: userMunicipality,
      cheers: cheeredUsers['current-user'] ? 1 : 0,
      isCurrentUser: true,
    });

    // Sort properly
    list.sort((a, b) => b.co2SavedKg - a.co2SavedKg);

    const ranked = list.map((item, index) => ({
      ...item,
      globalRank: index + 1
    }));

    let filtered = ranked;
    if (leaderboardFilter === 'local') {
      filtered = filtered.filter(item => 
        item.municipality.toLowerCase().includes(userMunicipality.toLowerCase()) ||
        userMunicipality.toLowerCase().includes(item.municipality.toLowerCase()) ||
        item.isCurrentUser
      );
    }

    if (leaderboardSearch.trim() !== '') {
      const q = leaderboardSearch.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.municipality.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [user.co2SavedKg, user.fullName, user.municipality, DEFAULT_COMMUNITY_USERS, leaderboardFilter, leaderboardSearch, cheerCounts, cheeredUsers]);

  const handleCheer = (userId: string) => {
    triggerHaptic(HapticPattern.LIGHT_TAP);
    setCheeredUsers(prev => {
      const hasCheered = prev[userId];
      
      // Update count
      setCheerCounts(counts => {
        const currentCount = counts[userId] || 0;
        return {
          ...counts,
          [userId]: hasCheered ? currentCount - 1 : currentCount + 1
        };
      });

      return {
        ...prev,
        [userId]: !hasCheered
      };
    });
  };

  return (
    <div id="community-leaderboard-card" className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm text-left flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-3xs">
            <Trophy className="w-4 h-4 shrink-0" />
          </div>
          <div>
            <span className="text-[9px] font-black tracking-widest text-[#9CA3AF] uppercase block leading-none">
              {language === 'da' ? 'VENNER & NABOER' : 'FRIENDS & NEIGHBORS'}
            </span>
            <h4 className="text-xs font-black text-primary uppercase tracking-wider mt-1">
              {language === 'da' ? 'Fællesskab & Rangliste' : 'Community Leaderboard'}
            </h4>
          </div>
        </div>
        
        {/* Active User Rank Indicator */}
        {(() => {
          const userRankItem = combinedLeaderboard.find(item => item.isCurrentUser);
          if (!userRankItem) return null;
          return (
            <div className="bg-amber-50/70 border border-amber-150 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-tight">
                {language === 'da' ? `Nr. ${userRankItem.globalRank} i DK` : `#${userRankItem.globalRank} in DK`}
              </span>
            </div>
          );
        })()}
      </div>

      <p className="text-[11px] text-muted-text font-semibold leading-normal">
        {language === 'da'
          ? 'Deltag i den grønne dagsorden! Se hvem der har sparet mest CO₂e gennem genanvendelse, og hep på dine naboer.'
          : 'Join the green movement! See who has saved the most CO₂e through recycling and cheer on your neighbors.'}
      </p>

      {/* Filters & Search Row */}
      <div className="flex flex-col gap-2.5 mt-1">
        {/* Quick Filter tabs */}
        <div className="flex gap-1.5 border-b border-gray-100 pb-2">
          <button
            id="leaderboard-filter-all"
            onClick={() => {
              triggerHaptic(HapticPattern.LIGHT_TAP);
              setLeaderboardFilter('all');
            }}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer border ${
              leaderboardFilter === 'all'
                ? 'bg-primary border-primary text-white shadow-3xs font-black'
                : 'bg-gray-50 border-gray-150 text-gray-500 hover:bg-gray-100'
            }`}
          >
            🇩🇰 {language === 'da' ? 'Hele Landet' : 'All Denmark'}
          </button>
          <button
            id="leaderboard-filter-local"
            onClick={() => {
              triggerHaptic(HapticPattern.LIGHT_TAP);
              setLeaderboardFilter('local');
            }}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer border truncate ${
              leaderboardFilter === 'local'
                ? 'bg-primary border-primary text-white shadow-3xs font-black'
                : 'bg-gray-50 border-gray-150 text-gray-500 hover:bg-gray-100'
            }`}
            title={user.municipality || 'Frederikssund Kommune'}
          >
            📍 {user.municipality ? (user.municipality.replace(' Kommune', '')) : (language === 'da' ? 'Nærområde' : 'Local Area')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            id="leaderboard-search-input"
            type="text"
            value={leaderboardSearch}
            onChange={(e) => setLeaderboardSearch(e.target.value)}
            placeholder={language === 'da' ? 'Søg efter navn eller kommune...' : 'Search by name or city...'}
            className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-2xl pl-9 pr-4 py-2.5 text-primary placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-primary focus:bg-white transition-all"
          />
          {leaderboardSearch && (
            <button
              onClick={() => setLeaderboardSearch('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Rank List */}
      <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {combinedLeaderboard.length === 0 ? (
            <div className="py-8 text-center text-muted-text font-semibold text-[11px] italic">
              {language === 'da' ? 'Ingen deltagere fundet' : 'No participants found'}
            </div>
          ) : (
            combinedLeaderboard.map((item) => {
              const isTop3 = item.globalRank <= 3;
              const medalEmojis = ['🥇', '🥈', '🥉'];
              const hasCheered = cheeredUsers[item.id];

              return (
                <motion.div
                  key={item.id}
                  layoutId={`leaderboard-row-${item.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    item.isCurrentUser
                      ? 'bg-emerald-50/60 border-emerald-200/80 ring-1 ring-emerald-200/50 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50/50'
                  }`}
                >
                  {/* Rank & Profile Image & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Indicator */}
                    <div className="w-7 text-center shrink-0">
                      {isTop3 ? (
                        <span className="text-lg filter drop-shadow-3xs">{medalEmojis[item.globalRank - 1]}</span>
                      ) : (
                        <span className="text-[11px] font-black text-muted-text">#{item.globalRank}</span>
                      )}
                    </div>

                    {/* Initial Avatar */}
                    <div className={`w-8.5 h-8.5 rounded-full shrink-0 flex items-center justify-center font-black text-xs shadow-3xs ${
                      item.isCurrentUser
                        ? 'bg-emerald-600 text-white'
                        : isTop3 
                          ? 'bg-amber-100 text-amber-900 border border-amber-250'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.name.charAt(0)}
                    </div>

                    {/* Name & Region */}
                    <div className="min-w-0">
                      <span className={`text-[11px] font-black block truncate leading-tight ${
                        item.isCurrentUser ? 'text-emerald-900 font-extrabold' : 'text-primary'
                      }`}>
                        {item.name}
                      </span>
                      <span className="text-[9px] font-bold text-muted-text flex items-center gap-1 mt-0.5 leading-none">
                        📍 {item.municipality}
                      </span>
                    </div>
                  </div>

                  {/* CO2 Savings & Cheer Interactive Btn */}
                  <div className="flex items-center gap-3 shrink-0 pl-2">
                    <div className="text-right">
                      <span className={`text-[11px] font-black block leading-none ${
                        item.isCurrentUser ? 'text-emerald-700' : 'text-primary'
                      }`}>
                        {item.co2SavedKg.toFixed(1)} kg
                      </span>
                      <span className="text-[8px] font-extrabold text-[#9CA3AF] uppercase block mt-1 tracking-tight leading-none">
                        {language === 'da' ? 'CO₂e spart' : 'CO₂e saved'}
                      </span>
                    </div>

                    {/* Cheer Button */}
                    <button
                      id={`cheer-btn-${item.id}`}
                      onClick={() => handleCheer(item.id)}
                      className={`h-8.5 px-2.5 rounded-xl border flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                        hasCheered
                          ? 'bg-rose-50 border-rose-250 text-rose-600 font-black'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-rose-50/35 hover:border-rose-150 hover:text-rose-500'
                      }`}
                    >
                      <motion.span
                        animate={hasCheered ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                        className="text-xs"
                      >
                        ❤️
                      </motion.span>
                      <span className="text-[10px] font-black tracking-tight">{item.cheers}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Invite/Share Promo bar */}
      <div className="border-t border-gray-150 pt-3.5 mt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-left">
          <span className="text-[9px] font-black tracking-wider text-muted-text block uppercase leading-none">
            {language === 'da' ? 'VÆR EN INSPIRATION' : 'BE AN INSPIRATION'}
          </span>
          <p className="text-[10px] text-muted-text font-bold mt-1 leading-normal">
            {language === 'da' 
              ? 'Invitér venner med din kode og optjen +100 CP til jer begge!' 
              : 'Invite friends with your code to earn +100 CP for both of you!'}
          </p>
        </div>
        <button
          id="leaderboard-share-btn"
          onClick={() => {
            triggerHaptic(HapticPattern.LIGHT_TAP);
            const referralCode = `CIRKEL-${user.fullName?.split(' ')[0]?.toUpperCase() || 'HERO'}`;
            navigator.clipboard.writeText(referralCode);
            onShowSuccessToast(
              language === 'da'
                ? `Værdikode kopieret: ${referralCode}! Send den til dine venner.`
                : `Referral code copied: ${referralCode}! Share it with friends.`
            );
          }}
          className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white py-2 px-4 rounded-xl text-[10px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5 transition-colors active:scale-97 cursor-pointer border border-primary/10"
        >
          <Share2 className="w-3.5 h-3.5" />
          {language === 'da' ? 'Del & Invitér' : 'Share & Invite'}
        </button>
      </div>
    </div>
  );
}
