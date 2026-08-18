import type { AffiliatePlacement, ChapterMarker, GeneratedPost, PartnerProgramKey } from '../../src/types.ts';
import { rpmBandForNiche, rpmForPartner, normalizeNiche } from './catalog.ts';
import { estimateAdRevenueUsd, estimateAffiliateRevenueUsd, estimateClicks, trackerFromRow } from './monetization.ts';
import { viewShareForPartner } from './monetization.ts';

export interface ScriptRequest {
  topic: string;
  niche: string;
  language: 'da' | 'en';
  targetMinutes: number;
  affiliateUrl: string | null;
  affiliateLabel: string;
  viewsAssumption: number;
  platforms: PartnerProgramKey[];
}

function slugId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function chaptersFor(minutes: number, language: 'da' | 'en'): ChapterMarker[] {
  const beats =
    language === 'da'
      ? [
          { timestamp: '00:00', title: 'Hook — problemet på 3 sekunder' },
          { timestamp: '00:08', title: 'Hvad de fleste gør forkert' },
          { timestamp: '00:35', title: 'Den konkrete metode' },
          { timestamp: minutes >= 8 ? '03:20' : '01:10', title: 'Bevis + tal' },
          { timestamp: minutes >= 8 ? '06:10' : '02:05', title: 'CTA og næste skridt' },
        ]
      : [
          { timestamp: '00:00', title: 'Hook — the 3-second problem' },
          { timestamp: '00:08', title: 'What most people get wrong' },
          { timestamp: '00:35', title: 'The concrete method' },
          { timestamp: minutes >= 8 ? '03:20' : '01:10', title: 'Proof and numbers' },
          { timestamp: minutes >= 8 ? '06:10' : '02:05', title: 'CTA and next step' },
        ];
  return beats;
}

function affiliateLinks(url: string | null, label: string): AffiliatePlacement[] {
  if (!url) {
    return [];
  }
  return [
    { label, url, placement: 'description' },
    { label, url, placement: 'pinned_comment' },
    { label, url, placement: 'end_screen' },
  ];
}

function tagsFor(topic: string, partner: PartnerProgramKey): string[] {
  const base = topic
    .toLowerCase()
    .split(/[^a-z0-9æøå]+/i)
    .filter((part) => part.length > 2)
    .slice(0, 6);
  const partnerTags: Record<PartnerProgramKey, string[]> = {
    youtube_ypp: ['genbrug', 'cirkulærøkonomi', 'ypp', 'howto'],
    youtube_shorts: ['shorts', 'hook', 'viral', 'genbrug'],
    tiktok_rewards: ['fyp', 'tokrewards', '3sek', 'genbrug'],
    meta_reels: ['reels', 'community', 'klima', 'aarhus'],
    x_ads_share: ['thread', 'xads', 'epc', 'klima'],
    affiliate_epc: ['affiliate', 'epc', 'tilbud', 'link'],
  };
  return Array.from(new Set([...base, ...partnerTags[partner]])).slice(0, 12);
}

function copyBank(topic: string, language: 'da' | 'en') {
  if (language === 'en') {
    return {
      hook: `Stop. You are leaking money every time you ignore ${topic}.`,
      ctaLong: `Save this, run the 7-day loop, and drop your result in the comments.`,
      ctaShort: `Follow for the 7-day loop. Link in bio.`,
      pinned: `Full checklist + partner link in the description. No hype — just the loop.`,
    };
  }
  return {
    hook: `Stop. Du taber penge hver gang du ignorerer ${topic}.`,
    ctaLong: `Gem videoen, kør 7-dages loopet, og skriv dit resultat i kommentaren.`,
    ctaShort: `Følg med for 7-dages loopet. Link i bio.`,
    pinned: `Fuld tjekliste + partnerlink ligger i beskrivelsen. Ingen hype — kun loopet.`,
  };
}

