import { useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'

export interface ReticleAnimation {
  move: (event: MouseEvent) => void
  press: (pressed: boolean) => void
  hide: () => void
  render: (dt: number) => void
}

export function Reticle({ ref }: { ref: Ref<ReticleAnimation> }) {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => {
    const dotElement = dot.current!
    const ringElement = ring.current!
    let x = 0
    let y = 0
    let pointerX = 0
    let pointerY = 0
    let visible = false

    return {
      move(event: MouseEvent) {
        pointerX = event.clientX
        pointerY = event.clientY
        if (!visible) {
          visible = true
          x = pointerX
          y = pointerY
          document.body.classList.add('custom-cursor-ready')
        }
        dotElement.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`
        const interactive = event.target instanceof Element && event.target.closest('a, button, [data-interactive]')
        ringElement.classList.toggle('locked', Boolean(interactive))
      },
      press(pressed: boolean) {
        ringElement.classList.toggle('pressing', pressed)
      },
      hide() {
        visible = false
        document.body.classList.remove('custom-cursor-ready')
      },
      render(dt: number) {
        if (!visible) return
        const ease = 1 - Math.exp(-16 * dt)
        x += (pointerX - x) * ease
        y += (pointerY - y) * ease
        ringElement.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      },
    }
  }, [])

  return (
    <>
      <div ref={dot} id="reticle-dot" className="reticle-dot" aria-hidden="true" />
      <div ref={ring} id="reticle-ring" className="reticle-ring" aria-hidden="true" />
    </>
  )
}
