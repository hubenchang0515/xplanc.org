import { createRef, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { paletteCssVariables, sampleAmbientPalette } from '../animation/ambientPalette'
import { createHyperspaceRenderer } from '../animation/hyperspace'
import type { FlightState } from '../animation/hyperspace'
import type { PortalAnimation } from '../animation/portalVisuals'
import type { ReticleAnimation } from '../components/Reticle'
import type { TelemetryAnimation } from '../components/Telemetry'
import { DEFAULT_PALETTE, PORTALS, getPortal } from '../deck'

export function useDeckAnimation(hoveredPortal: string | null, onBlur: () => void) {
  const background = useRef<HTMLCanvasElement>(null)
  const viewport = useRef<HTMLElement>(null)
  const reticle = useRef<ReticleAnimation>(null)
  const telemetry = useRef<TelemetryAnimation>(null)
  const portals = useMemo(
    () => Object.entries(PORTALS).map(([id, portal]) => ({ id, portal, ref: createRef<PortalAnimation>() })),
    [],
  )
  const activePortal = useRef(hoveredPortal)

  useLayoutEffect(() => {
    activePortal.current = hoveredPortal
  }, [hoveredPortal])

  useEffect(() => {
    const state: FlightState = {
      hoveredPortal: activePortal.current,
      warpFactor: 0,
      mouseNormX: 0,
      mouseNormY: 0,
      smoothMouseX: 0,
      smoothMouseY: 0,
      curRgb: [...DEFAULT_PALETTE.rgb],
      curRgb2: [...DEFAULT_PALETTE.rgb2],
    }
    const scene = createHyperspaceRenderer(background.current!, state)
    const rootStyle = document.documentElement.style
    const appliedPaletteProperties = new Set<string>()
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let lastTime: number | undefined
    let ambientTime = 0
    let frame = 0

    function resize() {
      const bounds = viewport.current?.getBoundingClientRect()
      const focusY = bounds ? bounds.top + bounds.height / 2 : window.innerHeight * 0.5
      scene?.resize(focusY)
      portals.forEach(({ ref }) => ref.current?.resize())
    }

    function updatePointer(x: number, y: number) {
      state.mouseNormX = (x / Math.max(1, window.innerWidth)) * 2 - 1
      state.mouseNormY = (y / Math.max(1, window.innerHeight)) * 2 - 1
    }

    function move(event: MouseEvent) {
      updatePointer(event.clientX, event.clientY)
      if (finePointer) reticle.current?.move(event)
    }

    function touchMove(event: TouchEvent) {
      const touch = event.touches[0]
      if (touch) updatePointer(touch.clientX, touch.clientY)
    }

    function pointerDown(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest('a, button')) return
      scene?.emitShockwave(event.clientX, event.clientY)
    }

    function mouseDown() {
      reticle.current?.press(true)
    }

    function mouseUp() {
      reticle.current?.press(false)
    }

    function hideReticle() {
      reticle.current?.hide()
    }

    function loop(now: number) {
      const dt = Math.max(0, Math.min(0.05, (now - (lastTime ?? now)) / 1000))
      lastTime = now
      state.hoveredPortal = activePortal.current
      ambientTime += dt

      const ambient = sampleAmbientPalette(ambientTime)
      scene?.render(dt, now, ambient)
      const liveRgb = scene ? state.curRgb : getPortal(state.hoveredPortal)?.rgb ?? ambient.rgb
      for (const [name, value] of Object.entries(paletteCssVariables(ambient, liveRgb))) {
        if (rootStyle.getPropertyValue(name) === value) continue
        rootStyle.setProperty(name, value)
        appliedPaletteProperties.add(name)
      }
      document.body.classList.toggle('warp-active', state.warpFactor > 0.25)
      portals.forEach(({ id, ref }) => ref.current?.render(dt, id === state.hoveredPortal))
      if (finePointer) reticle.current?.render(dt)
      telemetry.current?.render(now, state)

      frame = requestAnimationFrame(loop)
    }

    resize()
    document.fonts.addEventListener('loadingdone', resize)
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', move)
    window.addEventListener('touchmove', touchMove, { passive: true })
    window.addEventListener('pointerdown', pointerDown)
    window.addEventListener('blur', onBlur)
    if (finePointer) {
      window.addEventListener('mousedown', mouseDown)
      window.addEventListener('mouseup', mouseUp)
      document.addEventListener('mouseleave', hideReticle)
    }
    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      document.fonts.removeEventListener('loadingdone', resize)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('touchmove', touchMove)
      window.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('mousedown', mouseDown)
      window.removeEventListener('mouseup', mouseUp)
      document.removeEventListener('mouseleave', hideReticle)
      document.body.classList.remove('warp-active', 'custom-cursor-ready')
      appliedPaletteProperties.forEach((name) => rootStyle.removeProperty(name))
    }
  }, [onBlur, portals])

  return { background, viewport, reticle, telemetry, portals }
}
