// Cloudflare Worker — מארח מצגות עריכה תחת slide.nextli.co.il/<deck>
//   GET  /<deck>            → מגיש את המצגת (index.html)
//   GET  /<deck>/api/content → מחזיר את התוכן השמור של אותה מצגת מ-KV
//   POST /<deck>/api/content → שומר תוכן ל-KV (מוגן בסיסמה: x-edit-password)
// כל מצגת מזוהה בנתיב, ולכן אפשר לארח כמה מצגות נפרדות באותו Worker.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '').split('/');
    const deck = parts[0] || '';
    const rest = parts.slice(1).join('/');

    // ----- API: /<deck>/api/content -----
    if (rest === 'api/content' && deck) {
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

    // ----- Serve the deck HTML for /<deck> -----
    if (deck && rest === '') {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = '/index.html';
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    // ----- Root → redirect to the main deck -----
    if (!deck) {
      return Response.redirect(url.origin + '/whatsapp-bot', 302);
    }

    // anything else → static assets (or 404)
    return env.ASSETS.fetch(request);
  },
};
