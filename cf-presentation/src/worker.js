// Cloudflare Worker — בונה מצגות תחת slide.nextli.co.il
//   /                       → דף בית (יצירת מצגת חדשה + רשימת קיימות)
//   /api/decks              → רשימת המצגות השמורות (מ-KV)
//   /<deck>                 → מגיש את שלד המצגת (index.html); תוכן נטען מ-KV
//   GET  /<deck>/api/content → תוכן המצגת מ-KV (ריק = מצגת חדשה, מתחילה מתבנית)
//   POST /<deck>/api/content → שמירת תוכן ל-KV (מוגן בסיסמה: x-edit-password)
// מצגות עצמאיות (HTML מלא משלהן) — מוגשות מ-public/decks/<name>.html
const CUSTOM_DECKS = ['ecommerce-bot'];
// מצגות מוגנות שאי אפשר למחוק (מסומנות "מובנית")
const PROTECTED_DECKS = ['ecommerce-bot', 'whatsapp-bot'];
// תבנית קבועה למצגות עצמאיות (HTML משלהן) — לתצוגת תווית כהה/בהיר בדף הבית
const STANDALONE_TEMPLATES = { 'ecommerce-bot': 'light' };

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
      const all = [...new Set([...CUSTOM_DECKS, ...kvDecks])];
      const decks = await Promise.all(all.map(async (name) => {
        let template = STANDALONE_TEMPLATES[name];
        if (!template) template = await env.PRES.get('tmpl:' + name);
        if (template !== 'light' && template !== 'dark') template = 'dark';
        return { name, custom: PROTECTED_DECKS.includes(name), template };
      }));
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
        const tmpl = request.headers.get('x-template');
        if (tmpl === 'light' || tmpl === 'dark') await env.PRES.put('tmpl:' + deck, tmpl);
        return new Response('saved', { status: 200 });
      }
      if (request.method === 'DELETE') {
        const pw = request.headers.get('x-edit-password') || '';
        if (!env.EDIT_PASSWORD || pw !== env.EDIT_PASSWORD) {
          return new Response('unauthorized', { status: 401 });
        }
        if (PROTECTED_DECKS.includes(deck)) {
          return new Response('cannot delete a protected deck', { status: 403 });
        }
        await env.PRES.delete(key);
        await env.PRES.delete('tmpl:' + deck);
        return new Response('deleted', { status: 200 });
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
      // אחרת — שלד מצגת נערכת, לפי תבנית (param ?t או הבחירה השמורה ב-KV)
      let tmpl = url.searchParams.get('t');
      if (tmpl !== 'light' && tmpl !== 'dark') tmpl = await env.PRES.get('tmpl:' + deck);
      const a = new URL(request.url);
      a.pathname = tmpl === 'light' ? '/index-light.html' : '/index.html';
      return env.ASSETS.fetch(new Request(a, request));
    }

    return env.ASSETS.fetch(request);
  },
};
