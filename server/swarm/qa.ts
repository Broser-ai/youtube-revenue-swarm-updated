import type { GeneratedPost, SwarmRunResult } from '../../src/types.ts';

export function auditPosts(posts: GeneratedPost[]): string[] {
  const findings: string[] = [];
  for (const post of posts) {
    if (post.hook.trim().length < 8) {
      findings.push(`${post.partner}: hook er for kort.`);
    }
    if (post.script.trim().length < 40) {
      findings.push(`${post.partner}: script er ufuldstændigt.`);
    }
    if (post.tags.length < 3) {
      findings.push(`${post.partner}: under 3 tags.`);
    }
    if (post.thumbnailPrompt.trim().length < 20) {
      findings.push(`${post.partner}: thumbnail-prompt mangler.`);
    }
    if (post.title.trim().length === 0) {
      findings.push(`${post.partner}: titel mangler.`);
    }
  }
  if (posts.length === 0) {
    findings.push('Ingen posts blev genereret.');
  }
  return findings;
}

export function auditRun(result: Pick<SwarmRunResult, 'posts' | 'agents' | 'metrics'>): string[] {
  const findings = auditPosts(result.posts);
  const failedAgents = result.agents.filter((agent) => agent.status === 'error');
  for (const agent of failedAgents) {
    findings.push(`Agent ${agent.id} fejlede: ${agent.lastMessage}`);
  }
  if (result.metrics.length !== result.posts.length) {
    findings.push('Metric-rækker matcher ikke antal posts.');
  }
  return findings;
}
