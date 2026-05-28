/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SENNA KIDS ZONE — functions/api/parent-sync.js                 ║
 * ║  Cloudflare Pages Function (edge worker).                       ║
 * ║  Receives session payloads, validates, stores in KV or logs.    ║
 * ║  Deploy: automatically served at /api/parent-sync via CF Pages  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type':                 'application/json',
  };

  // Parse payload
  let payload;
  try {
    payload = await request.json();
  } catch(_) {
    return new Response(JSON.stringify({ error:'Invalid JSON' }), { status:400, headers:corsHeaders });
  }

  // Basic validation
  if(!payload.sessionId || !payload.platform) {
    return new Response(JSON.stringify({ error:'Missing required fields' }), { status:400, headers:corsHeaders });
  }

  // Sanitise — never trust client data
  const record = {
    sessionId:   String(payload.sessionId).slice(0,64),
    platform:    'senna-kids-zone',
    syncedAt:    new Date().toISOString(),
    lang:        ['en','ne'].includes(payload.lang) ? payload.lang : 'en',
    stepReached: Math.min(Number(payload.stepReached)||0, 15),
    scores:      {
      motor: Math.min(Number(payload.scores?.motor)||0, 100),
      cog:   Math.min(Number(payload.scores?.cog)||0,   100),
      sel:   Math.min(Number(payload.scores?.sel)||0,   100),
    },
    badges:      Array.isArray(payload.badges) ? payload.badges.slice(0,10).map(b=>String(b).slice(0,20)) : [],
    historyLen:  Array.isArray(payload.history) ? payload.history.length : 0,
    streak:      Number(payload.streak?.count)||0,
    appVersion:  String(payload.appVersion||'').slice(0,16),
  };

  // Store in Cloudflare KV if binding exists (optional)
  if(env && env.SKZ_KV) {
    try {
      await env.SKZ_KV.put(
        `session:${record.sessionId}`,
        JSON.stringify(record),
        { expirationTtl: 60*60*24*90 }  // keep 90 days
      );
    } catch(e) {
      console.error('[SKZ Worker] KV write failed:', e.message);
    }
  }

  // Always return success (prevents client errors blocking gameplay)
  return new Response(
    JSON.stringify({ ok:true, received:record.sessionId, ts:record.syncedAt }),
    { status:200, headers:corsHeaders }
  );
}

/* Handle preflight CORS */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
