import { useRef, useState } from 'react'
import { TIMES } from '../data.js'
import { Header } from '../components/ui.jsx'

// Step 3 — when is it? Swipe (or tap the side blobs) to move, tap the centre blob to choose.
export default function Time({ onPick, onSkip }) {
  const [index, setIndex] = useState(1)
  const swipe = useRef(null)
  const lastSwipe = useRef(0)

  const go = (d) => setIndex((i) => (i + d + TIMES.length) % TIMES.length)

  const onDown = (e) => {
    swipe.current = { x: e.clientX }
  }
  const onUp = (e) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) > 40) {
      lastSwipe.current = Date.now()
      go(dx < 0 ? 1 : -1)
    }
  }
  const justSwiped = () => Date.now() - lastSwipe.current < 300

  return (
    <section className="screen screen--time">
      <Header title="ทบทวนกับมูก้า" onSkip={onSkip} />
      <p className="time__ask">
        มูก้าเริ่มเข้าใจคุณแล้วละ
        <br />
        แต่ช่วยบอกเราอีกนิด
        <br />
        ว่า <span className="accent">ปัญหานั้น...</span>
      </p>

      <div
        className="time__track"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1)
          if (e.key === 'ArrowLeft') go(-1)
        }}
        role="radiogroup"
        aria-label="เรื่องนั้นเกิดขึ้นตอนไหน"
      >
        {TIMES.map((t, i) => {
          const pos = ((i - index + TIMES.length + 1) % TIMES.length) - 1 // -1 left, 0 centre, 1 right
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={pos === 0}
              className={`blob blob--${t.id} ${pos === 0 ? 'is-center' : pos < 0 ? 'is-left' : 'is-right'}`}
              style={{ '--c1': t.colors[0], '--c2': t.colors[1] }}
              onClick={() => {
                if (justSwiped()) return
                if (pos === 0) onPick(t.id)
                else go(pos)
              }}
              tabIndex={pos === 0 ? 0 : -1}
            >
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>
      <p className="time__hint">ปัดเพื่อเปลี่ยน แล้วแตะที่ก้อนเพื่อเลือก</p>

      <div className="time__ground" aria-hidden="true" />
      <img src="/img/mooca-heart.png" alt="" className="time__mooca" aria-hidden="true" draggable="false" />
      <img src="/icon/clock.svg" alt="" className="time__clock" aria-hidden="true" />
    </section>
  )
}
