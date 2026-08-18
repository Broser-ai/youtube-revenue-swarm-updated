import type { DispatchPackage, GeneratedPost } from '../../src/types.ts';

function hashtagLine(tags: string[]): string {
  return tags.map((tag) => `#${tag.replace(/\s+/g, '')}`).join(' ');
}

export function buildDispatchPackage(post: GeneratedPost): DispatchPackage {
  switch (post.partner) {
    case 'youtube_ypp': {
      const chapterBlock = post.chapters.map((c) => `${c.timestamp} ${c.title}`).join('\n');
      return {
        partner: post.partner,
        title: post.title.slice(0, 100),
        body: `${post.description}\n\n${chapterBlock}\n\n${hashtagLine(post.tags)}`,
        tags: post.tags,
        pinnedComment: post.pinnedComment,
      };
    }
    case 'youtube_shorts':
      return {
        partner: post.partner,
        title: post.title.slice(0, 100),
        body: `${post.hook}\n\n${post.cta}\n\n${hashtagLine(post.tags)}`,
        tags: post.tags,
        pinnedComment: post.pinnedComment,
      };
    case 'tiktok_rewards':
      return {
        partner: post.partner,
        title: post.title.slice(0, 90),
        body: `${post.hook}\n\n${post.cta}\n\noriginal sound: dry punchy tick + bass drop at 0:03\n${hashtagLine(post.tags)}`,
        tags: post.tags,
        pinnedComment: post.pinnedComment,
      };
    case 'meta_reels':
      return {
        partner: post.partner,
        title: post.title,
        body: `${post.hook}\n\n${post.cta}\nTag en ven der stadig sorterer forkert.\n${hashtagLine(post.tags)}`,
        tags: post.tags,
        pinnedComment: post.pinnedComment,
      };
    case 'x_ads_share':
      return {
        partner: post.partner,
        title: post.title.slice(0, 80),
        body: post.script,
        tags: post.tags,
        pinnedComment: post.pinnedComment,
      };
    case 'affiliate_epc':
      return {
        partner: post.partner,
        title: post.title,
        body: post.affiliateLinks.length
          ? post.affiliateLinks.map((link) => `[${link.placement}] ${link.label}: ${link.url}`).join('\n')
          : post.pinnedComment,
        tags: post.tags,
        pinnedComment: post.pinnedComment,
      };
    default: {
      const exhaustive: never = post.partner;
      return exhaustive;
    }
  }
}

export function buildDispatch(posts: GeneratedPost[]): DispatchPackage[] {
  return posts.map(buildDispatchPackage);
}
