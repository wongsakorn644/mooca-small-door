import { useRef, useState } from 'react'
import { Header, PrimaryButton } from '../components/ui.jsx'

const LIMIT = 50

// "เราอยากเล่าให้ฟังเอง" — optional free text. It never leaves this screen:
// it is only checked for risk words, then dropped (not stored, not sent).
export default function Tell({ onSubmit, onSkip }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  const submit = () => onSubmit(text.trim())

  return (
    <section className="screen screen--tell">
      <Header title="ถืออะไรไว้ บอกได้เลย" onSkip={onSkip} />
      <div className="tell__stage">
        <img src="/img/mooca-listener.png" alt="มูก้าตั้งใจฟัง" className="tell__mooca" draggable="false" />
      </div>
      <div className="sheet tell__sheet">
        <form
          className="tell__field"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <label htmlFor="tell-input" className="sr-only">
            เล่าให้มูก้าฟัง
          </label>
          <input
            id="tell-input"
            ref={inputRef}
            value={text}
            maxLength={LIMIT}
            onChange={(e) => setText(e.target.value.slice(0, LIMIT))}
            placeholder="ฉันรู้สึกว่า..."
            autoComplete="off"
            enterKeyHint="send"
          />
          <button type="submit" className="tell__send" aria-label="ส่งให้มูก้า">
            <img src="/icon/send.svg" alt="" />
          </button>
        </form>
        <div className="tell__meta">
          <span>ข้อความนี้ไม่ถูกเก็บ และไม่มีใครเห็น</span>
          <span>
            {text.length}/{LIMIT}
          </span>
        </div>
        <PrimaryButton className="tell__next" onClick={submit}>
          ถัดไป
        </PrimaryButton>
      </div>
    </section>
  )
}
