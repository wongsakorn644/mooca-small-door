import { useEffect, useMemo, useRef, useState } from 'react'
import { Header, Icon } from '../components/ui.jsx'
import ParticleSphere from '../components/ParticleSphere.jsx'

export function SoundAsk({ onListen, onVisualOnly }) {
  return (
    <section className="screen screen--soft">
      <Header title="เริ่มพักกันนะ" />
      <div className="soft-card">
        <p className="soft-card__lead">ก่อนเริ่ม...</p>
        <p className="soft-card__ask">
          มูก้าอยากถามว่า
          <br />
          คุณสามารถฟังเสียงได้ไหม ?
        </p>
        <img src="/img/mooca-bubble.png" alt="มูก้าในฟองอากาศ" className="soft-card__mooca" draggable="false" />
        <div className="soft-card__actions">
          <button type="button" className="pill pill--teal" onClick={onListen}>
            <Icon name="volume-on" />
            ฟังเสียงได้
          </button>
          <button type="button" className="pill pill--gray" onClick={onVisualOnly}>
            <Icon name="volume-off" />
            ขอดูแค่ภาพ
          </button>
        </div>
      </div>
    </section>
  )
}

const DURATION = 75 // seconds; "พอแล้ว" ends it any time
const IN_S = 4
const OUT_S = 6

// Step 5 — rest. Breathe in 4 s / out 6 s (about 6 breaths a minute).
// Hold the sphere = breathe in with mooca, let go = breathe out. If nobody touches anything it runs by itself.
export function Rest({ emotions, audio, soundOn, notice, onToggleSound, onDone }) {
  const breathRef = useRef(0)
  const progressRef = useRef(0)
  const holdRef = useRef(false)
  const [label, setLabel] = useState('หายใจเข้า 4 วินาที, หายใจออก 6 วินาที')
  const [showHint, setShowHint] = useState(true)
  const [holding, setHolding] = useState(false)
  const reduceMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const colors = useMemo(() => emotions.flatMap((e) => e.ring), [emotions])
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    let raf
    let last = performance.now()
    const start = last
    let phase = 'in'
    let lastAudio = 0
    let shown = ''
    audio?.fadeIn()

    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const elapsed = (now - start) / 1000
      progressRef.current = Math.min(1, elapsed / DURATION)

      let b = breathRef.current
      if (holdRef.current) {
        phase = 'in'
        b = Math.min(1, b + dt / IN_S)
      } else if (phase === 'in') {
        b = Math.min(1, b + dt / IN_S)
        if (b >= 1) phase = 'out'
      } else {
        b = Math.max(0, b - dt / OUT_S)
        if (b <= 0) phase = 'in'
      }
      breathRef.current = b

      const secs = phase === 'in' ? Math.ceil((1 - b) * IN_S) || 1 : Math.ceil(b * OUT_S) || 1
      const text =
        elapsed < 2.5
          ? 'หายใจเข้า 4 วินาที, หายใจออก 6 วินาที'
          : phase === 'in'
            ? holdRef.current && b >= 1
              ? 'ปล่อยนิ้ว แล้วค่อยๆ หายใจออก'
              : `หายใจเข้า… ${secs}`
            : `หายใจออก… ${secs}`
      if (text !== shown) {
        shown = text
        setLabel(text)
      }
      if (audio && now - lastAudio > 120) {
        lastAudio = now
        audio.update(b, progressRef.current)
      }
      if (elapsed >= DURATION) {
        doneRef.current()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const hintT = setTimeout(() => setShowHint(false), 12000)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hintT)
    }
  }, [audio])

  const hold = (on) => {
    holdRef.current = on
    setHolding(on)
    if (on) setShowHint(false)
  }

  return (
    <section className="screen screen--rest">
      <Header title="เริ่มพักกันนะ" />
      <button
        type="button"
        className="sound-toggle"
        onClick={onToggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? 'ปิดเสียง' : 'เปิดเสียง'}
      >
        <Icon name={soundOn ? 'volume-on' : 'volume-off-white'} />
      </button>

      <div
        className={`rest__sphere ${holding ? 'is-holding' : ''}`}
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
          hold(true)
        }}
        onPointerUp={() => hold(false)}
        onPointerCancel={() => hold(false)}
        onKeyDown={(e) => e.key === ' ' && !e.repeat && (e.preventDefault(), hold(true))}
        onKeyUp={(e) => e.key === ' ' && hold(false)}
        onContextMenu={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        aria-label="กดค้างเพื่อหายใจเข้าพร้อมมูก้า ปล่อยเพื่อหายใจออก"
      >
        <ParticleSphere colors={colors} breathRef={breathRef} progressRef={progressRef} reduceMotion={reduceMotion} />
        {showHint && <p className="rest__hint">กดค้างที่วงนี้เพื่อหายใจเข้าพร้อมมูก้า ปล่อยเพื่อหายใจออก</p>}
      </div>

      <p className="rest__breath" aria-live="polite">
        {label}
      </p>
      {notice && <p className="rest__notice">{notice}</p>}
      <button type="button" className="glass-btn rest__done" onClick={onDone}>
        พอแล้ว
      </button>
    </section>
  )
}
