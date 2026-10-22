const attempts = new Map();
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://dzabrys.github.io';
    const headers = {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', Vary:'Origin'};
    if (origin === allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
      headers['Access-Control-Max-Age'] = '600';
    }
    const reply = (status, data) => new Response(JSON.stringify(data), {status, headers});
    if (origin !== allowedOrigin) return reply(403, {ok:false});
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers});
    if (!env.TURNSTILE_SITEKEY || !env.TURNSTILE_SECRET_KEY) return reply(503, {ok:false});
    if (/^[123]x0{10}/.test(env.TURNSTILE_SITEKEY) || /^[123]x0{10}/.test(env.TURNSTILE_SECRET_KEY)) return reply(503, {ok:false});
    if (url.pathname === '/api/captcha/config' && request.method === 'GET') return reply(200, {sitekey:env.TURNSTILE_SITEKEY, testMode:false});
    if (url.pathname !== '/api/captcha/verify') return reply(404, {ok:false});
    if (request.method !== 'POST') return reply(405, {ok:false});
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415, {ok:false});
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    for (const [key, record] of attempts) if (now - record.start > 60000) attempts.delete(key);
    let record = attempts.get(ip);
    if (!record) {
      if (attempts.size >= 1000) return reply(429, {ok:false});
      record = {start:now, count:0}; attempts.set(ip,record);
    }
    if (++record.count > 10) return reply(429, {ok:false});
    try {
      const reader = request.body?.getReader();
      if (!reader) return reply(400, {ok:false});
      let bytes=0;const chunks=[];
      while (true) {
        const {value,done}=await reader.read();if(done)break;
        bytes+=value.byteLength;if(bytes>4096){await reader.cancel();return reply(413,{ok:false});}
        chunks.push(value);
      }
      const data=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}
      let body;try{body=JSON.parse(new TextDecoder().decode(data));}catch{return reply(400,{ok:false});}
      if (!body || typeof body.token !== 'string' || !body.token.trim() || body.token.length>2048 || (body.trap!==undefined && body.trap!=='')) return reply(400,{ok:false});
      const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:body.token,remoteip:ip}),signal:AbortSignal.timeout(10000),
      });
      if(!response.ok)return reply(502,{ok:false});
      const result=await response.json();
      const ok=result.success===true && result.hostname===(env.TURNSTILE_HOSTNAME||'dzabrys.github.io') && result.action==='contact';
      return reply(ok?200:403,{ok});
    } catch { return reply(502,{ok:false}); }
  },
};
