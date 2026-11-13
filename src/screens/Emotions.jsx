import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EMOTIONS, byId } from '../data.js'
import { Header, PrimaryButton } from '../components/ui.jsx'

const MAX = 3
const LONG_PRESS_MS = 450
const DRAG_START_PX = 8
const SUB_TINTS = ['#D6DDEE', '#DDF0D2', '#FCE7C2']

// Step 2 — hand emotions to mooca: drag a capsule up into mooca, or tap it.
// Long-press a capsule to pick a more specific feeling. Tap a used capsule to take it back.
export default function Emotions({ value, onChange, onNext, onSkip, onTell }) {
  const screenRef = useRef(null)
  const dropRef = useRef(null)
  const press = useRef(null)
  const [ghost, setGhost] = useState(null)
  const [holding, setHolding] = useState(null)
  const [toast, setToast] = useState('')
  const [gulp, setGulp] = useState(0)

  const usedIds = value.map((v) => v.id)
  const full = value.length >= MAX

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const local = (rect) => {
    const s = screenRef.current.getBoundingClientRect()
    return { x: rect.left - s.left, y: rect.top - s.top, w: rect.width, h: rect.height }
  }
  const dropCenter = () => {
    const r = local(dropRef.current.getBoundingClientRect())
    return { x: r.x + r.w / 2, y: r.y + r.h * 0.48 }
  }

  const add = (id, sub = null) => {
    if (usedIds.includes(id)) return
    if (full) {
      setToast('มูก้ารับได้ทีละ 3 อย่างนะ แตะก้อนที่ฝากไว้เพื่อเอาคืนได้')
      return false
    }
    onChange([...value, { id, sub }])
    setGulp((g) => g + 1)
    if (navigator.vibrate) navigator.vibrate(12)
    return true
  }
  const remove = (id) => onChange(value.filter((v) => v.id !== id))

  // Animate a capsule flying from `from` (local rect) into mooca, then commit.
  const flyIn = (id, from, sub = null) => {
    if (full) {
      setToast('มูก้ารับได้ทีละ 3 อย่างนะ แตะก้อนที่ฝากไว้เพื่อเอาคืนได้')
      setGhost(null)
      return
    }
    const to = dropCenter()
    setGhost({ id, x: from.x + from.w / 2, y: from.y + from.h / 2, w: from.w, h: from.h, anim: false })
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setGhost((g) => g && { ...g, x: to.x, y: to.y, anim: 'in' })),
    )
    setTimeout(() => {
      setGhost(null)
      add(id, sub)
    }, 380)
  }

  const onPointerDown = (e, id) => {
    if (e.button !== undefined && e.button !== 0) return
    const el = e.currentTarget
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* capture is a nicety; drag still works without it */
    }
    const rect = local(el.getBoundingClientRect())
    press.current = { id, x0: e.clientX, y0: e.clientY, rect, dragging: false, long: false, el }
    if (!usedIds.includes(id) && byId[id].subs.length) {
      press.current.timer = setTimeout(() => {
        if (!press.current || press.current.dragging) return
        press.current.long = true
        if (navigator.vibrate) navigator.vibrate(18)
        setHolding({ id, rect })
      }, LONG_PRESS_MS)
    }
  }

  const onPointerMove = (e) => {
    const p = press.current
    if (!p || p.long || usedIds.includes(p.id)) return
    const dx = e.clientX - p.x0
    const dy = e.clientY - p.y0
    if (!p.dragging && Math.hypot(dx, dy) > DRAG_START_PX) {
      p.dragging = true
      clearTimeout(p.timer)
    }
    if (p.dragging) {
      setGhost({
        id: p.id,
        x: p.rect.x + p.rect.w / 2 + dx,
        y: p.rect.y + p.rect.h / 2 + dy,
        w: p.rect.w,
        h: p.rect.h,
        anim: false,
        lifted: true,
      })
    }
  }

  const onPointerUp = (e) => {
    const p = press.current
    press.current = null
    if (!p) return
    clearTimeout(p.timer)
    if (p.long) return
    if (usedIds.includes(p.id)) {
      if (!p.dragging) remove(p.id)
      return
    }
    if (p.dragging) {
      const d = dropRef.current.getBoundingClientRect()
      const inside =
        e.clientX > d.left - 24 && e.clientX < d.right + 24 && e.clientY > d.top - 24 && e.clientY < d.bottom + 40
      if (inside && !full) {
        const to = dropCenter()
        setGhost((g) => g && { ...g, x: to.x, y: to.y, anim: 'in' })
        setTimeout(() => {
          setGhost(null)
          add(p.id)
        }, 320)
      } else {
        if (inside && full) setToast('มูก้ารับได้ทีละ 3 อย่างนะ แตะก้อนที่ฝากไว้เพื่อเอาคืนได้')
        setGhost((g) => g && { ...g, x: p.rect.x + p.rect.w / 2, y: p.rect.y + p.rect.h / 2, anim: 'back' })
        setTimeout(() => setGhost(null), 300)
      }
      return
    }
    flyIn(p.id, p.rect)
  }

  const onPointerCancel = () => {
    const p = press.current
    press.current = null
    if (p) clearTimeout(p.timer)
    setGhost(null)
  }

  const onKey = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (usedIds.includes(id)) remove(id)
      else flyIn(id, local(e.currentTarget.getBoundingClientRect()))
    }
  }

  const pickSub = (sub) => {
    const h = holding
    setHolding(null)
    flyIn(h.id, h.rect, sub)
  }

  return (
    <section
      ref={screenRef}
      className={`screen screen--emotions ${holding ? 'is-holding' : ''}`}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <Header title="ถืออะไรไว้ บอกได้เลย" onSkip={onSkip} light={!!holding} />

      <div className="emo__stage" ref={dropRef}>
        <Rings value={value} />
        <img
          key={gulp}
          src="/img/mooca-listener.png"
          alt={value.length ? `มูก้ารับไว้แล้ว ${value.length} อย่าง` : 'มูก้ารอรับความรู้สึก'}
          className={`emo__mooca ${gulp ? 'is-gulp' : ''}`}
          draggable="false"
        />
        <span className="emo__count" aria-live="polite">
          {value.length ? `ฝากแล้ว ${value.length}/${MAX}` : ''}
        </span>
      </div>

      <div className="sheet emo__sheet">
        <p className="emo__hint">ลากขึ้นไปให้มูก้า หรือแตะเลือก · กดค้างเพื่อเลือกละเอียดขึ้น</p>
        <div className="emo__grid" role="group" aria-label="อารมณ์ เลือกได้สูงสุด 3 อย่าง">
          {EMOTIONS.map((e) => {
            const used = usedIds.includes(e.id)
            const picked = value.find((v) => v.id === e.id)
            return (
              <button
                key={e.id}
                type="button"
                className={`capsule ${used ? 'is-used' : ''} ${ghost?.id === e.id ? 'is-lifted' : ''}`}
                aria-pressed={used}
                aria-label={used ? `${e.label}${picked?.sub ? ` (${picked.sub})` : ''} ฝากไว้แล้ว แตะเพื่อเอาคืน` : e.label}
                onPointerDown={(ev) => onPointerDown(ev, e.id)}
                onKeyDown={(ev) => onKey(ev, e.id)}
                onContextMenu={(ev) => ev.preventDefault()}
              >
                <img src={`/img/emotions/${e.id}.png`} alt="" draggable="false" />
                {picked?.sub && <span className="capsule__sub">{picked.sub}</span>}
              </button>
            )
          })}
        </div>

        <button type="button" className="link emo__tell" onClick={onTell}>
          เราอยากเล่าให้ฟังเอง
        </button>
        <div className={`emo__next ${value.length ? 'is-in' : ''}`}>
          <PrimaryButton onClick={onNext} tabIndex={value.length ? 0 : -1}>
            ถัดไป
          </PrimaryButton>
        </div>
      </div>

      {ghost && (
        <img
          src={`/img/emotions/${ghost.id}.png`}
          alt=""
          className={`capsule-ghost ${ghost.anim ? `is-${ghost.anim}` : ''} ${ghost.lifted ? 'is-lifted' : ''}`}
          style={{ left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h }}
          draggable="false"
        />
      )}

      {holding && <SubPicker holding={holding} screenRef={screenRef} onPick={pickSub} onClose={() => setHolding(null)} />}

      {toast && (
        <div className="toast" role="alert">
          {toast}
        </div>
      )}
    </section>
  )
}

