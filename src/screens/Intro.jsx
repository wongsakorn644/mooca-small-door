import { useEffect, useState } from 'react'
import { Bubble } from '../components/ui.jsx'

export function Loading({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <section className="screen screen--loading" aria-label="กำลังโหลด">
      <img src="/img/mooca-loading.png" alt="มูก้า" className="loading__mooca" />
      <div className="loading__dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </section>
  )
}

// Step 1 — greet. The start button pops in after the bubble (Figma: hello 1 → hello 2).
export function Hello({ onStart, onJustRest }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className={`screen screen--hello ${ready ? 'is-ready' : ''}`}>
      <div className="hello__glow hello__glow--a" />
      <div className="hello__glow hello__glow--b" />
      <div className="hello__glow hello__glow--c" />

      <div className="hello__talk">
        <Bubble className="hello__bubble">
          "วันนี้ถืออะไรมาบ้างนะ"
          <br />
          บอก MOOCA ได้นะ
        </Bubble>
        <button type="button" className="hello__start" onClick={onStart} disabled={!ready} aria-hidden={!ready}>
          เริ่ม
        </button>
      </div>

      <div className="hello__hill" aria-hidden="true" />
      <img src="/img/mooca-start.png" alt="มูก้ายิ้มทักทาย" className="hello__mooca" />

      <button type="button" className={`link hello__rest ${ready ? 'is-in' : ''}`} onClick={onJustRest}>
        แค่อยากพักเฉยๆ
      </button>
    </section>
  )
}
