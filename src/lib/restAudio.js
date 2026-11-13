// Generated sound for the rest phase (Web Audio API — no music files, no licensing).
// The chord starts from the emotions the user handed to mooca, then slowly glides to one
// calm chord, the same way the visual slowly turns into ooca turquoise.
// Volume and brightness rise on the in-breath and fall on the out-breath.

const CALM = { root: 196, chord: [1, 1.25, 1.5], wobble: 0 }

export function createRestAudio(tones) {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  let ctx
  try {
    ctx = new Ctx()
  } catch {
    return null
  }

  const start = tones.length ? tones : [CALM]
  const master = ctx.createGain()
  master.gain.value = 0
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 600
  filter.Q.value = 0.7
  filter.connect(master)
  master.connect(ctx.destination)

  // One voice per chord note; when several emotions are held, notes from each are layered quietly.
  const voices = []
  start.slice(0, 3).forEach((tone, ti) => {
    tone.chord.forEach((ratio, ni) => {
      const osc = ctx.createOscillator()
      osc.type = ni === 0 ? 'sine' : 'triangle'
      const from = tone.root * ratio * (ti === 0 ? 1 : 2)
      const to = CALM.root * CALM.chord[ni % 3] * (ti === 0 ? 1 : 2)
      osc.frequency.value = from
      const g = ctx.createGain()
      g.gain.value = (ni === 0 ? 0.32 : 0.16) / (ti + 1)
      // Unsettled emotions wobble in pitch; the wobble fades as the rest goes on.
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.3 + tone.wobble * 2.2 + ni * 0.07
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 4 + tone.wobble * 18
      lfo.connect(lfoGain).connect(osc.detune)
      osc.connect(g).connect(filter)
      osc.start()
      lfo.start()
      voices.push({ osc, lfo, lfoGain, from, to })
    })
  })

  // A soft filtered-noise "air" layer that follows the breath.
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = noiseBuf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuf
  noise.loop = true
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 900
  band.Q.value = 0.6
  const air = ctx.createGain()
  air.gain.value = 0
  noise.connect(band).connect(air).connect(master)
  noise.start()

  let muted = false
  const now = () => ctx.currentTime

  return {
    get state() {
      return ctx.state
    },
    async resume() {
      try {
        await ctx.resume()
      } catch {
        /* blocked — caller falls back to visuals only */
      }
      return ctx.state === 'running'
    },
    fadeIn() {
      master.gain.setTargetAtTime(muted ? 0 : 0.5, now(), 1.2)
    },
    // breath: 0 (empty) → 1 (full); progress: 0 → 1 through the rest
    update(breath, progress) {
      const t = now()
      filter.frequency.setTargetAtTime(380 + breath * 1100, t, 0.25)
      air.gain.setTargetAtTime(0.012 + breath * 0.03, t, 0.3)
      voices.forEach((v) => {
        const f = v.from + (v.to - v.from) * Math.min(1, progress * 1.4)
        v.osc.frequency.setTargetAtTime(f, t, 0.8)
        v.lfoGain.gain.setTargetAtTime(v.lfoGain.gain.value * (1 - progress * 0.02), t, 1)
      })
    },
    setMuted(m) {
      muted = m
      master.gain.setTargetAtTime(m ? 0 : 0.5, now(), 0.3)
    },
    stop() {
      master.gain.setTargetAtTime(0, now(), 0.4)
      setTimeout(() => ctx.close().catch(() => {}), 1200)
    },
  }
}
