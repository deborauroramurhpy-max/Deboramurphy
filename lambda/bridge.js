'use strict';
const SITE = 'https://project-aurora.deborauroramurhpy.chatgpt.site';
function escapeSpeech(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
}
async function callBridge(action, payload = {}, requestId, config = process.env, fetcher = fetch) {
  if (!config.AURORA_SERVICE_TOKEN || !config.AURORA_BRIDGE_TOKEN) {
    const e = new Error('Aurora connection is not configured.'); e.code='NOT_CONNECTED'; throw e;
  }
  const response = await fetcher(SITE + '/api/alexa', {
    method:'POST', redirect:'error', signal:AbortSignal.timeout(4500),
    headers:{'Content-Type':'application/json',
      'OAI-Sites-Authorization':'Bearer ' + config.AURORA_SERVICE_TOKEN,
      'Authorization':'Bearer ' + config.AURORA_BRIDGE_TOKEN},
    body:JSON.stringify({action, ...payload, requestId})
  });
  if (!response.ok) {const e=new Error('Aurora request failed.');e.code='BRIDGE_FAILED';throw e;}
  const text=await response.text();
  if (text.length>24000) throw new Error('Oversized response');
  const data=JSON.parse(text);
  if (!data || typeof data.speech!=='string' || data.speech.length>3500) throw new Error('Invalid response');
  return data;
}
module.exports={callBridge,escapeSpeech};
