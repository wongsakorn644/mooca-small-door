import { useEffect, useState } from 'react'
import { Bubble, Header } from '../components/ui.jsx'

// Step 4 — mooca reflects what it received, then invites a short rest.
export default function Reflect({ line, onRest, onSkip }) {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setStage(1), Math.max(3200, line.length * 70))
    return () => clearTimeout(t)
  }, [line])

  return (
    <section className="screen screen--reflect" onClick={() => stage === 0 && setStage(1)}>
      <Header title="ทบทวนกับมูก้า" onSkip={onSkip} />
      <div className="reflect__body">
        {stage === 0 ? (
          <Bubble key="a" className="reflect__bubble">
            {line}
          </Bubble>
        ) : (
          <Bubble key="b" className="reflect__bubble">
            มาพักกับมูก้าสักครู่นะ
            <br />
            <button
              type="button"
              className="link"
              onClick={(e) => {
                e.stopPropagation()
                onRest()
              }}
            >
              เริ่มพักเลย
            </button>
          </Bubble>
        )}
        <img src="/img/mooca-heart.png" alt="มูก้ากอดสิ่งที่คุณฝากไว้" className="reflect__mooca" draggable="false" />
      </div>
      {stage === 0 && <p className="reflect__tap">แตะเพื่อไปต่อ</p>}
    </section>
  )
}