function longScript(topic: string, minutes: number, language: 'da' | 'en'): string {
  if (language === 'en') {
    return [
      `HOOK (0-3s): Stop. You are leaking money every time you ignore ${topic}.`,
      `RETENTION (3-12s): Most creators post and pray. This loop turns one idea into five paid surfaces.`,
      `SCENE 1 — Problem: You publish once, then the algorithm forgets you. RPM dies, affiliate EPC never gets a click.`,
      `SCENE 2 — Method: 1) 3-second accusation hook. 2) Proof in 20 seconds. 3) One CTA. 4) Pinned comment with a single link.`,
      `SCENE 3 — Proof: Map the same script to YouTube long-form, Shorts, TikTok, Reels and an X thread without rewriting the thesis.`,
      `SCENE 4 — Objection: "I need more footage." You need tighter cuts, not more footage. Kill every sentence that does not move AVD.`,
      `CTA: Run this on ${topic} for 7 days. ${minutes} minutes of structured talk beats 20 minutes of ramble.`,
      `END SCREEN: Subscribe + the one affiliate link. Never stack three offers.`,
    ].join('\n');
  }
  return [
    `HOOK (0-3s): Stop. Du taber penge hver gang du ignorerer ${topic}.`,
    `FASTHOLDELSE (3-12s): De fleste poster og håber. Dette loop gør én idé til fem betalende flader.`,
    `SCENE 1 — Problem: Du udgiver én gang, og algoritmen glemmer dig. RPM falder, og affiliate-EPC får aldrig et klik.`,
    `SCENE 2 — Metode: 1) 3-sekunders anklage-hook. 2) Bevis på 20 sekunder. 3) Én CTA. 4) Fastgjort kommentar med ét link.`,
    `SCENE 3 — Bevis: Samme thesis mappes til YouTube long-form, Shorts, TikTok, Reels og en X-tråd uden at omskrive kernen.`,
    `SCENE 4 — Indvending: "Jeg mangler footage." Du mangler strammere klip, ikke mere footage. Dræb hver sætning der ikke løfter AVD.`,
    `CTA: Kør dette på ${topic} i 7 dage. ${minutes} minutters struktur slår 20 minutters snak.`,
    `SLUTSKÆRM: Abonnér + det ene affiliate-link. Aldrig tre tilbud ad gangen.`,
  ].join('\n');
}

function shortScript(topic: string, language: 'da' | 'en'): string {
  if (language === 'en') {
    return [
      `0-3s HOOK: ${topic} is silently draining your RPM.`,
      `3-8s: Watch this pattern once — then copy it tonight.`,
      `8-18s: Accusation → proof → one CTA. Cut the rest.`,
      `18-25s: Save + follow. Link in bio. One offer only.`,
    ].join('\n');
  }
  return [
    `0-3s HOOK: ${topic} æder din RPM uden at du ser det.`,
    `3-8s: Se mønsteret én gang — kopiér det i aften.`,
    `8-18s: Anklage → bevis → én CTA. Klip resten.`,
    `18-25s: Gem + følg. Link i bio. Kun ét tilbud.`,
  ].join('\n');
}

function threadScript(topic: string, language: 'da' | 'en'): string {
  if (language === 'en') {
    return [
      `1/ ${topic} is a revenue system, not a content idea.`,
      `2/ Platform 1: YouTube long-form for RPM.`,
      `3/ Platform 2: Shorts/TikTok/Reels for reach.`,
      `4/ Platform 3: X thread for clicks.`,
      `5/ One affiliate link. One pinned comment. Kill the rest.`,
    ].join('\n');
  }
  return [
    `1/ ${topic} er et indtægtssystem, ikke en indholdsidé.`,
    `2/ Flade 1: YouTube long-form til RPM.`,
    `3/ Flade 2: Shorts/TikTok/Reels til rækkevidde.`,
    `4/ Flade 3: X-tråd til klik.`,
    `5/ Ét affiliate-link. Én fastgjort kommentar. Resten dør.`,
  ].join('\n');
}

function descriptionFor(
  topic: string,
  chapters: ChapterMarker[],
  affiliateUrl: string | null,
  language: 'da' | 'en',
): string {
  const chapterLines = chapters.map((chapter) => `${chapter.timestamp} ${chapter.title}`).join('\n');
  const affiliateLine = affiliateUrl
    ? language === 'da'
      ? `Partnerlink: ${affiliateUrl}`
      : `Partner link: ${affiliateUrl}`
    : language === 'da'
      ? 'Intet affiliate-link angivet.'
      : 'No affiliate link provided.';
  if (language === 'en') {
    return `${topic}\n\nChapters:\n${chapterLines}\n\n${affiliateLine}\n\nThis script is generated for retention (AVD) and a single CTA.`;
  }
  return `${topic}\n\nKapitler:\n${chapterLines}\n\n${affiliateLine}\n\nManuskriptet er skrevet til fastholdelse (AVD) og én CTA.`;
}

