// Cloudflare Worker — בונה מצגות תחת slide.nextli.co.il
//   /                       → דף בית (יצירת מצגת חדשה + רשימת קיימות)
//   /api/decks              → רשימת המצגות השמורות (מ-KV)
//   /<deck>                 → מגיש את שלד המצגת (index.html); תוכן נטען מ-KV
//   GET  /<deck>/api/content → תוכן המצגת מ-KV (ריק = מצגת חדשה, מתחילה מתבנית)
//   POST /<deck>/api/content → שמירת תוכן ל-KV (מוגן בסיסמה: x-edit-password)
// מצגות עצמאיות (HTML מלא משלהן) — מוגשות מ-public/decks/<name>.html
const CUSTOM_DECKS = ['ecommerce-bot'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const raw = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    const parts = raw.split('/');
    const deck = decodeURIComponent(parts[0] || '');
    const rest = parts.slice(1).map((p) => { try { return decodeURIComponent(p); } catch (e) { return p; } }).join('/');

    // ----- רשימת מצגות -----
    if (deck === 'api' && rest === 'decks') {
      const list = await env.PRES.list({ prefix: 'deck:' });
      const kvDecks = list.keys.map((k) => k.name.replace(/^deck:/, ''));
      const decks = [...new Set([...CUSTOM_DECKS, ...kvDecks])];
      return new Response(JSON.stringify({ decks }), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      });
    }

    // ----- תוכן מצגת ספציפית -----
    if (rest === 'api/content' && deck && deck !== 'api') {
      const key = 'deck:' + deck;
      if (request.method === 'GET') {
        const content = await env.PRES.get(key);
        return new Response(content || '', {
          headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
        });
      }
      if (request.method === 'POST') {
        const pw = request.headers.get('x-edit-password') || '';
        if (!env.EDIT_PASSWORD || pw !== env.EDIT_PASSWORD) {
          return new Response('unauthorized', { status: 401 });
        }
        const body = await request.text();
        if (body.length > 2000000) return new Response('too large', { status: 413 });
        await env.PRES.put(key, body);
        return new Response('saved', { status: 200 });
      }
      return new Response('method not allowed', { status: 405 });
    }

    // ----- שורש → דף בית -----
    if (!deck) {
      const a = new URL(request.url);
      a.pathname = '/home.html';
      return env.ASSETS.fetch(new Request(a, request));
    }

    // ----- בקשת קובץ סטטי ישיר (.html / .css / ...) -----
    if (/\.[a-z0-9]+$/i.test(deck) && rest === '') {
      return env.ASSETS.fetch(request);
    }

    // ----- עמוד מצגת: /<deck> -----
    if (rest === '') {
      // מצגת עצמאית (HTML מלא משלה) אם קיימת תחת public/decks/<deck>.html
      const customUrl = new URL(request.url);
      customUrl.pathname = '/decks/' + deck + '.html';
      const custom = await env.ASSETS.fetch(new Request(customUrl, request));
      if (custom.status === 200) return custom;
      // אחרת — שלד המצגת הנערכת (תוכן מ-KV)
      const a = new URL(request.url);
      a.pathname = '/index.html';
      return env.ASSETS.fetch(new Request(a, request));
    }

    return env.ASSETS.fetch(request);
  },
};
