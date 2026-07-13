'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Renders children on a fixed 1920x1080 design canvas and scales it to fit any
 * viewport (letterboxed). Tune once at 1920x1080, fits any projector.
 */
export function FitToScreen({
  designW = 1920,
  designH = 1080,
  children,
}: {
  designW?: number
  designH?: number
  children: ReactNode
}) {
  const outer = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = outer.current
    if (!el) return
    const fit = () => {
      const { clientWidth: w, clientHeight: h } = el
      if (w && h) setScale(Math.min(w / designW, h / designH))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [designW, designH])

  return (
    <div
      ref={outer}
      className="flex h-full w-full items-center justify-center overflow-hidden"
    >
      <div
        style={{
          width: designW,
          height: designH,
          flexShrink: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
