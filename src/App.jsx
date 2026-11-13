import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { byId, TIMES, needById, reflectionFor } from './data.js'
import { hasRisk } from './lib/risk.js'
import { createRestAudio } from './lib/restAudio.js'
import { Loading, Hello } from './screens/Intro.jsx'
import Emotions from './screens/Emotions.jsx'
import Tell from './screens/Tell.jsx'
import Time from './screens/Time.jsx'
import Reflect from './screens/Reflect.jsx'
import { SoundAsk, Rest } from './screens/Rest.jsx'
import { Need, Card, Care } from './screens/Ending.jsx'

// Flow: loading → hello → emotions (or tell) → time → reflect → sound ask → rest → need → card
// Off-path: "แค่อยากพักเฉยๆ" / skip → sound ask → rest → card · risk words → care
// Nothing is stored: everything lives in memory and is gone when the tab closes.

const initial = { emotions: [], told: false, time: null, need: null, justRest: false, care: false }

export default function App() {
  const [step, setStep] = useState('loading')
  const [s, setS] = useState(initial)
  const [soundOn, setSoundOn] = useState(false)
  const [notice, setNotice] = useState('')
  const audioRef = useRef(null)
  const [audioVersion, setAudioVersion] = useState(0)

  const set = (patch) => setS((prev) => ({ ...prev, ...patch }))
  const emotionDefs = useMemo(() => s.emotions.map((e) => byId[e.id]), [s.emotions])
  const onlyUnknown = emotionDefs.length > 0 && emotionDefs.every((e) => e.id === 'unknown')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const stopAudio = () => {
    audioRef.current?.stop()
    audioRef.current = null
  }

  const restart = () => {
    stopAudio()
    setSoundOn(false)
    setNotice('')
    setS(initial)
    setStep('hello')
  }

  const startAudio = async () => {
    stopAudio()
    const tones = emotionDefs.filter((e) => e.id !== 'unknown').map((e) => e.tone)
    const a = createRestAudio(tones)
    if (!a || !(await a.resume())) {
      a?.stop()
      setSoundOn(false)
      setNotice('เปิดเสียงบนเครื่องนี้ไม่ได้ เลยพักแบบภาพอย่างเดียวนะ')
      return false
    }
    audioRef.current = a
    setAudioVersion((v) => v + 1)
    setSoundOn(true)
    setNotice('')
    return true
  }

  const afterEmotions = () => {
    if (!s.emotions.length && !s.told) return goRestOnly()
    if (!s.emotions.length || onlyUnknown) return setStep('reflect') // nothing to time
    setStep('time')
  }

  const goRestOnly = () => {
    set({ justRest: true })
    setStep('sound')
  }

  const sRef = useRef(s)
  sRef.current = s
  const finishRest = useCallback(() => {
    stopAudio()
    setSoundOn(false)
    const cur = sRef.current
    const defs = cur.emotions.map((e) => byId[e.id])
    const positive = defs.length > 0 && defs.every((e) => e.positive)
    if (cur.care) setStep('care')
    else if (cur.justRest || positive) setStep('card') // positive-only: no "what do you need" question
    else setStep('need')
  }, [])

  const card = useMemo(() => buildCard(s, emotionDefs, onlyUnknown), [s, emotionDefs, onlyUnknown])

  return (
    <main className="app">
      <div className="phone">
        {step === 'loading' && <Loading onDone={() => setStep('hello')} />}
        {step === 'hello' && <Hello onStart={() => setStep('emotions')} onJustRest={goRestOnly} />}
        {step === 'emotions' && (
          <Emotions
            value={s.emotions}
            onChange={(emotions) => set({ emotions })}
            onNext={afterEmotions}
            onSkip={() => (s.emotions.length ? afterEmotions() : goRestOnly())}
            onTell={() => setStep('tell')}
          />
        )}
        {step === 'tell' && (
          <Tell
            onSkip={() => setStep('emotions')}
            onSubmit={(text) => {
              if (hasRisk(text)) {
                set({ care: true })
                setStep('care')
                return
              }
              if (!text && !s.emotions.length) return setStep('emotions')
              set({ told: !!text })
              if (s.emotions.length && !onlyUnknown) setStep('time')
              else setStep('reflect')
            }}
          />
        )}
        {step === 'time' && (
          <Time
            onPick={(time) => {
              set({ time })
              setStep('reflect')
            }}
            onSkip={() => {
              set({ time: 'skip' })
              setStep('reflect')
            }}
          />
        )}
        {step === 'reflect' && (
          <Reflect
            line={reflectionFor({ emotions: emotionDefs, time: s.time || 'skip', text: s.told })}
            onRest={() => setStep('sound')}
            onSkip={() => setStep('sound')}
          />
        )}
        {step === 'sound' && (
          <SoundAsk
            onListen={async () => {
              await startAudio()
              setStep('rest')
            }}
            onVisualOnly={() => {
              setSoundOn(false)
              setNotice('')
              setStep('rest')
            }}
          />
        )}
        {step === 'rest' && (
          <Rest
            key={audioVersion}
            emotions={emotionDefs}
            audio={audioRef.current}
            soundOn={soundOn}
            notice={notice}
            onToggleSound={async () => {
              if (audioRef.current) {
                const next = !soundOn
                audioRef.current.setMuted(!next)
                setSoundOn(next)
              } else {
                await startAudio()
              }
            }}
            onDone={finishRest}
          />
        )}
        {step === 'need' && (
          <Need
            onPick={(need) => {
              set({ need })
              setStep('card')
            }}
            onSkip={() => setStep('card')}
          />
        )}
        {step === 'card' && <Card card={card} onRestart={restart} />}
        {step === 'care' && (
          <Care
            onRest={() => {
              setStep('sound')
            }}
          />
        )}
      </div>
    </main>
  )
}

function buildCard(s, defs, onlyUnknown) {
  const time = TIMES.find((t) => t.id === s.time)
  const need = s.need ? needById[s.need] : null

  // Sentence as segments; `hl` marks the words that came from the user's own choices.
  let sentence
  const named = defs.filter((d) => d.noun)
  if (!defs.length && s.told) sentence = [{ t: 'วันนี้คุณได้' }, { t: 'เล่าเรื่องที่ค้างอยู่', hl: true }, { t: 'ให้มูก้าฟัง' }]
  else if (!defs.length) sentence = [{ t: 'วันนี้คุณให้เวลาตัวเอง' }, { t: 'ได้พัก', hl: true }]
  else if (onlyUnknown) sentence = [{ t: 'วันนี้คุณ' }, { t: 'ไม่รู้ว่ารู้สึกอะไร', hl: true }, { t: ' และนั่นก็โอเค' }]
  else {
    const extra = defs.length - 1
    sentence = [{ t: 'วันนี้คุณฝาก\n' }, { t: named[0].noun, hl: true }]
    if (extra > 0) sentence.push({ t: ` กับอีก ${extra} อย่าง` })
    if (time) sentence.push({ t: ' เรื่องที่ ' }, { t: time.phrase, hl: true })
    sentence.push({ t: '\nไว้กับมูก้า' })
  }

  const base = named[0] || byId.unknown
  const heavy = defs.some((d) => d.id === 'sad') && defs.some((d) => d.id === 'pressure')
  return {
    sentence,
    insight: base.insight,
    step: need?.step || base.step,
    colors: defs.length ? base.card : ['#3EA9B9', '#CBEBE3'],
    oocaPrimary: need?.ooca === 'primary' || heavy,
    gentleCare: heavy,
  }
}
