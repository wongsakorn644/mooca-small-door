import { useEffect, useRef } from 'react'

// Dotted sphere for the rest phase, drawn on a 2D canvas.
// - breathRef.current (0..1) scales the sphere: it grows on the in-breath, shrinks on the out-breath.
// - progressRef.current (0..1) moves the colours from the user's emotions to ooca turquoise/blue,
//   and smooths the surface from rough waves to a calm sphere.

const TEAL = [0, 196, 179]
const BLUE = [31, 119, 223]

function hex(h) {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

export default function ParticleSphere({ colors, breathRef, progressRef, reduceMotion }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Fibonacci sphere points
    const N = reduceMotion ? 1200 : 2600
    const pts = []
    const ga = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const th = ga * i
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r])
    }
    const emo = (colors.length ? colors : ['#00C4B3', '#1F77DF']).map(hex)
    const proj = new Array(N)

    let raf
    let t0 = performance.now()
    const draw = (now) => {
      const t = (now - t0) / 1000
      const breath = breathRef.current
      const progress = progressRef.current
      const rough = (1 - progress) * 0.22 + 0.04
      const R = Math.min(w, h) * (0.36 + breath * 0.08)
      const rot = t * (reduceMotion ? 0.04 : 0.12)
      const cr = Math.cos(rot)
      const sr = Math.sin(rot)
      const tilt = 0.35
      const ct = Math.cos(tilt)
      const st = Math.sin(tilt)
      const cx = w / 2
      const cy = h / 2

      for (let i = 0; i < N; i++) {
        const [x0, y0, z0] = pts[i]
        // wave displacement — strong at first, calmer as progress grows
        const wave =
          Math.sin(x0 * 3.1 + t * 0.9) * Math.cos(y0 * 2.7 - t * 0.7) +
          Math.sin(z0 * 4.3 + t * 0.6) * 0.6
        const s = 1 + wave * rough
        let x = x0 * s
        let y = y0 * s
        let z = z0 * s
        // rotate around Y then tilt around X
        const xr = x * cr - z * sr
        const zr = x * sr + z * cr
        const yr = y * ct - zr * st
        const zt = y * st + zr * ct
        const p = 2.6 / (2.6 + zt)
        proj[i] = { x: cx + xr * R * p, y: cy + yr * R * p, z: zt, k: (y0 + 1) / 2, i }
      }
      proj.sort((a, b) => a.z - b.z)

      ctx.clearRect(0, 0, w, h)
      for (const q of proj) {
        // emotion colour by latitude band, then blended to ooca turquoise→blue
        const e = emo[Math.floor(q.k * emo.length * 0.999)]
        const calm = mix(TEAL, BLUE, q.k * 0.8 + (q.z + 1) * 0.1)
        const c = mix(e, calm, Math.min(1, progress * 1.3))
        const depth = (1 - q.z) / 2
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.25 + depth * 0.75})`
        const size = 0.5 + depth * 1.35
        ctx.beginPath()
        ctx.arc(q.x, q.y, size, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [colors, breathRef, progressRef, reduceMotion])

  return <canvas ref={canvasRef} className="sphere" aria-hidden="true" />
}
