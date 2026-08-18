import assert from 'node:assert/strict';
import { test } from 'node:test';
import { estimateAdRevenueUsd, estimateAffiliateRevenueUsd, monetize } from './monetization.ts';
import { buildPosts, DEFAULT_PLATFORMS } from './scripts.ts';
import { applyThumbnailPrompts } from './thumbnails.ts';
import { auditPosts } from './qa.ts';
import { apiError } from './errors.ts';

test('ad revenue uses RPM per thousand views', () => {
  assert.equal(estimateAdRevenueUsd(10000, 4.2), 42);
});

test('affiliate revenue is clicks times EPC', () => {
  assert.equal(estimateAffiliateRevenueUsd(20, 1.5), 30);
});

test('monetize rejects nothing and returns six partner rows', () => {
  const result = monetize({ views: 25000, niche: 'recycling' });
  assert.equal(result.rows.length, 6);
  assert.equal(result.source, 'estimate_catalog');
  assert.ok(result.totalUsd >= 0);
});

test('invalid monetize inputs collapse to zero instead of NaN', () => {
  assert.equal(estimateAdRevenueUsd(-5, 4), 0);
  assert.equal(estimateAffiliateRevenueUsd(Number.NaN, 2), 0);
});

test('script engine emits complete posts for all platforms', () => {
  const posts = applyThumbnailPrompts(
    buildPosts({
      topic: 'PP5 pant i Aarhus',
      niche: 'recycling',
      language: 'da',
      targetMinutes: 8,
      affiliateUrl: 'https://example.com/cirkel',
      affiliateLabel: 'Cirkel',
      viewsAssumption: 25000,
      platforms: DEFAULT_PLATFORMS,
    }),
    'PP5 pant i Aarhus',
    'da',
  );
  assert.equal(posts.length, 6);
  assert.equal(auditPosts(posts).length, 0);
  assert.ok(posts.every((post) => post.hook.length > 8));
  assert.ok(posts.every((post) => post.thumbnailPrompt.includes('Midjourney')));
});

test('error protocol shape', () => {
  const body = apiError('INVALID_INPUT', ['topic'], 'mangler topic');
  assert.equal(body.status, 'error');
  assert.deepEqual(body.missing, ['topic']);
});
