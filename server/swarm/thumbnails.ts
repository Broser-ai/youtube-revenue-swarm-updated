import type { GeneratedPost, PartnerProgramKey } from '../../src/types.ts';

function aspectFor(partner: PartnerProgramKey): string {
  switch (partner) {
    case 'youtube_ypp':
      return '16:9';
    case 'youtube_shorts':
    case 'tiktok_rewards':
    case 'meta_reels':
      return '9:16';
    case 'x_ads_share':
    case 'affiliate_epc':
      return '1:1';
    default: {
      const exhaustive: never = partner;
      return exhaustive;
    }
  }
}

export function thumbnailPromptFor(topic: string, partner: PartnerProgramKey, language: 'da' | 'en'): string {
  const aspect = aspectFor(partner);
  const face =
    language === 'da'
      ? 'nærbillede af ansigt med høj kontrast, ét øje i skarp skygge, chokeret men troværdigt udtryk'
      : 'tight face crop, high contrast, one eye in hard shadow, shocked but credible expression';
  const object =
    language === 'da'
      ? `stor 3D-genstand der visualiserer "${topic}" i neon-lime mod dyb skovgrøn baggrund`
      : `oversized 3D object visualizing "${topic}" in neon lime against deep forest green`;
  const text =
    language === 'da'
      ? `maks 3 danske ord i ekstra fed grotesk, gul vs sort, ingen stavefejl`
      : `max 3 English words in ultra-bold grotesque, yellow vs black, no spelling errors`;

  return [
    `Cinematic click-thumbnail, ${aspect}, ${face}, ${object}, ${text}.`,
    'Color script: #0B3D2E, #C8F24A, #F5C542, crushed blacks, rim light.',
    'Composition: subject left third, object right third, empty space for title bar.',
    'Avoid: clutter, tiny text, fake play-button, extra fingers, watermarks.',
    'Midjourney: --stylize 250 --v 6 --ar ' + aspect.replace(':', ':'),
    `Flux: photoreal, 8k, hard studio flash, topic="${topic}".`,
    `DALL-E: photoreal thumbnail, no logos, no real celebrity likeness, topic="${topic}".`,
  ].join(' ');
}

export function applyThumbnailPrompts(
  posts: GeneratedPost[],
  topic: string,
  language: 'da' | 'en',
): GeneratedPost[] {
  return posts.map((post) => ({
    ...post,
    thumbnailPrompt: thumbnailPromptFor(topic, post.partner, language),
  }));
}
