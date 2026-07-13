'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Official } from '@/lib/types'
import { PhotoBlock } from './photo-block'

const GAP = 0.14 // gap as a fraction of cell width

// Pick the column count + cell width that fills W x H as large as possible.
function bestFit(n: number, W: number, H: number, aspect: number) {
  if (!n || !W || !H) return { cols: 1, cellW: 0 }
  let best = { cols: 1, cellW: 0 }
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const cellByW = W / (cols + (cols - 1) * GAP)
    const cellByH = (H / (rows + (rows - 1) * GAP)) * aspect
    const cellW = Math.min(cellByW, cellByH)
    if (cellW > best.cellW) best = { cols, cellW }
  }
  return best
}

export function AutoFitGrid({
  officials,
  cellAspect = 0.82,
}: {
  officials: Official[]
  cellAspect?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { cols, cellW } = useMemo(
    () => bestFit(officials.length, box.w, box.h, cellAspect),
    [officials.length, box.w, box.h, cellAspect],
  )

  return (
    <div ref={ref} className="flex min-h-0 flex-1 items-center justify-center">
      {cellW > 0 && (
        <div
          className="grid place-content-center"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
            gap: `${cellW * GAP}px`,
          }}
        >
          {officials.map((o) => (
            <div key={o.id} style={{ width: cellW, containerType: 'inline-size' }}>
              <PhotoBlock official={o} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
