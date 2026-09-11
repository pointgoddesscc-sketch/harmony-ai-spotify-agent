/** Fire Harmony events at /api/make-event. Make only receives them if Vercel env is set. */

export async function emitMakeEvent(event, payload = {}) {
  try {
    const res = await fetch('/api/make-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'OrgSuite',
        event,
        payload,
      }),
    });
    return res.json();
  } catch {
    return { ok: false, forwarded: false, status: 'client_error' };
  }
}
