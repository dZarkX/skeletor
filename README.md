# 💀 SKELETOR CHROME EXTENSION 🦴

A (silly) extension that makes a skeleton run across your screen occasionally because why not?

## Features
- **Random Spawns**: He appears when you least expect it.
- **Sound Effects**: Spooky (or silly) sounds accompany his arrival.
- **Pity System**: The longer he doesn't show up, the more likely he is to appear!
- **Offscreen Audio**: Sound plays reliably even if you're busy in another window.
- **Smart Visibility**: Won't interrupt you if your browser is minimized or hidden.
- **Stats**: Track your last spawn time, current probability, and total sightings.

## 🛠️ Usage
- **Just wait**: He will come. Eventually.
- **Check the badge**: The extension icon tooltip tells you the current spawn chance.

### Debug Mode
Impatien? Validate if he's working correctly:
- **Shortcut**: `Ctrl+Shift+K` (Force Spawn)
- **Note**: This resets the "pity timer" just like a real spawn.

## 💰 Support the rattling
If this made you chuckle, consider supporting the bone fund:
- [Buy me a coffee](https://buymeacoffee.com/3mon)
- [Ko-fi](https://ko-fi.com/3mon_)

## Changelog

### v1.1.1
- **Critical Sound Fix**: Fixed `Receiving end does not exist` error by ensuring the offscreen document is active before playing sound.
- **Restricted Sites Fix**: Added a safety check to prevent checking or spawning on restricted URLs (like Chrome Web Store or internal browser pages) which was causing errors.

### v1.0.5
- **Fixed Sound Issue**: Audio now plays via an Offscreen Document, ensuring it works even when the browser is not focused or is behind other windows.
- **Improved Visibility Check**: Added `requestAnimationFrame` detection to prevent spawning when the window is occluded/not rendering.
- **Multi-Monitor Support**: Extension now correctly identifies visible windows across all monitors.
- **Balance Update**: Base spawn chance set to 0.25% per minute (approx 1 spawn every 4-6 hours active time), with linear pity system.

### v1.0.4
- **High Score System**: "Skeletor Record" now tracks your **best single session** score.
- **Bug Fixes**: Fixed an issue where the record counter wasn't updating correctly in real-time.

### v1.0.3
- **Skeletor Record**: Added a persistent counter (now High Score).
- **Session Reset**: "Session Spawns" now correctly resets when you restart your browser.
- **Tooltips**: Added explanatory tooltips to all statistics in the popup.
- **Minimized Window Fix**: The skeleton will no longer spawn (or play sound) if the browser window is minimized.
- **Language Support**: Added/Updated support for Polish, English, German, Russian, Spanish, and Portuguese.

### v1.0.2
- **Fixed spawn rate**: The probability now increases by **0.1%** every minute (was 0.5% + 0.1%).
- **Fixed locales**: Corrected text encoding for Polish language.

### v1.0.1
- **Fixed popup.js**: It now properly saves and loads stats.
- **Added "Session Spawns"**: Tracks how many times he appeared in current session.

## Credits
- **Skeleton Gif**: [Tenor](https://tenor.com/view/skeleton-running-skeleton-running-gif-25636306)

## ⚠️ Warning
May cause sudden skeletons. Do not use if you are allergic to calcium.

---
*Made with 🦴 by 3mon*
