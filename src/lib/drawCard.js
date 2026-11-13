// Draws today's card onto a canvas for saving as a PNG.
// Snapshot libraries (DOM → SVG → image) crop or misplace content on iPhone Safari, so the card is
// redrawn with the Canvas 2D API instead. Positions are read from the card on screen, so the saved
// image matches what the user sees.

const SCALE = 2

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const px = (v) => parseFloat(v) || 0

// Lay out styled segments into lines no wider than maxW. Breaks at spaces and explicit "\n".
function layoutSegments(ctx, segments, maxW, fontFor) {
  const lines = [[]]
  let lineW = 0
  for (const seg of segments) {
    const parts = seg.t.split('\n')
    parts.forEach((part, pi) => {
      if (pi > 0) {
        lines.push([])
        lineW = 0
      }
      const words = part.split(/(\s+)/).filter(Boolean)
      for (const word of words) {
        ctx.font = fontFor(seg)
        const w = ctx.measureText(word).width
        const isSpace = /^\s+$/.test(word)
        if (lineW + w > maxW && lineW > 0 && !isSpace) {
          lines.push([])
          lineW = 0
        }
        if (isSpace && lineW === 0) continue
        lines[lines.length - 1].push({ text: word, seg, w })
        lineW += w
      }
    })
  }
  return lines.filter((l) => l.length)
}

// Wrap plain text, breaking at spaces; falls back to the whole string.
function wrapText(ctx, text, maxW) {
  const words = text.split(/(\s+)/).filter(Boolean)
  const lines = ['']
  for (const word of words) {
    const test = lines[lines.length - 1] + word
    if (ctx.measureText(test).width > maxW && lines[lines.length - 1].trim()) lines.push(word.trim())
    else lines[lines.length - 1] = test
  }
  return lines.map((l) => l.trim()).filter(Boolean)
}

export async function drawCardPng(node, card, dateText) {
  await document.fonts?.ready
  // Measure only after the card's slide-in animation has settled.
  await Promise.all((node.getAnimations?.() || []).map((a) => a.finished.catch(() => {})))
  const base = node.getBoundingClientRect()
  const W = base.width
  const H = base.height
  const rel = (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }
  }
  const q = (sel) => node.querySelector(sel)
  const family = getComputedStyle(node).fontFamily

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(W * SCALE)
  canvas.height = Math.round(H * SCALE)
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  // Background
  roundRect(ctx, 0, 0, W, H, 32)
  ctx.save()
  ctx.clip()
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, card.colors[0])
  g.addColorStop(0.22, card.colors[0])
  g.addColorStop(1, card.colors[1])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  ctx.textBaseline = 'middle'
  const shadowOn = () => {
    ctx.shadowColor = 'rgba(0,0,0,0.12)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 1
  }
  const shadowOff = () => {
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }

  // Date
  const dateEl = q('.today-card__date')
  const d = rel(dateEl)
  ctx.font = `400 13px ${family}`
  ctx.fillStyle = '#fff'
  ctx.fillText(dateText, d.x, d.y + d.h / 2)

  // Sentence (highlighted words come from the user's choices)
  const sEl = q('.today-card__sentence')
  const s = rel(sEl)
  const sStyle = getComputedStyle(sEl)
  const sSize = px(sStyle.fontSize)
  const sLH = px(sStyle.lineHeight) || sSize * 1.4
  const fontFor = (seg) => `${seg.hl ? 500 : 300} ${sSize}px ${family}`
  shadowOn()
  layoutSegments(ctx, card.sentence, s.w + 1, fontFor).forEach((line, i) => {
    let x = s.x
    const y = s.y + sLH * (i + 0.5)
    for (const word of line) {
      ctx.font = fontFor(word.seg)
      ctx.fillStyle = word.seg.hl ? '#ffe6a3' : '#fff'
      ctx.fillText(word.text, x, y)
      x += word.w
    }
  })

  // Insight
  const iEl = q('.today-card__insight')
  const ins = rel(iEl)
  const iStyle = getComputedStyle(iEl)
  const iSize = px(iStyle.fontSize)
  const iLH = px(iStyle.lineHeight) || iSize * 1.4
  ctx.font = `500 ${iSize}px ${family}`
  ctx.fillStyle = '#fff'
  let row = 0
  card.insight.forEach((l) => {
    wrapText(ctx, l, ins.w + 1).forEach((t) => {
      ctx.fillText(t, ins.x, ins.y + iLH * (row + 0.5))
      row++
    })
  })
  shadowOff()

  // Window art (object-fit: contain, anchored left-bottom)
  const wEl = q('.today-card__window')
  const wr = rel(wEl)
  const img = await loadImage(wEl.currentSrc || wEl.src)
  const fit = Math.min(wr.w / img.naturalWidth, wr.h / img.naturalHeight)
  const iw = img.naturalWidth * fit
  const ih = img.naturalHeight * fit
  ctx.drawImage(img, wr.x, wr.y + wr.h - ih, iw, ih)

  // Speech bubble with the small step
  const bEl = q('.today-card__bubble')
  const b = rel(bEl)
  ctx.fillStyle = '#fff'
  roundRect(ctx, b.x, b.y, b.w, b.h, Math.min(30, b.h / 2))
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(b.x + b.w / 2 - 8, b.y + b.h - 0.5)
  ctx.lineTo(b.x + b.w / 2 + 8, b.y + b.h - 0.5)
  ctx.lineTo(b.x + b.w / 2, b.y + b.h + 8)
  ctx.closePath()
  ctx.fill()
  const bStyle = getComputedStyle(bEl)
  const bSize = px(bStyle.fontSize)
  const bLH = px(bStyle.lineHeight) || bSize * 1.4
  const padX = px(bStyle.paddingLeft)
  const padY = px(bStyle.paddingTop)
  ctx.font = `400 ${bSize}px ${family}`
  ctx.fillStyle = '#2354a6'
  ctx.textAlign = 'center'
  const bLines = ['ลองเริ่มก้าวเล็กๆ:', ...wrapText(ctx, card.step, b.w - padX * 2 + 1)]
  bLines.forEach((t, i) => ctx.fillText(t, b.x + b.w / 2, b.y + padY + bLH * (i + 0.5)))
  ctx.textAlign = 'left'

  ctx.restore()

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}
