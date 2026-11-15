# ฝากไว้กับมูก้า — A Little Pause with Mooca

ooca UX/UI test assignment. In about 3 minutes, the user hands what they're carrying to mooca, rests with sound and visuals generated from their feelings, and leaves with a card made from their own answers.

- **Live site:** https://mooca-small-door.vercel.app
- **Figma:** https://www.figma.com/design/SYG2MU4Nc36GQV7fsQryhr/OOCA-Assignment-%7C-Wongsakorn

## Flow

| Step | Screen | Notes |
|---|---|---|
| 1 | Hello | "แค่อยากพักเฉยๆ" skips straight to the rest |
| 2 | Emotions | Drag a capsule into mooca **or** tap it. Long-press a capsule to pick a more specific feeling. Tap a used capsule to take it back. Up to 3. "เราอยากเล่าให้ฟังเอง" opens free text |
| 3 | Time | Swipe or tap the side blobs; tap the centre blob to choose. Skippable. Skipped automatically for "ไม่รู้" |
| 4 | Reflect | mooca's line is chosen from emotion × time (no AI). Several emotions → names the first and "อีก N อย่าง" |
| 5 | Sound ask → Rest | 75 s. Breathe in 4 s / out 6 s. Hold the sphere to breathe in, release to breathe out; it also runs by itself. "พอแล้ว" ends any time |
| 6 | Need | One tap, skippable. Picks the card's small step and whether the ooca button is the main action |
| 7 | Card | Sentence built from the user's choices, insight, small step. Save as PNG |

## Off-path cases

| Case | What happens |
|---|---|
| Nothing chosen / skip | Neutral rest → card "วันนี้คุณให้เวลาตัวเองได้พัก" |
| Time skipped | Reflection and card leave the time out |
| Only "ไม่รู้" | No time question; accepting reflection |
| Only positive feelings | No "need" question after the rest |
| Sound blocked or unavailable | Falls back to visuals only, with a note |
| Reduced motion | Animations off, lighter sphere |
| Risk words in free text | Special-care screen: psychologist at ooca, tap-to-call 1323, optional rest that returns to this screen |
| เศร้า + กดดัน together | Card makes the ooca button primary and shows 1323 gently |
| Closed mid-way | Nothing is stored; there is no backend |

Free text is never stored or sent. It is only checked against a short keyword list (`src/lib/risk.js`). This is not a screening tool.

## Tech

- Vite + React 19, plain CSS
- Drag and long-press: Pointer Events (`src/screens/Emotions.jsx`)
- Rest visual: 2D canvas dotted sphere (`src/components/ParticleSphere.jsx`). Colours start from the chosen emotions and turn into ooca turquoise.
- Rest sound: Web Audio API, generated in the browser (`src/lib/restAudio.js`). No audio files.
- Card image: redrawn on a canvas (`src/lib/drawCard.js`) so it saves the same on iPhone Safari
- All copy: `src/data.js`

```bash
npm install
npm run dev
```

## AI use

Screens, flow and visual design are my own work in Figma. Code was written with help from an AI coding assistant, which the brief allows.
