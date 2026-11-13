import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { NEEDS, OOCA_URL, HOTLINE } from '../data.js'
import { Header, Icon, PrimaryButton } from '../components/ui.jsx'

// Step 6 — "what do you want now?" (one tap, skippable). It picks the card's small step and
// decides whether the ooca button is a quiet link or the main action.
export function Need({ onPick, onSkip }) {
  return (
    <section className="screen screen--need">
      <Header title="อีกนิดเดียว" onSkip={onSkip} />
      <p className="need__ask">ตอนนี้อยากได้อะไรต่อ</p>
      <div className="need__list">
        {NEEDS.map((n, i) => (
          <button
            key={n.id}
            type="button"
            className="glass-btn need__item"
            style={{ '--tint': n.tint, animationDelay: `${i * 70}ms` }}
            onClick={() => onPick(n.id)}
          >
            {n.label}
          </button>
        ))}
      </div>
      <div className="need__ground" aria-hidden="true" />
      {/* mooca fills only the space left under the buttons, so it shrinks on short phones */}
      <div className="need__scene">
        <img src="/img/mooca-stand.png" alt="มูก้ายืนรอ" className="need__mooca" draggable="false" />
      </div>
    </section>
  )
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const today = () => {
  const d = new Date()
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// Step 7 — today's card, built from what the user gave along the way.
export function Card({ card, onRestart }) {
  const cardRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const save = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        filter: (n) => !(n.classList && n.classList.contains('card__download')),
      })
      const name = `mooca-card-${Date.now()}.png`
      const blob = await (await fetch(url)).blob()
      const file = new File([blob], name, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] }) && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        await navigator.share({ files: [file] }).catch(() => {})
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = name
        a.click()
      }
      setSaveMsg('เก็บการ์ดแล้ว')
    } catch {
      setSaveMsg('บันทึกไม่สำเร็จ ลองแคปหน้าจอแทนได้นะ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="screen screen--card">
      <Header title="การ์ดวันนี้" />
      <article
        ref={cardRef}
        className="today-card"
        style={{ '--c1': card.colors[0], '--c2': card.colors[1] }}
        aria-label="การ์ดวันนี้"
      >
        <div className="today-card__top">
          <span className="today-card__date">{today()}</span>
          <button type="button" className="card__download" onClick={save} disabled={saving} aria-label="บันทึกการ์ดเป็นรูป">
            <Icon name="download" />
          </button>
        </div>
        <p className="today-card__sentence">
          {card.sentence.map((seg, i) =>
            seg.hl ? (
              <strong key={i} className="today-card__hl">
                {seg.t}
              </strong>
            ) : (
              <span key={i}>{seg.t}</span>
            ),
          )}
        </p>
        <p className="today-card__insight">
          {card.insight.map((l, i) => (
            <span key={i}>
              {l}
              <br />
            </span>
          ))}
        </p>
        <div className="today-card__art">
          <div className="today-card__bubble">
            ลองเริ่มก้าวเล็กๆ:
            <br />
            {card.step}
          </div>
          <img src="/img/card-window.png" alt="" className="today-card__window" draggable="false" />
        </div>
      </article>
      <p className="card__msg" aria-live="polite">
        {saveMsg}
      </p>

      <div className="card__after">
        {card.oocaPrimary ? (
          <>
            <PrimaryButton onClick={() => window.open(OOCA_URL, '_blank', 'noopener')}>เล่าให้นักจิตวิทยา ooca ฟัง</PrimaryButton>
            <p className="card__note">เรื่องเล็กก็คุยได้นะ ไม่ต้องรอให้หนักก่อน</p>
          </>
        ) : (
          <a className="link card__ooca" href={OOCA_URL} target="_blank" rel="noopener noreferrer">
            คุยกับ ooca
          </a>
        )}
        {card.gentleCare && (
          <p className="card__note">
            ถ้าช่วงนี้หนักเกินไป โทรคุยได้ที่สายด่วนสุขภาพจิต <a href={`tel:${HOTLINE}`}>{HOTLINE}</a> ตลอด 24 ชั่วโมง
          </p>
        )}
        <button type="button" className="link link--muted card__restart" onClick={onRestart}>
          กลับไปหน้าแรก
        </button>
      </div>
    </section>
  )
}

// Special-care ending: shown when free text contains risk words.
export function Care({ onRest }) {
  return (
    <section className="screen screen--soft screen--care">
      <Header title="มูก้าอยู่ตรงนี้นะ" />
      <div className="soft-card care">
        <img src="/img/mooca-bubble.png" alt="มูก้า" className="soft-card__mooca care__mooca" draggable="false" />
        <p className="care__text">
          ขอบคุณที่ไว้ใจเล่าให้มูก้าฟังนะ
          <br />
          เรื่องนี้ดูหนักมาก
          <br />
          คุณไม่ควรต้องแบกไว้คนเดียว
          <br />
          ตอนนี้มีคนที่พร้อมรับฟังคุณอยู่
        </p>
        <PrimaryButton onClick={() => window.open(OOCA_URL, '_blank', 'noopener')}>คุยกับนักจิตวิทยาที่ ooca</PrimaryButton>
        <a className="pill pill--outline care__call" href={`tel:${HOTLINE}`}>
          โทรสายด่วนสุขภาพจิต {HOTLINE} (ฟรี 24 ชม.)
        </a>
        <button type="button" className="link link--muted" onClick={onRest}>
          ขอพักกับมูก้าก่อน
        </button>
      </div>
    </section>
  )
}