function titleFor(topic: string, partner: PartnerProgramKey, language: 'da' | 'en'): string {
  const da: Record<PartnerProgramKey, string> = {
    youtube_ypp: `${topic}: 7-dages RPM-loop (uden extra footage)`,
    youtube_shorts: `${topic} på 20 sekunder`,
    tiktok_rewards: `Du gør ${topic} forkert (fix på 15s)`,
    meta_reels: `Send dette til ham der stadig ignorerer ${topic}`,
    x_ads_share: `${topic} er et system. Her er de 5 flader.`,
    affiliate_epc: `${topic} → ét link, højere EPC`,
  };
  const en: Record<PartnerProgramKey, string> = {
    youtube_ypp: `${topic}: the 7-day RPM loop (no extra footage)`,
    youtube_shorts: `${topic} in 20 seconds`,
    tiktok_rewards: `You are doing ${topic} wrong (15s fix)`,
    meta_reels: `Send this to whoever still ignores ${topic}`,
    x_ads_share: `${topic} is a system. Here are the 5 surfaces.`,
    affiliate_epc: `${topic} → one link, higher EPC`,
  };
  return language === 'da' ? da[partner] : en[partner];
}

function scriptFor(topic: string, partner: PartnerProgramKey, minutes: number, language: 'da' | 'en'): string {
  switch (partner) {
    case 'youtube_ypp':
      return longScript(topic, minutes, language);
    case 'youtube_shorts':
    case 'tiktok_rewards':
    case 'meta_reels':
      return shortScript(topic, language);
    case 'x_ads_share':
      return threadScript(topic, language);
    case 'affiliate_epc':
      return language === 'da'
        ? `Pin: "${topic} — ét link, én handling." Verbal CTA ved 70% AVD. Gentag URL i beskrivelse og fastgjort kommentar. Ingen rabatkoder i thumbnail.`
        : `Pin: "${topic} — one link, one action." Verbal CTA at 70% AVD. Repeat the URL in description and pinned comment. No coupon codes on the thumbnail.`;
    default: {
      const exhaustive: never = partner;
      return exhaustive;
    }
  }
}

export function buildPosts(request: ScriptRequest): GeneratedPost[] {
  const niche = normalizeNiche(request.niche);
  const band = rpmBandForNiche(niche);
  const copy = copyBank(request.topic, request.language);
  const chapterList = chaptersFor(request.targetMinutes, request.language);
  const links = affiliateLinks(request.affiliateUrl, request.affiliateLabel);

  return request.platforms.map((partner) => {
    const views = viewShareForPartner(partner, request.viewsAssumption);
    const rpm = partner === 'affiliate_epc' ? 0 : rpmForPartner(niche, partner);
    const clicks = estimateClicks(views, band.ctrPercent * (partner === 'affiliate_epc' ? 1 : 0.35));
    const row = {
      partner,
      views,
      rpmUsd: rpm,
      clicks,
      adRevenueUsd: partner === 'affiliate_epc' ? 0 : estimateAdRevenueUsd(views, rpm),
      affiliateRevenueUsd:
        partner === 'affiliate_epc'
          ? estimateAffiliateRevenueUsd(clicks, request.affiliateUrl ? band.affiliateEpc : 0)
          : 0,
      totalUsd: 0,
    };
    row.totalUsd = Math.round((row.adRevenueUsd + row.affiliateRevenueUsd) * 100) / 100;
    const isShort =
      partner === 'youtube_shorts' || partner === 'tiktok_rewards' || partner === 'meta_reels';

    return {
      id: slugId('post'),
      partner,
      title: titleFor(request.topic, partner, request.language),
      hook: copy.hook,
      script: scriptFor(request.topic, partner, request.targetMinutes, request.language),
      description: descriptionFor(request.topic, chapterList, request.affiliateUrl, request.language),
      tags: tagsFor(request.topic, partner),
      chapters: isShort ? chapterList.slice(0, 2) : chapterList,
      thumbnailPrompt: '',
      pinnedComment: request.affiliateUrl
        ? `${copy.pinned} ${request.affiliateUrl}`
        : copy.pinned,
      cta: isShort ? copy.ctaShort : copy.ctaLong,
      affiliateLinks: links,
      estimatedMetrics: trackerFromRow(
        row,
        isShort ? 18 : band.avdLongSeconds,
        band.ctrPercent,
      ),
    };
  });
}

export const DEFAULT_PLATFORMS: PartnerProgramKey[] = [
  'youtube_ypp',
  'youtube_shorts',
  'tiktok_rewards',
  'meta_reels',
  'x_ads_share',
  'affiliate_epc',
];
