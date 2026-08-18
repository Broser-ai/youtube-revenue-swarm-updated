import type { GoogleGenAI } from '@google/genai';
import type { GeneratedPost } from '../../src/types.ts';

interface HookRewrite {
  postId: string;
  hook: string;
  title: string;
}

export async function polishHooksWithGemini(
  ai: GoogleGenAI | null,
  posts: GeneratedPost[],
  language: 'da' | 'en',
): Promise<GeneratedPost[]> {
  if (!ai || posts.length === 0) {
    return posts;
  }

  try {
    const payload = posts.map((post) => ({
      postId: post.id,
      partner: post.partner,
      title: post.title,
      hook: post.hook,
    }));
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          text:
            language === 'da'
              ? `Stram titel og 3-sekunders hook for hvert objekt. Bevar postId. Svar KUN JSON: {"items":[{"postId":"","hook":"","title":""}]}`
              : `Tighten title and 3-second hook for each object. Keep postId. Reply JSON ONLY: {"items":[{"postId":"","hook":"","title":""}]}`,
        },
        { text: JSON.stringify(payload) },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });
    const parsed = JSON.parse(response.text?.trim() || '{}') as { items?: HookRewrite[] };
    const items = parsed.items || [];
    const byId = new Map(items.map((item) => [item.postId, item]));
    return posts.map((post) => {
      const rewrite = byId.get(post.id);
      if (!rewrite?.hook || !rewrite.title) {
        return post;
      }
      return { ...post, hook: rewrite.hook, title: rewrite.title };
    });
  } catch (error) {
    console.warn('Gemini hook polish skipped:', error instanceof Error ? error.message : error);
    return posts;
  }
}
