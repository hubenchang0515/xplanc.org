import type { Ref } from 'react'

export function DeckBackground({ canvasRef }: { canvasRef: Ref<HTMLCanvasElement> }) {
  return (
    <>
      <canvas ref={canvasRef} id="hyperspace-canvas" aria-hidden="true" />
      <div className="vignette-layer" aria-hidden="true" />
      <div className="crt-overlay" aria-hidden="true" />
    </>
  )
}