function SubPicker({ holding, screenRef, onPick, onClose }) {
  const e = byId[holding.id]
  const { x, y, w, h } = holding.rect
  const [sw, setSw] = useState(390)
  useLayoutEffect(() => setSw(screenRef.current.getBoundingClientRect().width), [screenRef])
  const onLeftHalf = x + w / 2 < sw / 2
  const dir = onLeftHalf ? 1 : -1
  const size = w * 0.78
  const spots = [
    { dx: 0.95, dy: -0.5 },
    { dx: 1.05, dy: 0.05 },
    { dx: 0.7, dy: 0.62 },
  ]
  return (
    <div className="subpick" onPointerDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <button
        type="button"
        className="capsule capsule--held"
        style={{ left: x, top: y, width: w, height: h }}
        onClick={() => onPick(null)}
        aria-label={`${e.label} (ไม่ระบุละเอียด)`}
      >
        <img src={`/img/emotions/${e.id}.png`} alt="" draggable="false" />
      </button>
      {e.subs.map((s, i) => (
        <button
          key={s}
          type="button"
          className="subpick__item"
          style={{
            width: size,
            height: size,
            left: x + w / 2 + dir * spots[i].dx * w - size / 2,
            top: y + h / 2 + spots[i].dy * h - size / 2,
            background: SUB_TINTS[i],
            animationDelay: `${i * 50}ms`,
          }}
          onClick={() => onPick(s)}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

// Rings around mooca: one per emotion handed over, all in the Figma gradient (#8FBBEF → #F7BBB9).
// Stacked semi-transparent circles get deeper toward the centre, so each new ring stays visible.
function Rings({ value }) {
  const rs = [160, 134, 110]
  return (
    <svg className="emo__rings" viewBox="0 0 340 340" aria-hidden="true">
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FBBEF" />
          <stop offset="1" stopColor="#F7BBB9" />
        </linearGradient>
      </defs>
      {value.length === 0 && <circle cx="170" cy="170" r={rs[0]} fill="none" stroke="url(#ring-grad)" strokeWidth="1.4" />}
      {value.map((v, i) => (
        <circle key={v.id} className="ring" cx="170" cy="170" r={rs[i]} fill="url(#ring-grad)" opacity={0.42} />
      ))}
    </svg>
  )
}
