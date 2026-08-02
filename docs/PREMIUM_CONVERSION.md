# Free → Premium Conversion Strategy

## Goal
Convert Spotify Free users into Premium users so the full Harmony AI agent (Web Playback SDK + device transfer + AI control) becomes available.

## Messaging Principles (Marketing)
- Lead with **benefit**, not restriction
- Be transparent and respectful (no dark patterns)
- Provide a clear, single primary CTA
- Offer a soft exit (“Maybe later”)
- Track the click for conversion analytics

## Implemented Copy
**Headline**: Unlock Full Harmony Control  
**Body**: Your account is on Spotify Free. Upgrade to Premium to enable Web Playback, transfer to iPhone, and full AI agent power.  
**Primary CTA**: Upgrade to Premium  
**Secondary**: Maybe later

## Tracking
The Upgrade button fires a `spotify_premium_upgrade_click` event (Google Analytics / gtag ready).

## Visual Design
- Warm dark gradient background
- Spotify green accent on headline and button
- Soft shadow for depth
- Fully responsive (stacks on mobile)

## Next Optimization Ideas
1. A/B test the headline (“Unlock Full Control” vs “Get Premium Power”)
2. Show a short demo video of iPhone transfer when Free is detected
3. Offer a limited-time “OrgSuite exclusive” messaging if you have a promo code
