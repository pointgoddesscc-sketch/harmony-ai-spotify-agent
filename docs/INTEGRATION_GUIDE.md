# Integration Guide – Premium Conversion + Vercel Proxy + Grok Client

## 1. Premium Conversion (Item 3)

### Update the banner in `index.html`
Replace the existing premium-banner div with:

```html
<div class="premium-banner" id="premium-banner">
  <div class="premium-content">
    <div class="premium-icon">🎧</div>
    <div>
      <strong>Unlock Full Harmony Control</strong>
      <p>Your account is on Spotify Free. Upgrade to Premium to enable Web Playback, transfer to iPhone, and full AI agent power.</p>
    </div>
  </div>
  <div class="premium-actions">
    <a href="https://www.spotify.com/premium/" target="_blank" rel="noopener" class="btn btn-primary" id="btn-upgrade-premium">
      Upgrade to Premium
    </a>
    <button class="btn btn-ghost" id="btn-premium-later">Maybe later</button>
  </div>
</div>
```

### In `src/main.js`
Import and use the new module:

```js
import { handlePremiumStatus } from './premium-conversion.js';

// Inside onAuthenticated(), after you know isPremium:
handlePremiumStatus(isPremium);
```

### CSS
Enhanced premium banner styles have been added to `src/style.css`.

## 2. Vercel-Friendly Proxy (Item 4)

File: `api/harmony.js`

### Setup on Vercel
1. Add environment variable `HARMONY_API_URL` pointing to your running FastAPI backend.
2. Deploy. The proxy becomes available at `/api/harmony`.

### Front-end usage with the proxy
```js
// Point the Grok client to the same-origin proxy
const reply = await sendCommand('list devices', '/api/harmony');
```

Or set:
```
VITE_HARMONY_API_URL=/api/harmony
```

## 3. Quick Marketing Page Snippet
```html
<button id="harmony-cmd-btn" class="btn btn-primary">Ask Harmony AI</button>
<pre id="harmony-reply" style="display:none; margin-top:12px;"></pre>

<script type="module">
  import { setupHarmonyButton } from './src/grok-client.js';
  setupHarmonyButton();
</script>
```

This completes the requested items 2, 3 and 4.
