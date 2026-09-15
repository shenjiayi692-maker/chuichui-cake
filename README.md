<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="Chui Chui Cake lets a birthday recipient blow out virtual candles to reveal a message">
</p>

<p align="center"><strong>English</strong> · <a href="./README.zh-CN.md">中文</a></p>

> Not there on your friend's birthday? Send them a cake whose candles they blow
> out by breathing at their phone — and the message only appears once the last
> flame is gone.

There is no one-line quickstart for this one: CloudBase needs a real AppID and a
hand-provisioned environment, and the microphone only works on a physical device.
The five setup steps are below.

Chui Chui Cake is a WeChat Mini Program for long-distance birthday wishes. Choose a cake, add candles, write or record a message, and share it. The recipient blows toward the phone microphone; each detected breath extinguishes candles, and the message is revealed only when the last flame disappears.

## The moment

```text
choose a cake → add a message → share a link → blow out candles → reveal the wish
```

- Six CSS-drawn cake themes and five candle colors—no image bundle required
- 1–99 candles, with a compact visual treatment above 20
- Optional voice wish up to 30 seconds
- Cross-device sharing through a CloudBase-backed `cakeId`
- Text and voice reveal, plus a locally rendered keepsake card
- Press-and-hold fallback when microphone permission is unavailable

## How breath detection works

[`blow-detector.js`](./吹吹蛋糕-小程序/utils/blow-detector.js) records 8 kHz, 16-bit mono PCM frames with `wx.getRecorderManager()`. For each frame it computes normalized RMS energy:

```text
rms = sqrt(sum(sample²) / sample_count)
```

A blow is registered after three consecutive frames cross the default `0.08` threshold. A 250 ms cooldown prevents one breath from being counted repeatedly. Each accepted event extinguishes one to three remaining candles and triggers light haptic feedback.

```javascript
new BlowDetector({
  rmsThreshold: 0.05,
  sustainFrames: 2,
  cooldownMs: 200
});
```

> Microphone behavior must be tested on a physical device. WeChat DevTools cannot provide real microphone frames and therefore exercises the press-and-hold fallback.

## Run the Mini Program

1. Install WeChat DevTools and import [`吹吹蛋糕-小程序/`](./吹吹蛋糕-小程序/).
2. Use a real Mini Program AppID; CloudBase does not work with the test account.
3. Create a CloudBase environment and replace `YOUR_ENV_ID` in `app.js`.
4. Create the `cakes` collection, readable by recipients but writable only through the owner-aware backend flow. Create the optional `events` collection for analytics.
5. Deploy all seven folders under `cloudfunctions/` with cloud-side dependency installation.
6. Preview on a phone, create a cake, share it, and blow out the candles.

The detailed setup and troubleshooting guide is in the [Mini Program README](./吹吹蛋糕-小程序/README.md).

## Architecture

| Layer | What it does |
| --- | --- |
| Native WXML / WXSS / JS | Builds the creator, cake, reveal, history, and sharing flows |
| PCM + RMS detector | Turns sustained microphone energy into discrete blow events |
| Seven cloud functions | Create, read, list, delete, track, record completion, and resolve identity |
| Cloud database and storage | Persists cake metadata and optional voice recordings |
| Offscreen canvas | Produces a 750 × 1334 keepsake image for the photo album |

## Current boundary

Version 1.1 is a runnable product prototype, but it is not ready for an unrestricted public launch. Content safety checks, automatic expiry cleanup, photo upload UI, subscription notifications, and recipient reactions remain on the roadmap. The database records an expiry timestamp; no scheduled deletion currently enforces it.

## License

MIT — see [LICENSE](./LICENSE).
